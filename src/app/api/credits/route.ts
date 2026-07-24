import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 15;

export const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  starter: 200,
  pro: Infinity,
};

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const db = getDb();
  const { data } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ balance: 0, plan: 'free' });

  const db = getDb();
  const { data } = await db.from('profiles').select('credits_balance, plan').eq('id', user.id).single();
  return NextResponse.json({
    balance: data?.credits_balance ?? 0,
    plan: data?.plan ?? 'free',
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, description } = await req.json();
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const db = getDb();

  const { data: profile } = await db.from('profiles').select('credits_balance, plan').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const planLimit = PLAN_LIMITS[profile.plan] ?? PLAN_LIMITS.free;
  if (profile.credits_balance + amount > planLimit) {
    return NextResponse.json({
      error: 'Plan limit exceeded',
      plan: profile.plan,
      limit: planLimit === Infinity ? 'unlimited' : planLimit,
      balance: profile.credits_balance,
    }, { status: 403 });
  }

  const { data: newBalance, error } = await db.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: amount,
    p_description: description || null,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('insufficient_credits')) {
      return NextResponse.json({ error: 'Insufficient credits', balance: 0 }, { status: 402 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, balance: newBalance });
}
