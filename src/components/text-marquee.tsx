import { Sparkles } from 'lucide-react';

/**
 * Scrolling text marquee strip — a continuous band of phrases that slides
 * horizontally. Decorative; sits between sections on the landing page.
 */

const PHRASES = [
  'Text to Video',
  'AI Images',
  'Talking Avatars',
  'Image to Video',
  'Auto Agent',
  'Hindi · Hinglish · English',
  'UGC Reels',
  'Consistent Characters',
  'One-prompt Movies',
];

function Track() {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {PHRASES.map((p) => (
        <span key={p} className="flex items-center gap-6 whitespace-nowrap">
          <span className="text-lg font-semibold tracking-tight text-foreground/80">{p}</span>
          <Sparkles className="h-4 w-4 text-primary/70" />
        </span>
      ))}
    </div>
  );
}

export function TextMarquee() {
  return (
    <div className="relative flex w-full overflow-hidden border-y border-border/40 bg-card/30 py-4">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div
        className="flex w-max animate-marquee-left pause-on-hover"
        style={{ ['--marquee-duration' as string]: '40s' }}
      >
        <Track />
        <Track />
      </div>
    </div>
  );
}
