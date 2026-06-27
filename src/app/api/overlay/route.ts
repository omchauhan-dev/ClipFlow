import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const videoUrl = formData.get('video_url') as string;
  const text = formData.get('text') as string;
  const position = (formData.get('position') as string) || 'bottom'; // top, bottom, center
  const logoUrl = formData.get('logo_url') as string | null;

  if (!videoUrl) return NextResponse.json({ error: 'video_url required' }, { status: 400 });

  // Call Modal endpoint to overlay text/logo
  const MODAL_URL = process.env.MODAL_WEBHOOK_URL!.replace('generate', 'overlay');
  const res = await fetch(MODAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_url: videoUrl, text, position, logo_url: logoUrl }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Overlay failed' }, { status: 500 });
  const result = await res.json();
  return NextResponse.json(result);
}
