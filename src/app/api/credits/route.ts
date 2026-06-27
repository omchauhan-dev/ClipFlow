import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Deduct credits atomically
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const db = supabase();
  const { data: { user } } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check current balance from profiles
  const { data: profile } = await db.from('profiles').select('credits_balance').eq('id', user.id).single();
  const balance = profile?.credits_balance ?? 0;
  if (balance < amount) {
    return NextResponse.json({ error: 'Insufficient credits', balance: 0 }, { status: 402 });
  }

  // Decrement
  const { data: updated } = await db.from('profiles').update({
    credits_balance: balance - amount,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id).select('credits_balance').single();

  return NextResponse.json({ success: true, balance: updated?.credits_balance ?? balance - amount });
}

// Get balance
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ balance: 0 }, { status: 401 });

  const db = supabase();
  const { data: { user } } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return NextResponse.json({ balance: 0 }, { status: 401 });

  const { data } = await db.from('profiles').select('credits_balance').eq('id', user.id).single();
  return NextResponse.json({ balance: data?.credits_balance || 0 });
}
