'use client';

import { useState } from 'react';
import { Bot, ArrowLeft, ChevronDown } from 'lucide-react';
import {
  Sidebar, SidebarHeader, SidebarContent,
  SidebarTrigger, SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MODELS, getModel } from '@/components/studio/models';

interface StudioSidebarProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function StudioSidebar({ selectedModel, onModelChange }: StudioSidebarProps) {
  const [modelOpen, setModelOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/40">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-semibold leading-tight">Models</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a href="/projects" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden">
              <ArrowLeft className="h-3 w-3" />
            </a>
            <SidebarTrigger className="text-muted-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:hidden flex flex-col">
        <div className="relative px-3 pt-2">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="flex w-full items-center gap-1.5 rounded-lg border border-border/40 bg-card/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
          >
            <Bot className="h-3 w-3 text-primary" />
            <span className="font-medium flex-1 text-left">{getModel(selectedModel).name}</span>
            <span className="tabular-nums text-muted-foreground/50">{getModel(selectedModel).credits}cr</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', modelOpen && 'rotate-180')} />
          </button>
          {modelOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
              <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-border/50 bg-popover shadow-lg overflow-hidden">
                {(() => {
                  const groups = Array.from(new Set(MODELS.map(m => m.group)));
                  return groups.map(group => (
                    <div key={group}>
                      <div className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">{group}</div>
                      {MODELS.filter(m => m.group === group).map(m => (
                        <button
                          key={m.id}
                          onClick={() => { onModelChange(m.id); setModelOpen(false); }}
                          className={cn(
                            'flex w-full items-center gap-2 px-2.5 py-1.5 text-xs transition-colors',
                            selectedModel === m.id
                              ? 'bg-primary/10 text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                          )}
                        >
                          <div className={cn(
                            'h-2.5 w-2.5 rounded-full border',
                            selectedModel === m.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          )} />
                          <span className="flex-1 text-left">{m.name}</span>
                          <span className="tabular-nums text-muted-foreground/50">{m.credits}cr</span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
