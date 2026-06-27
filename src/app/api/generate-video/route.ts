import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from '@/lib/telegram';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model = "ltx", duration = 5, project_id, width = 1024, height = 576, num_inference_steps = 20, seed, image } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const cleanPrompt = String(prompt).trim();
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // All video generation goes through the ComfyUI worker now.
    const COMFYUI_URL = process.env.COMFYUI_API_URL || process.env.MODAL_WEBHOOK_URL;

    if (!SUPABASE_URL || !SUPABASE_KEY || !COMFYUI_URL) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({ prompt: cleanPrompt, status: 'processing', model, project_id: project_id || null, job_type: 'video' })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Failed to create job: ' + jobError?.message }, { status: 500 });
    }

    // Map studio model ids -> ComfyUI builder model keys.
    //  lip-sync (close-up, audio-driven) -> ltx-id-lora template
    //  video model + input image          -> ltx-i2v template
    //  everything else                    -> ltx text-to-video template
    const modelMap: Record<string, string> = {
      "ltx": "ltx-2.3", "ltx-2.3": "ltx-2.3", "wan": "ltx-2.3", "hunyuan": "ltx-2.3",
      "ltx-cond": "ltx-2.3", "wan-animate": "ltx-2.3",
      "lipsync": "ltx-id-lora", "ltx-id-lora": "ltx-id-lora", "talking": "ltx-id-lora",
      "ltx-i2v": "ltx-i2v", "i2v": "ltx-i2v",
    };
    let modalModel = modelMap[model] || "ltx-2.3";
    // A standard video model given a start image becomes image-to-video.
    if (image && (modalModel === 'ltx-2.3')) {
      modalModel = 'ltx-i2v';
    }

    const payload: any = {
      model: modalModel,
      prompt: cleanPrompt,
      seed: seed || Math.floor(Math.random() * 10000),
      output_name: `video_${job.id}.mp4`,
      upload_to_r2: true,
      width,
      height,
      duration,
      callback_url: `${req.nextUrl.origin}/api/job-callback`,
      job_id: job.id,
    };
    // i2v and lip-sync need an input image fetched into the worker.
    if ((modalModel === 'ltx-i2v' || modalModel === 'ltx-id-lora') && image) {
      const fname = `input_${job.id}.png`;
      payload.image_filename = fname;
      // http(s) URL -> input_files (worker downloads); data URI -> input_files_b64 (worker decodes)
      if (/^https?:\/\//i.test(image)) {
        payload.input_files = { [fname]: image };
      } else {
        payload.input_files_b64 = { [fname]: image };
      }
    }
    if (modalModel === 'ltx-id-lora' && body.audio_url) {
      payload.audio_filename = `audio_${job.id}.mp3`;
      payload.input_files = { ...(payload.input_files || {}), [`audio_${job.id}.mp3`]: body.audio_url };
    }

    // Fire-and-forget; the worker calls back when done (cold start can take minutes).
    fetch(COMFYUI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        const outputUrl = result.r2_url || result.output || null;
        if (outputUrl) {
          await supabase.from('jobs').update({ status: 'completed', image_url: outputUrl, r2_url: outputUrl }).eq('id', job.id);
          await sendTelegramNotification(`🎬 <b>Video Generated</b>\nModel: ${model}\nPrompt: ${cleanPrompt.slice(0, 80)}`);
        }
        // If no url yet, the callback_url path will finalize the job.
      }
    }).catch(async () => {
      // leave as processing; callback may still finalize. Mark failed only on hard error.
    });

    return NextResponse.json({ job_id: job.id, status: 'processing' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
