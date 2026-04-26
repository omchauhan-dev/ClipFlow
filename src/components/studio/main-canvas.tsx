
"use client";

import { Download, RefreshCw, Share2, Hexagon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface MainCanvasProps {
  state: "idle" | "generating" | "complete" | "failed";
  output: {
    type: "video" | "image";
    url: string;
  } | null;
  error?: string;
  progress: number;
  statusText?: string;
  onRetry: () => void;
}

export function MainCanvas({ state, output, error, progress, statusText, onRetry }: MainCanvasProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-secondary/50 text-accent/20">
              <Hexagon className="w-10 h-10" />
            </div>
            <p className="text-muted text-sm font-medium tracking-wide">
              Select a mode and describe your scene
            </p>
          </motion.div>
        )}

        {state === "generating" && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-accent animate-pulse">{statusText || "Initializing..."}</span>
                <span className="text-muted">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1 bg-card overflow-hidden">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-accent shadow-accent-glow" 
                 />
              </Progress>
            </div>
            <p className="text-center text-[10px] text-muted uppercase tracking-[0.2em]">
              Processing on L40S Cluster
            </p>
          </motion.div>
        )}

        {state === "complete" && output && (
          <motion.div 
            key="complete"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full max-w-5xl flex flex-col gap-6"
          >
            <div className="flex-1 relative bg-secondary rounded-2xl overflow-hidden shadow-2xl group">
              {output.type === "video" ? (
                <video 
                  src={output.url} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image 
                  src={output.url} 
                  alt="Generated content" 
                  fill 
                  className="object-contain"
                />
              )}
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="bg-background/80 hover:bg-background backdrop-blur-sm rounded-full w-10 h-10">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="bg-background/80 hover:bg-background backdrop-blur-sm rounded-full w-10 h-10">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-3"
            >
               <Button 
                  onClick={onRetry}
                  variant="outline" 
                  className="bg-card/50 hover:bg-card border-none rounded-full px-6 text-xs h-10 gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
                <Button 
                  className="bg-accent text-background hover:bg-accent/90 green-glow border-none rounded-full px-8 text-xs font-bold h-10 gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HD
                </Button>
            </motion.div>
          </motion.div>
        )}

        {state === "failed" && (
          <motion.div 
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-destructive text-sm font-semibold">Generation Failed</p>
              <p className="text-muted text-xs max-w-xs">{error || "An unexpected error occurred during generation."}</p>
            </div>
            <Button onClick={onRetry} variant="outline" className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 px-8">
              Retry Generation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
