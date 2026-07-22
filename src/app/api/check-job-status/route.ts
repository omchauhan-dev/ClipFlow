import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('id');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const outputUrl = job.r2_url || job.output_url || job.image_url || null;

    return NextResponse.json({
      job_id: jobId,
      status: job.status,
      output: outputUrl,
      created_at: job.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
