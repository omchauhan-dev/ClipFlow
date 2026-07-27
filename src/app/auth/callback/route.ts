import { NextRequest, NextResponse } from 'next/server';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/projects';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createServerClient } = await import('@supabase/ssr');

    const res = NextResponse.redirect(new URL('/projects', origin));

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach((c) => {
            res.cookies.set(c.name, c.value, { maxAge: THIRTY_DAYS, path: '/', sameSite: 'lax', secure: true });
          });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
    return res;
  }

  return NextResponse.redirect(new URL(next, origin));
}
