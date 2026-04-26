"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Play, X, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StudioMode } from "./mode-selector";
import Image from "next/image";

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
    // Reset image if changing to a mode that doesn't need it
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
        {image && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden self-start border-2 border-accent/20 animate-in fade-in slide-in-from-bottom-2">
            <Image src={image} alt="Upload preview" fill className="object-cover" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-background rounded-full text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className={cn(
          "relative bg-secondary p-2 rounded-2xl transition-all duration-300",
          "focus-within:ring-1 focus-within:ring-accent focus-within:shadow-accent-glow"
        )}>
          <div className="flex items-start gap-4 pr-1">
            <div className="mt-3 ml-3 text-muted">
              {/* Contextual Icon Display if needed */}
            </div>
            
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PLACEHOLDERS[mode]}
              disabled={isGenerating}
              className="flex-1 min-h-[60px] max-h-[160px] bg-transparent border-none focus-visible:ring-0 resize-none py-4 text-sm font-medium"
            />

            <div className="flex items-center gap-2 py-2">
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
                    className="h-10 w-10 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </>
              )}

              {isGenerating ? (
                <Button
                  onClick={onCancel}
                  className="h-10 w-10 p-0 bg-card hover:bg-destructive hover:text-white rounded-xl transition-all animate-in zoom-in"
                >
                  <StopCircle className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() && !image}
                  className="h-10 px-6 bg-accent text-background hover:bg-accent/90 rounded-xl font-bold flex gap-2 green-gradient transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
              {prompt.length} Characters
            </span>
            <div className="flex items-center gap-1 text-[10px] bg-card px-2 py-0.5 rounded text-muted">
               <span className="w-1 h-1 bg-accent rounded-full animate-pulse" />
               ~45 sec on L40S
            </div>
          </div>
          <span className="text-[10px] text-accent/60 font-medium">
            $0.028 / generation
          </span>
        </div>
      </div>
    </div>
  );
}
