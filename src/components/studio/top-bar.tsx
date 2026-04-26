"use client";

import { cn } from "@/lib/utils";

export function TopBar({ isGenerating }: { isGenerating: boolean }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-secondary/50 backdrop-blur-md z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-headline tracking-tight">
          CLIP<span className="text-accent">FLOW</span>
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-full">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isGenerating ? "bg-accent animate-pulse shadow-accent-glow" : "bg-muted"
          )} />
          <span className="text-[10px] font-medium tracking-widest text-muted uppercase">
            {isGenerating ? "Generating" : "System Ready"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">Credits</span>
            <span className="text-xs font-bold text-accent">1,240</span>
          </div>
          <div className="h-8 w-px bg-border/20" />
          <div className="w-8 h-8 rounded-full bg-secondary border border-border/20 flex items-center justify-center text-[10px] font-bold">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
