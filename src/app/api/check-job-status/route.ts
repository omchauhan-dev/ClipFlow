<<<<<<< Updated upstream
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
=======
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
>>>>>>> Stashed changes

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

<<<<<<< Updated upstream
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
=======
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
>>>>>>> Stashed changes

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

<<<<<<< Updated upstream
  return NextResponse.json(data);
}
=======
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
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
>>>>>>> Stashed changes
