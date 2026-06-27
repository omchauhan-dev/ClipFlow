import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from '@/lib/telegram';

export const maxDuration = 60;

/**
 * Talking-avatar / UGC video via LongCat-Video-Avatar 1.5.
 * Full-body motion + hand gestures + lip-sync on ANY framing (not just close-up).
 *
 * Body: {
 *   image_url   (required) - the spokesperson image
 *   text?       - narration to speak (server runs ElevenLabs TTS)
 *   audio_url?  - OR provide a ready audio file (skips TTS)
 *   voice_id?   - ElevenLabs voice (default Sarah)
 *   prompt?     - motion/scene description
 *   resolution? - "480p" | "720p"
 *   num_segments? - >1 = longer video
 *   project_id?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      image_url,
      text,
      audio_url,
      voice_id,
      prompt,
      resolution = '480p',
      num_segments = 1,
      project_id,
    } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'image_url required' }, { status: 400 });
    }
    if (!text && !audio_url) {
      return NextResponse.json({ error: 'Provide text or audio_url' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const LONGCAT_URL = process.env.LONGCAT_API_URL;

    if (!SUPABASE_URL || !SUPABASE_KEY || !LONGCAT_URL) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        prompt: text || prompt || 'talking avatar',
        status: 'processing',
        model: 'longcat-avatar',
        project_id: project_id || null,
        job_type: 'video',
      })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Failed to create job: ' + jobError?.message }, { status: 500 });
    }

    const payload: Record<string, unknown> = {
      image_url,
      resolution,
      num_segments,
      output_name: `ugc_${job.id}.mp4`,
      callback_url: `${req.nextUrl.origin}/api/job-callback`,
      job_id: job.id,
    };
    if (text) payload.text = text;
    if (audio_url) payload.audio_url = audio_url;
    if (voice_id) payload.voice_id = voice_id;
    if (prompt) payload.prompt = prompt;

    // Fire-and-forget; LongCat calls back via callback_url when done (long GPU job).
    fetch(LONGCAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        const outputUrl = result.r2_url || null;
        if (outputUrl) {
          await supabase.from('jobs').update({ status: 'completed', image_url: outputUrl, r2_url: outputUrl }).eq('id', job.id);
          await sendTelegramNotification(`🗣 <b>UGC Avatar Generated</b>\nPrompt: ${String(text || prompt || '').slice(0, 80)}`);
        }
      }
      // otherwise the callback finalizes the job
    }).catch(() => {
      // leave processing; callback may still finalize
    });

    return NextResponse.json({ job_id: job.id, status: 'processing' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
