'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Bot, Loader2, Sparkles, ArrowLeft, MessageSquare, ChevronDown,
  Brain, Cpu, Zap, CheckCircle2, RefreshCw, Layers,
} from 'lucide-react';
import {
  Sidebar, SidebarHeader, SidebarContent,
  SidebarTrigger, SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MODELS, getModel } from '@/components/studio/models';

interface PlanScene {
  n?: number; title?: string; start?: number; end?: number;
  shot?: string; camera?: string; lighting?: string;
  action?: string; voiceover?: string; script?: string;
  kind?: 'image' | 'video'; prompt?: string; duration?: number;
}
interface AgentPlan {
  title?: string; concept?: string; format?: string;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  characters?: Array<{ name?: string; description?: string }>;
  scenes?: PlanScene[];
}

interface StudioSidebarProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  agentLlm: string;
  onAgentLlmChange: (llm: string) => void;
  onJobsCreated?: () => void;
  onCreditsChange?: (balance: number) => void;
  onShowUpgrade?: () => void;
}

const LLM_OPTIONS = [
  { id: 'meta-llama/llama-4-vision-10b', label: 'Llama 4 Vision 10B', provider: 'Groq', desc: 'Vision-capable model (supports image input)' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', provider: 'Groq', desc: 'Fast, balanced text model' },
  { id: 'meta-llama/llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'Groq', desc: 'More capable text model' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', provider: 'Groq', desc: 'Strong reasoning' },
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function AgentAvatar({ state }: { state: 'idle' | 'thinking' | 'planning' | 'refining' | 'executing' | 'done' }) {
  const pulse = state === 'thinking' || state === 'planning' || state === 'refining' || state === 'executing';
  const iconMap = {
    idle: Bot,
    thinking: Brain,
    planning: Cpu,
    refining: RefreshCw,
    executing: Zap,
    done: CheckCircle2,
  };
  const Icon = iconMap[state];
  const colors = {
    idle: 'text-primary',
    thinking: 'text-amber-400',
    planning: 'text-blue-400',
    refining: 'text-violet-400',
    executing: 'text-rose-400',
    done: 'text-emerald-400',
  };

  return (
    <div className={cn(
      'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-300',
      pulse ? 'border-primary/40 bg-primary/15' : 'border-border/50 bg-secondary/40',
    )}>
      <Icon className={cn('h-4 w-4 transition-colors', colors[state])} />
      {pulse && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-primary/10" />
      )}
    </div>
  );
}

export function StudioSidebar({ selectedModel, onModelChange, agentLlm, onAgentLlmChange, onJobsCreated, onCreditsChange, onShowUpgrade }: StudioSidebarProps) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [modelOpen, setModelOpen] = useState(false);
  const [llmOpen, setLlmOpen] = useState(false);

  const [agentChat, setAgentChat] = useState<Array<{ role: 'user' | 'assistant'; content: string; options?: string[] }>>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [agentExecuting, setAgentExecuting] = useState(false);
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentChained, setAgentChained] = useState(false);
  const [agentIterative, setAgentIterative] = useState(false);
  const [agentThinkingStage, setAgentThinkingStage] = useState<'thinking' | 'planning'>('thinking');
  const [refinePass, setRefinePass] = useState(0);
  const [refineLog, setRefineLog] = useState<string[]>([]);

  const jobIdsRef = useRef<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentChat, agentThinking, agentReply, refineLog]);

  const MEM_KEY = `agent-memory-${id}`;

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEM_KEY);
      if (saved) {
        const { chat, plan, reply, chained, iterative } = JSON.parse(saved);
        if (chat) setAgentChat(chat);
        if (plan) setAgentPlan(plan);
        if (reply) setAgentReply(reply);
        if (typeof chained === 'boolean') setAgentChained(chained);
        if (typeof iterative === 'boolean') setAgentIterative(iterative);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(MEM_KEY, JSON.stringify({
        chat: agentChat,
        plan: agentPlan,
        reply: agentReply,
        chained: agentChained,
        iterative: agentIterative,
      }));
    } catch { /* ignore */ }
  }, [agentChat, agentPlan, agentReply, agentChained, agentIterative, MEM_KEY, loaded]);

  useEffect(() => {
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, []);

  const resetAgent = useCallback(() => {
    setAgentPlan(null);
    setAgentReply(null);
    setAgentInput('');
    setRefinePass(0);
    setRefineLog([]);
  }, []);

  const startOver = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    jobIdsRef.current = [];
    setAgentChat([]);
    resetAgent();
    try { localStorage.removeItem(MEM_KEY); } catch { /* ignore */ }
  }, [MEM_KEY]);

  const sendAgentMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || agentThinking) return;
    const nextChat = [...agentChat, { role: 'user' as const, content: msg }];
    setAgentChat(nextChat);
    setAgentInput('');
    setAgentThinking(true);
    setAgentThinkingStage('thinking');
    setTimeout(() => setAgentThinkingStage('planning'), 1500);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextChat, project_id: id, llm: agentLlm }),
      });
      const data = await res.json();
      const reply = data.reply || 'Updated.';
      const options = data.options || [];
      setAgentChat([...nextChat, { role: 'assistant', content: reply, options }]);
      if (data.plan) setAgentPlan(data.plan as AgentPlan);
    } catch {
      setAgentChat([...nextChat, { role: 'assistant', content: 'Sorry, that failed — try again.' }]);
    }
    setAgentThinking(false);
  }, [agentChat, agentThinking, id]);

  const runRefinement = useCallback(async (plan: AgentPlan, totalPasses: number) => {
    const critiques = [
      'Make the visuals more cinematic. Add specific lighting direction (golden hour, dramatic side-light, soft diffused). Improve camera movements — add tracking, dolly, or crane shots. Make prompts more vivid with sensory details.',
      'Strengthen the narrative arc. Ensure each scene advances the story. Make character expressions and actions more specific. Improve the voiceover to be more compelling and natural.',
      'Polish every prompt to perfection. Ensure color grading is specified (warm, cool, teal-and-orange). Add atmospheric details (weather, time of day, environment mood). Make transitions between scenes smoother.',
    ];

    const log: string[] = [];
    let currentPlan = plan;

    for (let p = 1; p <= totalPasses; p++) {
      const critique = critiques[Math.min(p - 1, critiques.length - 1)];
      log.push(`Pass ${p}: Refining...`);
      setRefineLog([...log]);
      setRefinePass(p);

      try {
        const res = await fetch('/api/agent/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: currentPlan, pass: p, critique }),
        });
        const data = await res.json();
        if (data.plan) {
          currentPlan = data.plan as AgentPlan;
          setAgentPlan(currentPlan);
          log[log.length - 1] = `Pass ${p}: ${data.reply || 'Refined'}`;
          if (data.improvements) {
            log.push(`  → ${data.improvements}`);
          }
          setRefineLog([...log]);
        } else {
          log[log.length - 1] = `Pass ${p}: No changes`;
          setRefineLog([...log]);
        }
      } catch {
        log[log.length - 1] = `Pass ${p}: Failed`;
        setRefineLog([...log]);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    setRefineLog(log);
  }, []);

  const executePlan = useCallback(async () => {
    if (!agentPlan) {
      setAgentChat(prev => [...prev, { role: 'assistant', content: 'No plan yet. Chat with the agent first.' }]);
      return;
    }
    const scenes = (Array.isArray(agentPlan.scenes) ? agentPlan.scenes : []).filter((s) => (s.prompt || s.action || '').trim());
    if (scenes.length === 0) {
      setAgentChat(prev => [...prev, { role: 'assistant', content: 'No scenes to generate. Chat with the agent to build a plan first.' }]);
      return;
    }

    if (agentIterative) {
      setAgentExecuting(true);
      setRefineLog([]);
      setRefinePass(0);
      await runRefinement(agentPlan, 3);
      setAgentExecuting(false);
    }

    setAgentExecuting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: session ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ plan: agentPlan, project_id: id, chained: agentChained }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          onShowUpgrade?.();
          setAgentChat(prev => [...prev, { role: 'assistant', content: 'Not enough credits. Top up and try again.' }]);
        } else {
          setAgentChat(prev => [...prev, { role: 'assistant', content: data.error || 'Generation failed. Try again.' }]);
        }
        setAgentExecuting(false);
        return;
      }
      if (data.balance !== undefined) onCreditsChange?.(data.balance);
      onJobsCreated?.();

      const total = data.count ?? scenes.length;
      jobIdsRef.current = (data.jobs as string[]) || [];
      setAgentChat(prev => [...prev, {
        role: 'assistant',
        content: `Creating ${total} scene${total === 1 ? '' : 's'}...`
      }]);

      // Poll until all jobs finish
      await new Promise<void>((resolve) => {
        pollRef.current = setInterval(async () => {
          const ids = jobIdsRef.current;
          if (ids.length === 0) { clearInterval(pollRef.current!); pollRef.current = null; resolve(); return; }

          const { data: jobData } = await supabase
            .from('jobs')
            .select('id, status')
            .in('id', ids);

          if (!jobData) return;

          const completed = jobData.filter(j => j.status === 'completed').length;
          const failed = jobData.filter(j => j.status === 'failed').length;
          const processing = jobData.filter(j => j.status === 'processing').length;
          const totalDone = completed + failed;

          if (totalDone === ids.length) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setAgentChat(prev => [...prev, {
              role: 'assistant',
              content: failed > 0
                ? `${completed} scene${completed === 1 ? '' : 's'} ready, ${failed} failed.`
                : `All ${completed} scene${completed === 1 ? '' : 's'} complete!`
            }]);
            setAgentExecuting(false);
            resolve();
          } else {
            setAgentChat(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant' && last.content.startsWith('Creating ') && !last.content.includes('complete')) {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...last,
                  content: `Creating ${total} scene${total === 1 ? '' : 's'}... ${completed + failed}/${total} done, ${processing} rendering`
                };
                return updated;
              }
              return prev;
            });
          }
        }, 2500);
      });
    } catch {
      setAgentExecuting(false);
      setAgentChat(prev => [...prev, { role: 'assistant', content: 'Could not start generation. Try again.' }]);
    }
  }, [agentPlan, agentChained, agentIterative, id, onJobsCreated, onCreditsChange, onShowUpgrade, runRefinement]);

  const agentState = agentExecuting ? (agentIterative && refinePass > 0 ? 'refining' : 'executing') : agentThinking ? agentThinkingStage : agentPlan ? 'done' : agentReply ? 'done' : 'idle';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AgentAvatar state={agentState} />
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-semibold leading-tight">Auto Agent</div>
              <div className="relative">
                <button
                  onClick={() => setLlmOpen(!llmOpen)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                >
                  {LLM_OPTIONS.find(l => l.id === agentLlm)?.label || 'Llama 4 Scout'}
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {llmOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLlmOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border/50 bg-popover shadow-lg overflow-hidden">
                      {LLM_OPTIONS.map(l => (
                        <button
                          key={l.id}
                          onClick={() => { onAgentLlmChange(l.id); setLlmOpen(false); }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                            agentLlm === l.id
                              ? 'bg-primary/10 text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                          )}
                        >
                          <div className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            agentLlm === l.id ? 'bg-primary' : 'bg-muted-foreground/30'
                          )} />
                          <div className="flex-1">
                            <div className="text-[11px] font-medium">{l.label}</div>
                            <div className="text-[10px] text-muted-foreground/50">{l.desc}</div>
                          </div>
                          <span className="text-[9px] text-muted-foreground/40">{l.provider}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push('/projects')}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <SidebarTrigger className="text-muted-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:hidden flex flex-col">
        {/* Model selector */}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scroll-smooth">
          {agentChat.length === 0 && !agentReply && !refineLog.length && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
              <div className="relative mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-fuchsis-500/10 animate-pulse-glow">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <p className="text-sm font-medium text-foreground/80">What would you like to create?</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                I can help you plan and generate videos, images, and talking avatars — just describe your idea.
              </p>
            </div>
          )}

          {agentChat.map((m, i) => (
            <div key={i} className="space-y-1.5">
              <div
                className={cn(
                  'flex items-start gap-2.5 animate-fade-in',
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn('text-sm leading-relaxed max-w-[85%]')}>
                  <span className={cn(
                    'inline-block rounded-2xl px-3.5 py-2',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-md'
                      : 'bg-secondary text-foreground rounded-tl-md border border-border/30 shadow-sm'
                  )}>
                    {m.content}
                  </span>
                </div>
              </div>
              {m.role === 'assistant' && m.options && m.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-9 animate-slide-up">
                  {m.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => sendAgentMessage(opt)}
                      disabled={agentThinking}
                      className="rounded-full border border-primary/25 bg-primary/6 px-3 py-1 text-[11px] font-medium text-primary/80 hover:bg-primary/15 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {agentThinking && (
            <div className="flex items-start gap-2.5 animate-fade-in">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-400/5 mt-1">
                <Brain className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-secondary text-foreground border border-border/30 shadow-sm px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-amber-400">
                    {agentThinkingStage === 'thinking' ? 'Analyzing your request' : 'Building your plan'}
                  </span>
                  <TypingDots />
                </div>
                <p className="text-[11px] text-muted-foreground/70">
                  {agentThinkingStage === 'thinking'
                    ? 'Reading your brief, understanding the creative direction...'
                    : 'Structuring scenes, selecting models, optimizing prompts...'}
                </p>
              </div>
            </div>
          )}

          {/* Refinement log */}
          {refineLog.length > 0 && (
            <div className="rounded-xl border border-violet-400/20 bg-gradient-to-b from-violet-400/8 to-transparent p-3 animate-scale-in">
              <div className="flex items-center gap-2 mb-2.5">
                <RefreshCw className={cn('h-4 w-4 text-violet-400', refinePass > 0 && refinePass <= 3 && 'animate-spin')} />
                <p className="text-xs font-semibold text-violet-400">Iterative Refinement</p>
                <span className="text-[10px] text-muted-foreground ml-auto">Pass {refinePass}/3</span>
              </div>
              <div className="space-y-1">
                {refineLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    {entry.startsWith('  →') ? (
                      <>
                        <span className="text-muted-foreground/40 mt-0.5">↳</span>
                        <span className="text-muted-foreground/70">{entry.replace('  → ', '')}</span>
                      </>
                    ) : (
                      <>
                        {i < refinePass || (refinePass >= 3 && i < refineLog.length - 1) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin mt-0.5 shrink-0" />
                        )}
                        <span className="text-foreground/80">{entry}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {agentReply && agentChat.length === 0 && !refineLog.length && (
            <div className="flex items-start gap-2.5 animate-fade-in">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-secondary text-foreground border border-border/30 shadow-sm px-3.5 py-2.5 text-sm">
                {agentReply}
              </div>
            </div>
          )}

          {agentPlan && !agentThinking && !agentExecuting && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/8 to-transparent p-3.5 animate-scale-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{agentPlan.title || 'Creative Plan'}</p>
                {refinePass > 0 && (
                  <span className="text-[10px] text-violet-400 font-medium ml-auto">v{refinePass + 1}</span>
                )}
              </div>
              {agentPlan.concept && (
                <p className="text-xs text-muted-foreground/80 mb-2.5 leading-relaxed line-clamp-3">{agentPlan.concept}</p>
              )}
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {agentPlan.format && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5">
                    <Zap className="h-3 w-3 text-primary/60" />
                    {agentPlan.format}
                  </span>
                )}
                {agentPlan.aspect_ratio && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5">
                    {agentPlan.aspect_ratio}
                  </span>
                )}
                {Array.isArray(agentPlan.scenes) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5">
                    {agentPlan.scenes.length} scenes
                  </span>
                )}
                {(() => {
                  const scenes = Array.isArray(agentPlan.scenes) ? agentPlan.scenes : [];
                  const s = scenes.filter(sc => sc.kind);
                  const v = s.filter(x => x.kind === 'video').length;
                  const im = s.filter(x => x.kind === 'image').length;
                  return (
                    <>
                      {v > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5">{v} video{v > 1 ? 's' : ''}</span>}
                      {im > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5">{im} image{im > 1 ? 's' : ''}</span>}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/20 px-3 py-2.5 space-y-2">
          <textarea
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAgentMessage(agentInput); } }}
            placeholder={agentPlan ? 'Refine the plan…' : 'Describe your creative idea…'}
            disabled={agentThinking || agentExecuting}
            rows={2}
            className="w-full resize-none rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-sm outline-none focus:border-primary/40 disabled:opacity-50 placeholder:text-muted-foreground/50 transition-colors"
          />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => sendAgentMessage(agentInput)}
              disabled={!agentInput.trim() || agentThinking || agentExecuting}
              className="flex-1 h-8 rounded-lg border border-border/50 bg-card/40 text-xs font-medium text-foreground/80 hover:bg-card/70 hover:text-foreground transition-colors disabled:opacity-40"
            >
              {agentThinking ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking
                </span>
              ) : (
                'Send'
              )}
            </button>
            {agentPlan && (
              <button
                onClick={executePlan}
                disabled={agentExecuting || agentThinking}
                className="flex-1 h-8 rounded-lg bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {agentExecuting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    {agentIterative && refinePass > 0 ? (
                      <><RefreshCw className="h-3 w-3 animate-spin" /> Refining {refinePass}/3</>
                    ) : (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Rendering</>
                    )}
                  </span>
                ) : (
                  'Create'
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {agentPlan && (agentPlan.scenes?.length || 0) > 1 && (
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={agentChained}
                    onChange={(e) => setAgentChained(e.target.checked)}
                    className="h-3 w-3 accent-primary"
                  />
                  Consistent
                </label>
              )}
              {agentPlan && (
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={agentIterative}
                    onChange={(e) => setAgentIterative(e.target.checked)}
                    className="h-3 w-3 accent-violet-500"
                  />
                  <RefreshCw className="h-3 w-3 text-violet-400/60" />
                  Iterative
                </label>
              )}
            </div>
            {(agentChat.length > 0 || agentPlan) && !agentExecuting && (
              <button onClick={startOver} className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors ml-auto">
                Start over
              </button>
            )}
          </div>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
