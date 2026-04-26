"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "ltx-2.3", name: "LTX-2.3", desc: "HD Lip Sync" },
  { id: "ltx-2.2", name: "LTX-2.2", desc: "Fast Lip Sync" },
  { id: "wan-2.2", name: "Wan 2.2", desc: "HD Scene Video" },
  { id: "wan-2.1", name: "Wan 2.1", desc: "Fast Scene Video" },
  { id: "flux-dev", name: "FLUX Dev", desc: "HD Image" },
  { id: "musetalk", name: "MuseTalk", desc: "Fast Lip Sync" },
];

export function TopBar({ isGenerating }: { isGenerating: boolean }) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

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

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 transition-all rounded-lg outline-none group focus-visible:ring-1 focus-visible:ring-accent">
            <span className="text-xs font-medium text-muted">{selectedModel.name}</span>
            <span className="text-[10px] text-muted/50 hidden md:inline">({selectedModel.desc})</span>
            <ChevronDown className="w-4 h-4 text-muted group-data-[state=open]:rotate-180 transition-transform" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card p-1">
            {MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-md focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{model.name}</span>
                  <span className="text-[10px] opacity-70">{model.desc}</span>
                </div>
                {selectedModel.id === model.id && <Check className="w-3 h-3" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
