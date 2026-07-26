import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { image, images, type, source } = await req.json();
    const frames: string[] = Array.isArray(images) && images.length ? images : image ? [image] : [];
    if (!frames.length) return NextResponse.json({ error: 'image or images required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: missing GROQ_API_KEY' }, { status: 500 });
    }

    const isVideo = type === 'video';
    const fromVideo = source === 'video' || frames.length > 1;

    const dataUrls = await Promise.all(frames.slice(0, 4).map(toDataUrl));

    const system = `You are a prompt writer for AI ${isVideo ? 'video' : 'image'} generation. ${
      fromVideo
        ? 'The user provides several frames sampled in order from a video. Infer the overall scene AND the motion/action across the frames.'
        : 'Look at the image the user provides.'
    } Write a single prompt that would recreate a similar ${isVideo ? 'scene as a video' : 'image'}. Rules:
- Describe the subject, composition, lighting, color palette, mood, and style you actually see
${fromVideo ? '- Describe the movement, camera motion, and pacing you infer across the frames' : ''}
- Be specific and concrete; no flowery prose
- Under 90 words
- Do not mention "frames" or "images" — write it as a direct generation prompt
Return ONLY the prompt text.`;

    const userContent: Array<Record<string, unknown>> = [
      { type: 'text', text: `Write a ${isVideo ? 'video' : 'image'} generation prompt that recreates ${fromVideo ? 'this video' : 'this'}.` },
      ...dataUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Image analysis failed', detail: errText.slice(0, 200) }, { status: 502 });
    }

    const data = await res.json();
    const prompt = data.choices?.[0]?.message?.content?.trim();
    if (!prompt) return NextResponse.json({ error: 'No prompt produced' }, { status: 502 });

    return NextResponse.json({ prompt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
