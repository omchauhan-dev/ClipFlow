import type { PropsWithChildren } from 'react';

const LAST_UPDATED = 'May 30, 2026';

export function LegalHeader({ title }: { title: string }) {
  return (
    <header className="mb-10">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
    </header>
  );
}

export function LegalSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2.5 text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
