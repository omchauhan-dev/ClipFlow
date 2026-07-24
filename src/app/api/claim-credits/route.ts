import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('payment_id', `free_ip_${ip}`);

  if ((count || 0) >= 2) {
    return NextResponse.json({ error: 'Free credits limit reached for this network' }, { status: 429 });
  }

  const { data: balance } = await supabase.rpc('add_credits', {
    p_user_id: user_id,
    p_amount: 5,
    p_payment_id: `free_ip_${ip}`,
  });

  return NextResponse.json({ credits: 5, balance });
}
