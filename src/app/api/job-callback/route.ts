import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const { job_id, status, r2_url, error } = await req.json();
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (status === 'completed' && r2_url) {
    await supabase.from('jobs').update({ status: 'completed', image_url: r2_url, r2_url, completed_at: new Date().toISOString() }).eq('id', job_id);
    // Fetch job details for notification
    const { data: job } = await supabase.from('jobs').select('model, prompt').eq('id', job_id).single();
    if (job) {
      await sendTelegramNotification(`🖼 <b>Image Generated</b>\nModel: ${job.model}\nPrompt: ${(job.prompt || '').slice(0, 80)}`);
    }
  } else {
    await supabase.from('jobs').update({ status: 'failed', error: error || 'Generation failed' }).eq('id', job_id);
  }

  return NextResponse.json({ ok: true });
}
