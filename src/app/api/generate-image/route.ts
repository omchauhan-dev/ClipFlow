import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from '@/lib/telegram';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model = "flux1", seed = 42, project_id, width = 1024, height = 1024, num_inference_steps = 28 } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const cleanPrompt = String(prompt).trim().replace(/^["']+|["']+$/g, '');
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // All image generation goes through the ComfyUI worker now.
    const COMFYUI_URL = process.env.COMFYUI_API_URL || process.env.MODAL_WEBHOOK_URL;

    if (!SUPABASE_URL || !SUPABASE_KEY || !COMFYUI_URL) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({ prompt: cleanPrompt, status: 'processing', model, project_id: project_id || null, job_type: 'image' })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Failed to create job: ' + jobError?.message }, { status: 500 });
    }

    // ComfyUI builder maps model names to workflow templates.
    const modelMap: Record<string, string> = { "flux": "flux2", "flux1": "flux2", "flux2": "flux2", "ideogram4": "ideogram4", "krea2": "krea2" };
    const modalModel = modelMap[model] || "flux2";

    const modalPayload = {
      model: modalModel,
      prompt: cleanPrompt,
      seed,
      output_name: `image_${job.id}.png`,
      upload_to_r2: true,
      width,
      height,
      steps: num_inference_steps,
      callback_url: `${req.nextUrl.origin}/api/job-callback`,
      job_id: job.id,
    };

    // Fire request to Modal worker — await it so the serverless function
    // stays alive long enough for Vercel to deliver the HTTP request.
    let result: any = null;
    try {
      const res = await fetch(COMFYUI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalPayload),
      });
      result = await res.json();
    } catch (e) {
      await supabase.from('jobs').update({ status: 'failed' }).eq('id', job.id);
      return NextResponse.json({ job_id: job.id, status: 'failed', error: 'Modal worker unreachable' });
    }

    if (result?.r2_url) {
      await supabase.from('jobs').update({ status: 'completed', image_url: result.r2_url, r2_url: result.r2_url }).eq('id', job.id);
      await sendTelegramNotification(`🖼 <b>Image Generated</b>\nModel: ${model}\nPrompt: ${cleanPrompt.slice(0, 80)}`);
    } else {
      await supabase.from('jobs').update({ status: 'failed', error: result?.error || 'Generation failed' }).eq('id', job.id);
    }

    return NextResponse.json({ job_id: job.id, status: result?.r2_url ? 'completed' : 'failed', r2_url: result?.r2_url || null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
