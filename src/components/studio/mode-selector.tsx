
"use client";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Drama, 
  Clapperboard, 
  Image as ImageIcon, 
  Music, 
  Sparkles, 
  Smartphone, 
  Box 
} from "lucide-react";
import { motion } from "framer-motion";

export type StudioMode = 
  | "talking-actor" 
  | "scene-video" 
  | "character-image" 
  | "audio-only" 
  | "pixar" 
  | "ugc" 
  | "product";

const MODES = [
  { id: "talking-actor", label: "Talking Actor", icon: Drama },
  { id: "scene-video", label: "Scene Video", icon: Clapperboard },
  { id: "character-image", label: "Character Image", icon: ImageIcon },
  { id: "audio-only", label: "Audio Only", icon: Music },
  { id: "pixar", label: "Pixar Style", icon: Sparkles },
  { id: "ugc", label: "UGC Ad", icon: Smartphone },
  { id: "product", label: "Product Shot", icon: Box },
] as const;

interface ModeSelectorProps {
  activeMode: StudioMode;
  onChange: (mode: StudioMode) => void;
}

export function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  return (
    <div className="w-full flex justify-center px-6 mb-2">
      <ScrollArea className="w-full max-w-3xl whitespace-nowrap">
        <div className="flex gap-2 p-1">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => onChange(mode.id as StudioMode)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 outline-none",
                  isActive 
                    ? "text-background" 
                    : "bg-secondary text-muted hover:text-foreground hover:bg-card"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mode-bg"
                    className="absolute inset-0 bg-accent rounded-full shadow-accent-glow"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-background" : "text-muted")} />
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
