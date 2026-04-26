"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Download, Film, Image as ImageIcon, Music, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface HistoryItem {
  id: string;
  type: "video" | "image" | "audio";
  thumbnail: string;
  model: string;
  timestamp: string;
}

const DUMMY_HISTORY: HistoryItem[] = [
  { id: "1", type: "video", thumbnail: "https://picsum.photos/seed/h1/200/200", model: "Wan 2.2", timestamp: "2m ago" },
  { id: "2", type: "image", thumbnail: "https://picsum.photos/seed/h2/200/200", model: "FLUX Dev", timestamp: "1h ago" },
  { id: "3", type: "video", thumbnail: "https://picsum.photos/seed/h3/200/200", model: "LTX-2.3", timestamp: "3h ago" },
  { id: "4", type: "audio", thumbnail: "https://picsum.photos/seed/h4/200/200", model: "Gemini TTS", timestamp: "Yesterday" },
];

export function HistorySidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn(
      "fixed right-0 top-16 bottom-0 transition-all duration-500 ease-in-out z-40 flex",
      isOpen ? "w-80" : "w-0"
    )}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 p-2 bg-card rounded-l-xl text-muted hover:text-accent hover:bg-secondary border-r-transparent transition-all",
          isOpen ? "bg-secondary" : "bg-card"
        )}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Panel Content */}
      <div className="flex-1 bg-secondary/80 backdrop-blur-xl border-l border-border/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border/10 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">HISTORY</h2>
          <span className="text-[10px] text-muted font-bold px-2 py-0.5 bg-card rounded-full">
            {DUMMY_HISTORY.length} ITEMS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {DUMMY_HISTORY.map((item) => (
            <div 
              key={item.id} 
              className="group bg-card/40 hover:bg-card p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background">
                  <Image src={item.thumbnail} alt="History Thumbnail" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {item.type === "video" && <Film className="w-5 h-5 text-white/70" />}
                    {item.type === "image" && <ImageIcon className="w-5 h-5 text-white/70" />}
                    {item.type === "audio" && <Music className="w-5 h-5 text-white/70" />}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-foreground truncate">{item.model}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <button className="text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                        RE-OPEN
                     </button>
                  </div>
                </div>

                <button className="absolute right-2 bottom-2 p-1.5 bg-background rounded-lg text-muted opacity-0 group-hover:opacity-100 transition-all hover:text-accent">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
