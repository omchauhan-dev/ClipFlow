'use client';

import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { SiteFooter } from '@/components/site-footer';

export default function LegalLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <BrandLogo />
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.push('/')}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Button>
        </div>
      </header>

      <main className="w-full flex-1">
        <article className="legal-prose mx-auto max-w-3xl px-6 py-14">{children}</article>
      </main>

      <SiteFooter />
    </div>
  );
}
