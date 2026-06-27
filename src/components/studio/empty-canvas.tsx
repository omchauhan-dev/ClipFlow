'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import type { GenModel } from './models';
import { motion } from 'framer-motion';

const PREVIEW_IDS = [
  'photo-1492691527719-9d1e07e534b4',
  'photo-1535223289827-42f1e9919769',
  'photo-1614851099511-773084f6911d',
  'photo-1618005182384-a83a8bd57fbe',
  'photo-1620121692029-d088224ddc74',
];

function imgUrl(id: string, w = 480, h = 600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

const HEADLINES: Record<string, string> = {
  image: 'Start creating your image',
  video: 'Start creating your video',
  lipsync: 'Make a talking face',
  avatar: 'Make your avatar speak',
};

export function EmptyCanvas({ model }: { model: GenModel }) {
  const headline = HEADLINES[model.kind] || 'Start creating';

  return (
    <div className="relative flex h-full min-h-[340px] flex-col items-center justify-center overflow-hidden px-4 sm:min-h-[420px]">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Fanned preview images */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
            className="pointer-events-none mb-6 flex items-center justify-center sm:mb-8"
          >
            {PREVIEW_IDS.map((id, i) => {
              const offset = i - (PREVIEW_IDS.length - 1) / 2;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, rotate: offset * 5, y: 20 }}
                  animate={{ opacity: 1, rotate: offset * 5, y: Math.abs(offset) * 10 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                  className="relative -mx-3 h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50 transition-transform duration-500 hover:scale-105 hover:-translate-y-2 sm:-mx-5 sm:h-52 sm:w-40 sm:rounded-2xl"
                  style={{ zIndex: PREVIEW_IDS.length - Math.abs(offset) }}
                >
                  <img
                    src={imgUrl(id)}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/3 h-72 w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative z-10 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-gradient-to-b from-card/60 to-card/20 backdrop-blur px-3.5 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Powered by AI
            </div>
            <h2 className="text-xl font-bold tracking-tight sm:text-3xl">{headline}</h2>
            <p className="mt-2 text-[13px] text-muted-foreground sm:text-sm max-w-sm mx-auto leading-relaxed">
              Describe a scene, character, mood, or style — and watch it come to life.
            </p>
          </motion.div>
        </div>
  );
}
