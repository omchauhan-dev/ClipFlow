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
  let { data } = await db.from('profiles').select('credits_balance, plan').eq('id', user.id).single();

  if (!data) {
    await db.from('profiles').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      credits_balance: 50,
      plan: 'free',
    });
    data = { credits_balance: 50, plan: 'free' };
  }

  return NextResponse.json({
    balance: data.credits_balance ?? 0,
    plan: data.plan ?? 'free',
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

  let { data: newBalance, error } = await db.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: amount,
    p_description: description || null,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('profile_not_found')) {
      await db.from('profiles').insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        credits_balance: 50,
        plan: 'free',
      });
      const retry = await db.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description || null,
      });
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      newBalance = retry.data;
    } else if (msg.includes('insufficient_credits')) {
      return NextResponse.json({ error: 'Insufficient credits', balance: 0 }, { status: 402 });
    } else {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, balance: newBalance });
}
