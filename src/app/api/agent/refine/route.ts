import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-versatile';

const SYSTEM = `You are an AI creative director that iteratively improves video/image production plans.

Given a production plan and a critique of the previous output, you produce an improved plan.

Focus on:
- Making prompts more specific and visually compelling
- Improving lighting, camera angles, and composition
- Enhancing the narrative flow between scenes
- Fixing any issues mentioned in the critique
- Keeping characters and style consistent

Return STRICT JSON:
{
  "reply": string,         // short explanation of what you changed
  "improvements": string,  // what specific improvements were made
  "plan": { ... }          // the full updated plan with improved scenes
}

The plan schema is:
{
  "title": string,
  "concept": string,
  "format": "movie" | "reel" | "image" | "ad",
  "aspect_ratio": "9:16" | "16:9" | "1:1",
  "characters": [ { "name": string, "description": string } ],
  "scenes": [
    { "n": number, "title": string, "start": number, "end": number,
      "shot": string, "camera": string, "lighting": string,
      "action": string, "voiceover": string, "kind": "image" | "video", "prompt": string, "duration": number }
  ]
}

Make each iteration substantively better — richer prompts, better visual direction, more engaging scenes.`;

export async function POST(req: NextRequest) {
  try {
    const { plan, pass, critique } = await req.json();
    if (!plan) return NextResponse.json({ error: 'plan required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: missing GROQ_API_KEY' }, { status: 500 });
    }

    const critiqueText = critique || 'No specific critique — make the prompts more vivid and production-ready. Improve lighting descriptions, camera movement, and emotional impact of each scene.';

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `This is refinement pass #${pass}.\n\nCurrent plan:\n${JSON.stringify(plan, null, 2)}\n\nCritique from previous iteration:\n${critiqueText}\n\nProduce an improved version of the plan. Make the prompts significantly better.` },
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Refine failed', detail: errText.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    let parsed: { reply?: string; improvements?: string; plan?: unknown } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    if (!parsed || !parsed.plan) {
      return NextResponse.json({ reply: 'Refinement produced no changes.', plan, improvements: '' });
    }

    return NextResponse.json({
      reply: parsed.reply || 'Refined the plan.',
      improvements: parsed.improvements || '',
      plan: parsed.plan,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
