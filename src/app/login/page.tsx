'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, supabase } from '@/lib/supabase';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

const PERKS = [
  'Generate videos, images & talking avatars',
  'Scripts in Hindi, Hinglish & English',
  '10 free generations to start',
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/projects');
      else setChecking(false);
    });
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <Card className="relative w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="" size="lg" showText={false} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Welcome to Clipflow</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to start creating with AI
          </p>
        </div>

        <ul className="mb-8 flex flex-col gap-2.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </span>
              {p}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleLogin}
          disabled={loading}
          variant="outline"
          className="h-12 w-full gap-3 text-sm font-medium"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {loading ? 'Redirecting to Google...' : 'Continue with Google'}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">Free · No credit card needed</p>

        <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/legal/terms" className="underline hover:text-foreground">Terms</a>{' '}
          and{' '}
          <a href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </Card>
    </div>
  );
}
