import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  cookies: {
    setAll(cookies) {
      cookies.forEach(({ name, value, options }) => {
        document.cookie = `${name}=${value}; max-age=${THIRTY_DAYS}; path=/; samesite=lax; secure`;
      });
    },
  },
});

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/';
}
