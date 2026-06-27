import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

// FLUX.2 character-consistent storyboard.
// Creates one job per scene, then fires the Modal consistent_scenes endpoint,
// which calls back per-scene as each image completes.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scene_prompts,
      project_id,
      seed = 42,
      width = 1024,
      height = 1024,
      num_inference_steps = 28,
      guidance_scale = 4.0,
    } = body;

    if (!Array.isArray(scene_prompts) || scene_prompts.length === 0) {
      return NextResponse.json({ error: 'scene_prompts (non-empty array) required' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Derive the consistent_scenes endpoint from the base generate webhook
    const baseWebhook = process.env.MODAL_WEBHOOK_URL || '';
    const SCENES_URL = process.env.MODAL_SCENES_URL
      || baseWebhook.replace('ai-creator-generate', 'ai-creator-consistent-scenes');

    if (!SUPABASE_URL || !SUPABASE_KEY || !SCENES_URL) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Create one image job per scene
    const cleanPrompts: string[] = scene_prompts.map((p: string) =>
      String(p).trim().replace(/^["']+|["']+$/g, '')
    );

    const rows = cleanPrompts.map((p) => ({
      prompt: p,
      status: 'processing',
      model: 'flux2',
      project_id: project_id || null,
      job_type: 'image',
    }));

    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .insert(rows)
      .select();

    if (jobError || !jobs) {
      return NextResponse.json({ error: 'Failed to create jobs: ' + jobError?.message }, { status: 500 });
    }

    // Preserve scene order by matching prompt order
    const jobIds = jobs.map((j: any) => j.id);

    const modalPayload = {
      scene_prompts: cleanPrompts,
      seed,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      output_prefix: `scene_${project_id || 'x'}`,
      upload_to_r2: true,
      job_ids: jobIds,
      callback_url: `${req.nextUrl.origin}/api/job-callback`,
    };

    // Fire and forget — Modal calls back per scene as each image finishes
    fetch(SCENES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalPayload),
    }).catch(async () => {
      for (const id of jobIds) {
        await supabase.from('jobs').update({ status: 'failed' }).eq('id', id);
      }
    });

    return NextResponse.json({ job_ids: jobIds, count: jobIds.length, status: 'processing' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
