"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Play, X, StopCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StudioMode } from "./mode-selector";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface PromptBarProps {
  mode: StudioMode;
  isGenerating: boolean;
  onGenerate: (prompt: string, image?: string) => void;
  onCancel: () => void;
}

const PLACEHOLDERS: Record<StudioMode, string> = {
  "talking-actor": "Describe your actor and what they say...",
  "scene-video": "Describe your scene in detail...",
  "character-image": "Describe your character's appearance...",
  "audio-only": "Enter your script to be spoken...",
  "pixar": "Describe your Pixar-style scene...",
  "ugc": "Describe your product and the core message...",
  "product": "Describe the product and background...",
};

export function PromptBar({ mode, isGenerating, onGenerate, onCancel }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsImage = ["talking-actor", "product"].includes(mode);

  useEffect(() => {
    if (!needsImage) setImage(null);
  }, [mode, needsImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() && !image) return;
    onGenerate(prompt, image || undefined);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-8 pt-2">
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="relative w-20 h-20 rounded-xl overflow-hidden self-start border-2 border-accent/20 shadow-accent-glow"
            >
              <Image src={image} alt="Upload preview" fill className="object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-background rounded-full text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "relative bg-secondary/80 backdrop-blur-sm border border-border/10 rounded-2xl transition-all duration-500",
          "focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/40 focus-within:shadow-accent-glow"
        )}>
          <div className="flex flex-col p-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              disabled={isGenerating}
              className="min-h-[80px] max-h-[240px] bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-4 text-sm font-medium placeholder:text-muted/50 leading-relaxed"
            />

            <div className="flex items-center justify-between gap-2 px-2 pb-1">
              <div className="flex items-center gap-1">
                {needsImage && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                      className="h-9 w-9 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <span className="text-[10px] text-muted font-medium uppercase tracking-widest opacity-50">
                    {prompt.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <Button
                    onClick={onCancel}
                    variant="destructive"
                    className="h-9 px-4 rounded-xl transition-all animate-in zoom-in font-bold text-xs gap-2"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() && (!needsImage || !image)}
                    className="h-9 px-5 bg-accent text-background hover:bg-accent/90 rounded-xl font-bold flex gap-2 green-gradient transition-all active:scale-95 shadow-accent-glow border-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Generate</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] bg-card/50 px-2 py-1 rounded-full text-muted border border-border/5">
               <div className={cn(
                 "w-1.5 h-1.5 rounded-full",
                 isGenerating ? "bg-accent animate-pulse" : "bg-muted/30"
               )} />
               {isGenerating ? "Processing on L40S Cluster" : "L40S Cluster Ready"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-muted font-bold tracking-tighter uppercase opacity-40">
              Est. ~45s
            </span>
            <span className="text-[9px] text-accent font-bold tracking-tighter uppercase">
              $0.02 / Credit
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
