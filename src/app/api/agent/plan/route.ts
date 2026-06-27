import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Agent PLAN phase. Turns a creator's goal into a structured creative brief:
 * concept, characters, and an ordered scene list (each with shot type, camera
 * movement, lighting, action, and a generation prompt). No generation happens
 * here — the UI shows the brief, then calls /api/agent/execute to create it.
 *
 * Body: { goal: string }
 * Returns: { plan: Plan }
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PLAN_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const SYSTEM = `You are a creative director for an AI video/image studio.
Given a creator's goal, produce a concrete production plan as STRICT JSON (no markdown, no commentary).

Decide a sensible number of scenes from the goal:
- A ~1 minute movie ≈ 10-14 scenes (each clip ~4-5s).
- A short reel ≈ 3-5 scenes. A single image ≈ 1 scene.

JSON shape:
{
  "title": string,
  "concept": string,                      // 1-2 sentence creative summary
  "format": "movie" | "reel" | "image" | "ad",
  "aspect_ratio": "9:16" | "16:9" | "1:1",
  "characters": [
    { "name": string, "description": string }   // consistent visual description
  ],
  "scenes": [
    {
      "n": number,
      "title": string,
      "start": number,           // scene start time in seconds (scene 1 = 0)
      "end": number,             // scene end time in seconds
      "shot": string,            // e.g. "wide establishing", "medium close-up"
      "camera": string,          // e.g. "slow push-in", "static", "pan left"
      "lighting": string,        // e.g. "golden hour", "moody low-key"
      "action": string,          // what happens visually
      "voiceover": string,       // the spoken line(s) — narration/dialogue for this scene ("" if silent)
      "kind": "image" | "video", // how to generate it
      "prompt": string,          // full generation prompt (include character look for consistency)
      "duration": number         // seconds (end - start) if video, else 0
    }
  ]
}

Rules:
- Keep characters consistent: repeat their key visual traits in each scene prompt that includes them.
- Make timecodes sequential and continuous: scene 1 "start" = 0, each scene's "start" = previous "end", "duration" = end - start.
- Write a real "voiceover" line for each scene: narration for cinematic scenes, or character dialogue/voiceover for ads and reels. Keep it short enough to be read aloud within the scene duration. Use "" for purely visual/silent scenes.
- Prompts must be vivid and specific (subject, setting, lighting, camera).
- Output ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const { goal } = await req.json();
    if (!goal) return NextResponse.json({ error: 'goal required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: missing GROQ_API_KEY' }, { status: 500 });
    }

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: PLAN_MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Goal: ${goal}` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Planning failed', detail: errText.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    let plan: unknown;
    try {
      plan = JSON.parse(raw);
    } catch {
      // attempt to extract the JSON object if the model wrapped it
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { plan = JSON.parse(m[0]); } catch { /* ignore */ }
      }
    }
    if (!plan) return NextResponse.json({ error: 'Could not parse plan', raw: raw.slice(0, 400) }, { status: 502 });

    return NextResponse.json({ plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
