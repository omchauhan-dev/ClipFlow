import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, type } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You are a prompt writer for AI ${type === 'video' ? 'video' : 'image'} generation. The user gives you a rough idea. Rewrite it into a clear, specific prompt that AI models understand well. Rules:
- Keep it under 100 words
- Be specific about: what's in the scene, lighting, camera angle, movement
- Do NOT add fantasy/unrealistic elements the user didn't ask for
- Do NOT change the core subject or add random objects
- Use simple descriptive language, not flowery prose
- For video: describe motion and pacing
- For images: describe composition and style
Return ONLY the rewritten prompt.` },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'AI enhancement failed' }, { status: 500 });

  const data = await res.json();
  const enhanced = data.choices?.[0]?.message?.content?.trim() || prompt;

  return NextResponse.json({ enhanced });
}
