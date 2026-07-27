import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const name = req.nextUrl.searchParams.get('name') || 'clipflow';

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = blob.type === 'image/png' ? '.png' : blob.type === 'image/webp' ? '.webp' : blob.type === 'video/mp4' ? '.mp4' : blob.type === 'image/gif' ? '.gif' : '.jpg';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': blob.type,
        'Content-Disposition': `attachment; filename="${name}${ext}"`,
      },
    });
  } catch {
    return NextResponse.redirect(url);
  }
}
