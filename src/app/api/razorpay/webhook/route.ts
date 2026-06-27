import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

// Razorpay webhook — the reliable source of truth for payment events.
// Configure in Razorpay Dashboard: Settings -> Webhooks -> add URL
//   https://<your-domain>/api/razorpay/webhook
// subscribe to: payment.captured, order.paid
// and set the webhook secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Must verify against the RAW body
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const type = event?.event;

    // Pull the order notes (plan / pack / user_id we set at order creation)
    const payment = event?.payload?.payment?.entity;
    const order = event?.payload?.order?.entity;
    const notes = payment?.notes || order?.notes || {};

    if (type === 'payment.captured' || type === 'order.paid') {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (SUPABASE_URL && SUPABASE_KEY && notes.user_id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        if (notes.plan) {
          await supabase.from('credits').upsert(
            { user_id: notes.user_id, plan: notes.plan, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        }
        if (notes.credits) {
          // top-up: add balance (idempotency guarded by payment id)
          try {
            await supabase.rpc('add_credits', {
              p_user_id: notes.user_id,
              p_amount: Number(notes.credits),
              p_payment_id: payment?.id || order?.id || null,
            });
          } catch (e) {
            console.warn('[Razorpay webhook] add_credits failed:', e);
          }
        }
      }
    }

    // Always 200 quickly so Razorpay doesn't retry unnecessarily
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
