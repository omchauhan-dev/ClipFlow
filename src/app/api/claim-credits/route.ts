import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  const { user_id } = await req.json();

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check how many accounts claimed free credits from this IP
  const { count } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('type', 'free_signup');

  if ((count || 0) >= 2) {
    return NextResponse.json({ error: 'Free credits limit reached for this network' }, { status: 429 });
  }

  // Grant free credits
  await supabase.from('credits').insert({
    user_id,
    amount: 0.50,
    type: 'free_signup',
    ip_address: ip,
  });

  return NextResponse.json({ credits: 0.50 });
}
