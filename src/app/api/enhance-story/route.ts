import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // num_scenes: a number forces an exact count; 0 / undefined / "auto" => AI decides
  const { story, num_scenes } = await req.json();
  if (!story) return NextResponse.json({ error: 'story required' }, { status: 400 });

  const forced = typeof num_scenes === 'number' && num_scenes > 0;

  const sceneInstruction = forced
    ? `Break it into exactly ${num_scenes} visual scenes optimized for AI video generation.`
    : `Break it into as many visual scenes as the story naturally needs to be told well — a short idea may need 3-4 scenes, a richer story 8-12 or more. Do not pad with filler and do not truncate; let the story decide the count.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a cinematic story writer for AI video generation. The user gives you a story idea. ${sceneInstruction}

Rules:
- Each scene is 1-2 sentences describing what's VISIBLE on screen
- Include: setting, lighting, camera angle, character action, mood
- Make it cinematic and visually compelling
- Keep scenes connected as a single coherent story with a clear beginning, middle, and end
- Maintain visual continuity (same characters, wardrobe, locations) across scenes
- No dialogue — only visual descriptions
- Each scene must work as a standalone video prompt

Return ONLY a JSON array of strings, nothing else. Example:
["Scene 1 description", "Scene 2 description", "Scene 3 description"]`
        },
        { role: 'user', content: story }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'AI enhancement failed' }, { status: 500 });

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '[]';

  // Strip markdown code fences if the model wrapped the JSON
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    let scenes = JSON.parse(content);
    if (!Array.isArray(scenes)) scenes = [];
    if (forced) scenes = scenes.slice(0, num_scenes);
    return NextResponse.json({ scenes, original: story });
  } catch {
    // Fallback: extract non-trivial lines as scenes
    const lines = content
      .split('\n')
      .map((l: string) => l.replace(/^\s*[-*\d.]+\s*/, '').replace(/^["']|["'],?$/g, '').trim())
      .filter((l: string) => l.length > 10);
    const scenes = forced ? lines.slice(0, num_scenes) : lines;
    return NextResponse.json({ scenes, original: story });
  }
}
