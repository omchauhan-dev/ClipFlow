"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  Sparkles, Video, Image as ImageIcon, Mic, Wand2, ArrowRight,
  Zap, Globe, Check, ChevronRight, Paintbrush,
  BotMessageSquare, Captions, Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const ease = [0.16, 1, 0.3, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease },
}

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
}

export default function LandingPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
    })
  }, [])

  const primaryHref = authed ? "/projects" : "/login"
  const primaryLabel = "Start Creating"

  const features = [
    { icon: Video, title: "Text to Video", desc: "Turn any prompt into a polished clip ready for social." },
    { icon: ImageIcon, title: "AI Images", desc: "Product shots, scenes, and characters with crisp text." },
    { icon: Mic, title: "Talking Avatars", desc: "Bring still images to life with natural lip-sync." },
    { icon: Zap, title: "Lightning Fast", desc: "GPU-accelerated pipelines deliver in minutes." },
    { icon: Globe, title: "Full Workflow", desc: "Scripts, captions, hashtags, voiceovers in one place." },
    { icon: BotMessageSquare, title: "Auto Agent", desc: "AI that plans and creates your content end-to-end." },
  ]

  const models = [
    { icon: Paintbrush, name: "Ideogram 4", desc: "Text-to-image with excellent typography" },
    { icon: Zap, name: "FLUX.2", desc: "Photorealistic image generation" },
    { icon: Video, name: "LTX 2.3", desc: "Text and image-to-video" },
    { icon: Mic, name: "LongCat Avatar", desc: "Lip-sync talking avatars" },
    { icon: BotMessageSquare, name: "Auto Agent", desc: "AI that plans your content" },
    { icon: Captions, name: "Voiceover", desc: "ElevenLabs and OpenAI TTS" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <SiteHeader />

      {/* Hero — split layout */}
      <motion.section style={{ scale: heroScale }} className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] -translate-y-1/2 rounded-full bg-primary/8 blur-[200px]" />
          <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[150px]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-24 pb-16 lg:pt-20 lg:pb-20">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                AI content creation studio
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.04] mb-5 max-w-3xl">
                Create scroll-stopping
                <br />
                <span className="bg-gradient-to-r from-primary via-emerald-300 to-primary bg-clip-text text-transparent animate-gradient">
                  content with AI
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
                Generate videos, images, and talking avatars from a single prompt.
                No editing skills required.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  size="lg"
                  onClick={() => router.push(primaryHref)}
                  className="group relative h-13 px-8 text-sm rounded-full shadow-lg shadow-primary/25 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                  <span className="relative flex items-center gap-2">
                    <Wand2 className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    {primaryLabel}
                    <span className="w-7 h-7 rounded-full bg-primary-foreground/15 flex items-center justify-center group-hover:bg-primary-foreground/25 transition-colors duration-300">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                  className="h-13 px-7 text-sm rounded-full bg-card/50 backdrop-blur border-border/50 hover:bg-card/70"
                >
                  View pricing
                </Button>
              </div>
            </motion.div>

            {/* Right: Visual showcase */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl border border-border/30 bg-gradient-to-br from-card/60 via-card/30 to-black/60 backdrop-blur overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-20 h-20 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer">
                      <Play className="w-8 h-8 text-primary ml-0.5" />
                    </div>
                    <p className="text-sm text-muted-foreground">Watch demo</p>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                      <Wand2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground/80">&quot;Cinematic product shot on marble&quot;</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">0:15 / 1:30</Badge>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2.5 mt-4">
                {[
                  { v: "6+", l: "models" },
                  { v: "4K", l: "quality" },
                  { v: "<2 min", l: "render" },
                  { v: "9:16", l: "ready" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border/30 bg-black/30 backdrop-blur px-3 py-3 text-center hover:border-primary/25 transition-colors duration-300">
                    <div className="text-lg font-bold tracking-tight text-primary">{s.v}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features — asymmetric bento */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28 lg:py-36 w-full">
        <motion.div {...fadeUp} className="max-w-2xl mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            One studio, every format
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Video, images, voice, and the content around them in a single workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease, delay: i * 0.06 }}
              className="group relative rounded-2xl border border-border/30 bg-gradient-to-b from-card/60 to-card/10 backdrop-blur p-7 hover:border-primary/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section className="max-w-7xl mx-auto px-6 py-28 lg:py-36 w-full">
        <motion.div {...fadeUp} className="max-w-2xl mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Powered by state-of-the-art models
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Every output runs on purpose-built AI, from image generation to lip-sync.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease, delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-xl border border-border/25 bg-gradient-to-b from-card/50 to-card/10 backdrop-blur px-5 py-4 hover:border-primary/25 hover:from-card/70 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <m.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[12px] text-muted-foreground truncate">{m.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-28 lg:py-36 w-full">
        <motion.div {...fadeUp} className="max-w-2xl mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Three steps to publish
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            No editing skills. No learning curve.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "01", title: "Describe", desc: "Write a prompt or upload a reference image." },
            { n: "02", title: "Generate", desc: "Pick a model and let AI do the work." },
            { n: "03", title: "Share", desc: "Download your clip and post instantly." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/30 bg-gradient-to-b from-card/50 to-card/10 backdrop-blur p-8 group hover:border-primary/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-5xl font-bold text-primary/15 group-hover:text-primary/25 transition-colors duration-500">{s.n}</span>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-500">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-28 lg:pb-36 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur px-8 py-20 lg:py-28 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[150px]" />
              <div className="absolute left-1/4 top-0 h-[250px] w-[250px] rounded-full bg-emerald-500/5 blur-[120px]" />
              <div className="absolute right-1/4 bottom-0 h-[250px] w-[250px] rounded-full bg-emerald-500/5 blur-[120px]" />
            </div>

            <div className="relative max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs text-primary mb-7">
                <Sparkles className="w-3 h-3" />
                Get started for free
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Start creating today
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-9 text-base sm:text-lg leading-relaxed">
                Join creators using ClipFlow to produce content at the speed of AI.
              </p>
              <Button
                size="lg"
                onClick={() => router.push(primaryHref)}
                className="group relative h-13 px-8 text-sm rounded-full shadow-lg shadow-primary/25 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="relative flex items-center gap-2">
                  {primaryLabel}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
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
  )
}