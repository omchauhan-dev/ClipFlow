import { redirect } from 'next/navigation';

<<<<<<< Updated upstream
export default function Home() {
  redirect('/viral-hooks');
=======
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Sparkles, Video, Image as ImageIcon, Mic, Wand2, ArrowRight,
  Play, Zap, Layers, Globe, Check, Star, ChevronRight, Paintbrush,
  BotMessageSquare, Captions
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageMarquee } from '@/components/landing/image-marquee';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { TextMarquee } from '@/components/text-marquee';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

export default function LandingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }, []);

  const primaryHref = authed ? '/projects' : '/login';
  const primaryLabel = authed ? 'Go to Projects' : 'Get Started Free';

  const features = [
    { icon: Video, title: 'Text to Video', desc: 'Turn a prompt into a polished, scroll-stopping clip with state-of-the-art video models.' },
    { icon: ImageIcon, title: 'AI Image Generation', desc: 'Generate product shots, characters, and scenes with crisp, legible on-image text.' },
    { icon: Mic, title: 'Talking Avatars', desc: 'Bring a still image to life with natural voice and accurate lip-sync.' },
    { icon: Layers, title: 'UGC Reels', desc: 'Compose influencer-style product reels end to end, ready for social.' },
    { icon: Zap, title: 'Fast Generation', desc: 'GPU-accelerated pipelines deliver results in minutes, not hours.' },
    { icon: Globe, title: 'Built for Creators', desc: 'Scripts, captions, hashtags, and voiceovers — the full content workflow.' },
  ];

  const steps = [
    { n: '01', title: 'Describe your idea', desc: 'Write a prompt or upload a reference image.' },
    { n: '02', title: 'Generate', desc: 'Pick a mode and let the AI models do the heavy lifting.' },
    { n: '03', title: 'Publish', desc: 'Download your clip and share it anywhere.' },
  ];

  const stats = [
    { v: '6+', l: 'AI models' },
    { v: '4K', l: 'max quality' },
    { v: '<2 min', l: 'avg render' },
    { v: '9:16', l: 'social-ready' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px] animate-glow-pulse" />
          <div className="absolute top-60 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-[120px] animate-float-y" />
          <div className="absolute top-80 -right-40 h-[350px] w-[350px] rounded-full bg-purple-500/8 blur-[120px]" style={{ animation: 'float-y 7s ease-in-out infinite reverse' }} />
        </div>

        {/* Sliding image background */}
        <ImageMarquee />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />

        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI video, images &amp; talking avatars
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.04] mb-6">
              Create scroll-stopping
              <br />
              <span className="bg-gradient-to-r from-primary via-fuchsia-300 to-primary bg-clip-text text-transparent animate-gradient">
                content with AI
              </span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Generate videos, images, and lip-synced talking avatars from a single prompt.
              The full creator workflow, powered by state-of-the-art models.
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => router.push(primaryHref)} className="gap-2 h-12 px-7 text-sm shadow-lg shadow-primary/25 group">
                <Wand2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
                {primaryLabel}
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/pricing')} className="h-12 px-7 text-sm gap-2 bg-card/50 backdrop-blur border-border/50 hover:bg-card/70">
                <Star className="w-4 h-4" />
                See pricing
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-5">Free to get started · No credit card needed</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.l} className="group rounded-2xl border border-border/40 bg-black/30 backdrop-blur px-4 py-5 hover:border-primary/30 hover:bg-black/40 smooth">
                <div className="text-2xl font-bold tracking-tight text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Scrolling text marquee ── */}
      <TextMarquee />

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28 w-full">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary text-xs px-3 py-1">
            Everything you need
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">One studio, infinite possibilities</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Video, images, voice, and the content around them — all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group relative rounded-2xl border border-border/40 bg-gradient-to-b from-card/60 to-card/20 backdrop-blur p-6 hover:border-primary/30 smooth"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 smooth">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Models / Powered by ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 w-full">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary text-xs px-3 py-1">
            Powered by
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">State-of-the-art models</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Every generation runs on purpose-built open and proprietary models.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3">
          {([
          { icon: Paintbrush, name: 'Ideogram 4', type: 'Image', desc: 'Text-to-image with excellent typography' },
          { icon: Zap, name: 'FLUX.2', type: 'Image', desc: 'Photorealistic image generation' },
          { icon: Video, name: 'LTX 2.3', type: 'Video', desc: 'Text & image-to-video' },
          { icon: Mic, name: 'LongCat Avatar', type: 'Avatar', desc: 'Lip-sync talking avatars' },
          { icon: BotMessageSquare, name: 'Auto Agent', type: 'Agent', desc: 'AI that plans & creates your content' },
          { icon: Captions, name: 'Voiceover', type: 'Audio', desc: 'ElevenLabs & OpenAI text-to-speech' },
          ] as const).map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="inline-flex items-center gap-3 rounded-xl border border-border/30 bg-gradient-to-b from-card/50 to-card/10 backdrop-blur px-5 py-3.5 hover:border-primary/25 hover:from-card/70 smooth"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <m.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[11px] text-muted-foreground tracking-wide">{m.type} · {m.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Showcase strip ── */}
      <section className="relative py-24 overflow-hidden border-y border-border/30">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <ImageMarquee />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/30 to-background" />
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="relative max-w-3xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary text-xs px-3 py-1">
            Production ready
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            From prompt to publish-ready
          </h2>
          <p className="text-muted-foreground">
            Thousands of frames generated daily across video, image, and avatar pipelines.
          </p>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-28 w-full">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary text-xs px-3 py-1">
            Simple workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">From idea to reel in 3 steps</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">No editing skills required.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative rounded-2xl border border-border/40 bg-gradient-to-b from-card/50 to-card/10 backdrop-blur p-6 group hover:border-primary/30 smooth"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl font-bold text-primary/15 group-hover:text-primary/25 smooth">{s.n}</span>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 smooth">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-base font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-28 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur px-8 py-16 text-center">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
              <div className="absolute left-1/4 top-0 h-[200px] w-[200px] rounded-full bg-blue-500/8 blur-[100px]" />
              <div className="absolute right-1/4 bottom-0 h-[200px] w-[200px] rounded-full bg-fuchsia-500/8 blur-[100px]" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs text-primary mb-6">
                <Sparkles className="w-3 h-3" />
                Get started for free
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Start creating today
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Join creators using Clipflow to produce videos and reels at the speed of thought.
              </p>
              <Button size="lg" onClick={() => router.push(primaryHref)} className="gap-2 h-12 px-8 text-sm shadow-lg shadow-primary/25 group">
                {primaryLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Free to start</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
>>>>>>> Stashed changes
}
