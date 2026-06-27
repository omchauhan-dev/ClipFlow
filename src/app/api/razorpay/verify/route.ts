import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

// Credit pack -> balance granted (must match order/route.ts)
const PACK_CREDITS: Record<string, number> = {
  pack_5: 5,
  pack_15: 15,
  pack_50: 50,
};

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      pack,
      user_id,
    } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // Verify: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Signature mismatch' }, { status: 400 });
    }

    // Signature valid -> apply the purchase (best-effort; webhook is the backstop)
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (SUPABASE_URL && SUPABASE_KEY && user_id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        if (plan) {
          await supabase.from('credits').upsert(
            { user_id, plan, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        } else if (pack && PACK_CREDITS[pack]) {
          // add_credits is idempotent on payment_id to avoid double-grant
          // (verify + webhook may both fire)
          await supabase.rpc('add_credits', {
            p_user_id: user_id,
            p_amount: PACK_CREDITS[pack],
            p_payment_id: razorpay_payment_id,
          });
        }
      }
    } catch (e) {
      console.warn('[Razorpay] purchase apply failed:', e);
    }

    return NextResponse.json({ verified: true, payment_id: razorpay_payment_id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
