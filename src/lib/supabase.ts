import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export async function signInWithGoogle() {
  const redirect = sessionStorage.getItem('login_redirect') || '/projects';
  sessionStorage.removeItem('login_redirect');
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/';
}
