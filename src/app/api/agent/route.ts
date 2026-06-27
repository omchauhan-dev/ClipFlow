import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/ai/langgraph-agent';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { goal, project_id } = await req.json();
    if (!goal) return NextResponse.json({ error: 'goal required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: missing GROQ_API_KEY' }, { status: 500 });
    }

    const result = await runAgent({
      goal,
      project_id: project_id || 'default',
      thread_id: project_id || `thread_${Date.now()}`,
      max_iterations: 3,
    });

    return NextResponse.json({
      reply: result.reply,
      steps: result.trace.map((t: string) => ({ tool: t, args: {}, result: t })),
      jobs: result.jobs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
