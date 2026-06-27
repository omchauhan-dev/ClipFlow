import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

interface Scene {
  n?: number;
  title?: string;
  kind?: 'image' | 'video';
  prompt?: string;
  action?: string;
  camera?: string;
  shot?: string;
  script?: string;
  voiceover?: string;
  duration?: number;
}
interface Plan {
  title?: string;
  concept?: string;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  characters?: Array<{ name?: string; description?: string }>;
  scenes?: Scene[];
}

const AR: Record<string, { width: number; height: number }> = {
  '9:16': { width: 448, height: 768 },
  '16:9': { width: 768, height: 448 },
  '1:1': { width: 512, height: 512 },
};

const COST_PER_SCENE: Record<string, number> = {
  image: 1,
  video: 2,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, project_id, chained } = (await req.json()) as {
      plan: Plan; project_id?: string; chained?: boolean;
    };
    if (!plan || !Array.isArray(plan.scenes) || plan.scenes.length === 0) {
      return NextResponse.json({ error: 'plan with scenes required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user } } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Calculate total cost
    const scenes = plan.scenes.filter((s) => (s.prompt || '').trim()).slice(0, 16);
    const totalCost = scenes.reduce((sum, s) => sum + (COST_PER_SCENE[s.kind || 'image'] || 1), 0);

    // Deduct credits atomically
    const { data: profile } = await db.from('profiles').select('credits_balance').eq('id', user.id).single();
    const balance = profile?.credits_balance ?? 0;
    if (balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient credits', balance: 0 }, { status: 402 });
    }
    await db.from('profiles').update({
      credits_balance: balance - totalCost,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    const origin = req.nextUrl.origin;
    const ar = AR[plan.aspect_ratio || '9:16'] || AR['9:16'];

    // ── Chained movie mode ──
    if (chained) {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const COMFYUI_URL = process.env.COMFYUI_API_URL;
      if (!SUPABASE_URL || !SUPABASE_KEY || !COMFYUI_URL) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const rows = scenes.map((s) => ({
        prompt: (s.prompt || '').trim(),
        status: 'processing',
        model: 'ltx-chain',
        project_id: project_id || null,
        job_type: 'video',
      }));
      const { data: created } = await supabase.from('jobs').insert(rows).select();
      const jobIds = (created || []).map((j: { id: string }) => j.id);

      await fetch(COMFYUI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chained_movie',
          scenes: scenes.map((s) => ({
            prompt: s.prompt,
            duration: s.duration && s.duration > 0 ? s.duration : 5,
            width: ar.width,
            height: ar.height,
          })),
          callback_url: `${origin}/api/job-callback`,
          job_ids: jobIds,
        }),
      });

      return NextResponse.json({ jobs: jobIds, count: jobIds.length, chained: true, balance: balance - totalCost });
    }

    // ── Default: one job per scene ──
    const jobs: string[] = [];
    for (const scene of scenes) {
      const prompt = (scene.prompt || '').trim();
      if (!prompt) continue;
      const isVideo = scene.kind === 'video';
      const endpoint = isVideo ? '/api/generate-video' : '/api/generate-image';
      try {
        const r = await fetch(`${origin}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: isVideo ? 'ltx-2.3' : 'flux2',
            project_id,
            width: ar.width,
            height: ar.height,
            duration: scene.duration && scene.duration > 0 ? scene.duration : 5,
          }),
        });
        const j = await r.json();
        if (j.job_id) jobs.push(j.job_id);
      } catch {
        /* skip */
      }
    }

    return NextResponse.json({ jobs, count: jobs.length, balance: balance - totalCost });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
