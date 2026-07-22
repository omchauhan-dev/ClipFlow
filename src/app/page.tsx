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

const ease = [0.16, 1, 0.3, 1]

export default function LandingPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.98])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
    })
  }, [])

  const primaryHref = authed ? "/projects" : "/login"

  const features = [
    { icon: Video, title: "Text to Video", desc: "Turn any prompt into a polished clip ready for social." },
    { icon: ImageIcon, title: "AI Images", desc: "Product shots, scenes, and characters with crisp text." },
    { icon: Mic, title: "Talking Avatars", desc: "Bring still images to life with natural lip-sync." },
    { icon: Zap, title: "Lightning Fast", desc: "GPU-accelerated pipelines deliver in minutes." },
    { icon: Globe, title: "Full Workflow", desc: "Scripts, captions, hashtags, voiceovers in one place." },
    { icon: BotMessageSquare, title: "Auto Agent", desc: "AI that plans and creates your content end-to-end." },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <motion.section style={{ scale: heroScale }} className="relative min-h-[100dvh] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-28 pb-16 lg:pt-24 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.04] mb-5">
                Create scroll-stopping
                <br />
                content with AI
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
                    <Wand2 className="w-4 h-4" />
                    Start Creating
                    <span className="w-7 h-7 rounded-full bg-primary-foreground/15 flex items-center justify-center group-hover:bg-primary-foreground/25 transition-colors duration-300">
                      <ArrowRight className="w-3.5 h-3.5" />
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.2 }}
              className="relative aspect-[4/3] rounded-2xl border border-border/25 bg-gradient-to-b from-card/50 to-card/10 overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-xl border border-border/30 bg-card/50 flex items-center justify-center cursor-pointer hover:bg-card/80 transition-colors duration-300">
                  <Play className="w-6 h-6 text-foreground ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground/60">&quot;Cinematic product shot on marble&quot;</span>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">0:15 / 1:30</Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-3 max-w-xl mb-6 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              One studio, every format
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Video, images, voice, and the content around them in a single workspace.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.slice(0, 4).map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                className="rounded-xl border border-border/20 bg-card/30 p-6 hover:border-border/40 transition-colors duration-300"
              >
                <f.icon className="w-4 h-4 text-foreground mb-4" />
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {features.slice(4).map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                className="rounded-xl border border-border/20 bg-card/30 p-6 hover:border-border/40 transition-colors duration-300"
              >
                <f.icon className="w-4 h-4 text-foreground mb-4" />
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-width visual break */}
      <section className="border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">Platform</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                Every model, one workflow
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Ideogram 4 for text-rendered images, FLUX.2 for photorealism, LTX 2.3 for video,
                LongCat for lip-sync avatars, and voiceover from ElevenLabs and OpenAI.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/studio")}
                className="rounded-full text-xs px-5"
              >
                See all models
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Ideogram 4", label: "images" },
                { name: "FLUX.2", label: "images" },
                { name: "LTX 2.3", label: "video" },
                { name: "LongCat", label: "avatars" },
                { name: "ElevenLabs", label: "voice" },
                { name: "OpenAI TTS", label: "voice" },
              ].map((m) => (
                <div
                  key={m.name}
                  className="rounded-lg border border-border/15 bg-card/20 px-4 py-3"
                >
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">Get started</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Start creating today
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            No editing skills. No credit card required. Cancel anytime.
          </p>
          <Button
            size="lg"
            onClick={() => router.push(primaryHref)}
            className="group relative h-13 px-8 text-sm rounded-full shadow-lg shadow-primary/25 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="relative flex items-center gap-2">
              Start Creating
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
