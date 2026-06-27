import { NextRequest, NextResponse } from 'next/server';
import { runChat } from '@/ai/langgraph-chat';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, project_id, llm } = (await req.json()) as {
      messages: Array<{ role: string; content: string }>;
      project_id?: string;
      llm?: string;
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const history = messages.slice(-16);

    const result = await runChat({
      messages: history,
      thread_id: project_id || `chat_${Date.now()}`,
      model: llm,
    });

    return NextResponse.json({
      reply: result.reply,
      plan: result.plan,
      ready: result.ready,
      options: result.options.length > 0 ? result.options : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
