import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Telegram webhook - receives messages from users who /start the bot
export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat?.id;
  const text = message.text || '';
  const userId = message.from?.id;

  if (!chatId) return NextResponse.json({ ok: true });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // If user sends /start with their ClipFlow user ID: /start <user_id>
  if (text.startsWith('/start')) {
    const clipflowUserId = text.replace('/start', '').trim();

    if (clipflowUserId) {
      // Link telegram chat_id to ClipFlow user
      await supabase.from('credits').update({ telegram_chat_id: String(chatId) }).eq('user_id', clipflowUserId);

      // Send confirmation
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '✅ Connected! You will receive notifications when your videos/images are ready.' }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '👋 Welcome to ClipFlow! Connect your account from the ClipFlow app to receive notifications.' }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
