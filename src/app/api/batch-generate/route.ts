import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

const MODEL_COSTS: Record<string, number> = {
  'ltx-2.3': 0.40, 'ltx': 0.40, 'wan': 0.80, 'flux': 0.20, 'flux1': 0.20, 'flux2': 0.30,
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prompts, model = 'ltx', type = 'video', project_id, options = {} } = body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'prompts array required' }, { status: 400 });
    }

    if (prompts.length > 50) {
      return NextResponse.json({ error: 'Max 50 per batch' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const MODAL_WEBHOOK_URL = process.env.MODAL_WEBHOOK_URL!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Verify user + check credits
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const costPerItem = MODEL_COSTS[model] || 0.40;
    const discount = prompts.length >= 21 ? 0.8 : prompts.length >= 6 ? 0.9 : 1;
    const totalCost = costPerItem * prompts.length * discount;

    // Deduct credits atomically
    const { data: newBalance, error: creditError } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: totalCost,
      p_model: model,
      p_job_id: `batch_${Date.now()}`,
    });

    if (creditError) {
      return NextResponse.json({ error: 'Insufficient credits', needed: totalCost }, { status: 402 });
    }

    // Create jobs
    const jobs = prompts.map((prompt: string, i: number) => ({
      prompt: String(prompt).trim(),
      status: 'processing',
      model,
      project_id: project_id || null,
      job_type: type,
    }));

    const { data: createdJobs, error: jobError } = await supabase.from('jobs').insert(jobs).select();
    if (jobError || !createdJobs) {
      return NextResponse.json({ error: 'Failed to create jobs' }, { status: 500 });
    }

    // Fire all to Modal (don't await — they run in background)
    const modelMap: Record<string, string> = { 'ltx-2.3': 'ltx', 'ltx': 'ltx', 'wan': 'wan', 'flux': 'flux1', 'flux1': 'flux1', 'flux2': 'flux2' };
    const modalModel = modelMap[model] || model;

    for (const job of createdJobs) {
      const isVideo = type === 'video';
      const payload: any = {
        model: modalModel,
        prompt: job.prompt,
        seed: Math.floor(Math.random() * 10000),
        output_name: `${isVideo ? 'video' : 'image'}_${job.id}.${isVideo ? 'mp4' : 'png'}`,
        upload_to_r2: true,
        width: options.width || (isVideo ? 448 : 768),
        height: options.height || 768,
        num_inference_steps: options.num_inference_steps || 20,
      };
      if (isVideo) payload.num_frames = options.num_frames || 72;

      // Fire and forget
      fetch(MODAL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (res.ok) {
          const result = await res.json();
          const url = result.r2_url || result.output || null;
          await supabase.from('jobs').update({ status: 'completed', image_url: url, r2_url: url }).eq('id', job.id);
        } else {
          await supabase.from('jobs').update({ status: 'failed' }).eq('id', job.id);
        }
      }).catch(async () => {
        await supabase.from('jobs').update({ status: 'failed' }).eq('id', job.id);
      });
    }

    return NextResponse.json({
      batch_id: `batch_${Date.now()}`,
      total_jobs: createdJobs.length,
      total_cost: totalCost,
      discount: discount < 1 ? `${((1 - discount) * 100).toFixed(0)}% off` : 'none',
      balance_remaining: newBalance,
      job_ids: createdJobs.map((j: any) => j.id),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
