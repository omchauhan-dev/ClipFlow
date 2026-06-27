import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// Subscription plans -> price in INR paise (smallest unit).
const PLAN_AMOUNTS: Record<string, { amount: number; label: string }> = {
  starter: { amount: 1900 * 100, label: 'ClipFlow Starter' }, // ₹1900
  pro: { amount: 3900 * 100, label: 'ClipFlow Pro' },          // ₹3900
};

// One-time credit packs -> { price in paise, credits granted (USD balance) }
const CREDIT_PACKS: Record<string, { amount: number; credits: number; label: string }> = {
  pack_5: { amount: 400 * 100, credits: 5, label: '5 Credits' },     // ₹400 -> $5
  pack_15: { amount: 1100 * 100, credits: 15, label: '15 Credits' }, // ₹1100 -> $15
  pack_50: { amount: 3500 * 100, credits: 50, label: '50 Credits' }, // ₹3500 -> $50
};

export async function POST(req: NextRequest) {
  try {
    const { plan, pack, user_id } = await req.json();

    let amount: number;
    let label: string;
    const notes: Record<string, string> = {};
    if (user_id) notes.user_id = user_id;

    if (plan && PLAN_AMOUNTS[plan]) {
      amount = PLAN_AMOUNTS[plan].amount;
      label = PLAN_AMOUNTS[plan].label;
      notes.plan = plan;
    } else if (pack && CREDIT_PACKS[pack]) {
      amount = CREDIT_PACKS[pack].amount;
      label = CREDIT_PACKS[pack].label;
      notes.credits = String(CREDIT_PACKS[pack].credits);
      notes.pack = pack;
    } else {
      return NextResponse.json({ error: 'Invalid plan or pack' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `rcpt_${(plan || pack)}_${Date.now()}`,
        notes,
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: order?.error?.description || 'Order creation failed' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      label,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
