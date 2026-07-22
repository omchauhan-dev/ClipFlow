'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PromptBar } from '@/components/studio/prompt-bar';
import { EmptyCanvas } from '@/components/studio/empty-canvas';
import { getModel, endpointFor, type GenModel } from '@/components/studio/models';
import { StudioSidebar } from '@/components/studio-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Image as ImageIcon, Coins,
  FileVideo, Download, X, Trash2, Play, Mic, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface Job {
  id: string;
  prompt: string;
  status: string;
  job_type: string;
  output_url: string;
  image_url?: string;
  r2_url?: string;
  created_at: string;
  model?: string;
}

export default function StudioProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedModel, setSelectedModel] = useState('flux2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStart, setGenerationStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [droppedImage, setDroppedImage] = useState<string | null>(null);
  const [droppedAudio, setDroppedAudio] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [agentLlm, setAgentLlm] = useState('meta-llama/llama-4-scout-17b-16e-instruct');

  const activeModel = getModel(selectedModel);
  const isVideoModel = activeModel.kind !== 'image';

  const fetchCredits = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/credits', { headers: { Authorization: `Bearer ${session.access_token}` } });
    const { balance } = await res.json();
    setCredits(balance);
  }, []);

  const fetchProject = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    if (data) setProject(data);
  }, [id]);

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setJobs(data);
  }, [id]);

  const startPolling = useCallback(async () => {
    let sawProcessing = false;
    for (let i = 0; i < 200; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('project_id', id)
        .eq('status', 'processing');
      const count = data?.length ?? 0;
      fetchJobs();
      if (count > 0) {
        sawProcessing = true;
      } else if (sawProcessing || i >= 10) {
        setIsGenerating(false);
        return;
      }
    }
    setIsGenerating(false);
  }, [id, fetchJobs]);

  const handleCancel = async () => {
    setIsGenerating(false);
    const { data: processingJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('project_id', id)
      .eq('status', 'processing');
    if (processingJobs?.length) {
      await supabase.from('jobs').update({ status: 'failed' }).eq('project_id', id).eq('status', 'processing');
      fetchJobs();
    }
  };

  useEffect(() => {
    fetchProject();
    fetchJobs();
    fetchCredits();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchProject, fetchJobs, fetchCredits]);

  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - generationStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isGenerating, generationStart]);

  useEffect(() => {
    if (isGenerating) return;
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const processingJob = jobs.find((j) => j.status === 'processing' && j.created_at > tenMinAgo);
    if (processingJob) {
      setIsGenerating(true);
      setGenerationStart(Date.now());
      startPolling();
    }
  }, [jobs, isGenerating, startPolling]);

  async function handleDeleteJob(jobId: string) {
    await supabase.from('jobs').delete().eq('id', jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJob?.id === jobId) setSelectedJob(null);
  }

  async function deductCredits(cost: number, model: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    try {
      const check = await fetch('/api/credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { balance = 0 } = await check.json();
      if (balance < cost) {
        setShowUpgrade(true);
        return false;
      }
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ amount: cost, model }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.balance !== undefined) setCredits(data.balance);
        return true;
      }
    } catch {
      /* don't block generation on credit errors */
    }
    return true;
  }

  async function handleGenerate(
    prompt: string,
    image: string | undefined,
    model: GenModel,
    options: { duration?: number; width?: number; height?: number; num_inference_steps?: number; seed?: number; audio?: string; voice_id?: string },
  ) {
    if (model.needsImage && !image) {
      alert(`${model.name} needs an image. Click + to add one.`);
      return;
    }

    const ok = await deductCredits(model.credits, model.id);
    if (!ok) return;
    setIsGenerating(true);
    setGenerationStart(Date.now());
    setSelectedJob(null);

    const endpoint = endpointFor(model.kind);

    if (model.kind === 'avatar') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: image,
          text: options.audio ? undefined : prompt,
          audio_url: options.audio,
          voice_id: options.voice_id,
          project_id: id,
          resolution: '480p',
        }),
      });
      startPolling();
      return;
    }

    if (model.kind === 'voiceover') {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt, voice_id: options.voice_id }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setVoiceoverUrl(url);
        setDroppedAudio(url);
      }
      setIsGenerating(false);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: model.id,
        image,
        project_id: id,
        duration: options.duration || 5,
        width: options.width || 1024,
        height: options.height || 576,
        num_inference_steps: options.num_inference_steps || 20,
        seed: options.seed || Math.floor(Math.random() * 10000),
      }),
    });

    startPolling();
  }

  function getJobUrl(job: Job) {
    return job.r2_url || job.output_url || job.image_url || '';
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background flex-1">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center border-b border-border/20 px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border/40" />
            <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[320px]">{project?.name || '...'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/account')}
              className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 transition-colors px-2.5 py-1.5"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-semibold tabular-nums">{credits}</span>
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex flex-1 overflow-hidden">
          <StudioSidebar
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            agentLlm={agentLlm}
            onAgentLlmChange={setAgentLlm}
            onJobsCreated={() => { setIsGenerating(true); setGenerationStart(Date.now()); startPolling(); }}
            onCreditsChange={(b) => setCredits(b)}
            onShowUpgrade={() => setShowUpgrade(true)}
          />
          <SidebarInset className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = () => setDroppedImage(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  const url = e.dataTransfer.getData('text/plain');
                  if (url && url.startsWith('http')) setDroppedImage(url);
                }
              }}
            >
              <div className="mx-auto w-full max-w-5xl">
                <div className="grid auto-rows-max grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {/* Generating card */}
                  <AnimatePresence>
                    {isGenerating && (
                      <motion.div
                        key="generating-card"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="relative aspect-square overflow-hidden rounded-xl border border-border/25 bg-card/30"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/30 bg-card/50">
                            {isVideoModel ? (
                              <FileVideo className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground/80">Creating...</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCancel}
                          className="absolute right-2.5 top-2.5 rounded-lg bg-background/60 p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Job cards */}
                  {jobs.map((job) => {
                    const url = getJobUrl(job);
                    const isVideo = url.endsWith('.mp4') || job.job_type === 'video';
                    const isSelected = selectedJob?.id === job.id;
                    const isCompleted = job.status === 'completed' && url;
                    const isProcessing = job.status === 'processing';

                    return (
                      <div
                        key={job.id}
                        draggable={!!(isCompleted && url)}
                        onDragStart={(e) => {
                          if (isCompleted && url) {
                            e.dataTransfer.setData('text/plain', url);
                            e.dataTransfer.effectAllowed = 'copy';
                          }
                        }}
                      >
                        <motion.button
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => (isCompleted ? setSelectedJob(isSelected ? null : job) : null)}
                          className={cn(
                            'relative w-full overflow-hidden rounded-xl border text-left transition-all duration-300',
                            isSelected
                              ? 'border-primary/40 ring-1 ring-primary/15'
                              : 'border-border/30 hover:border-border/60',
                            isCompleted ? 'bg-black/30' : 'bg-card/20'
                          )}
                        >
                          {isCompleted ? (
                            <>
                              {isVideo ? (
                                <video src={url} className="aspect-square w-full object-cover" />
                              ) : (
                                <img src={url} alt="" className="aspect-square w-full object-cover" />
                              )}
                            </>
                          ) : (
                            <div className="aspect-square w-full bg-card/10">
                              {isProcessing && (
                                <div className="absolute inset-0 bg-card/5" />
                              )}
                            </div>
                          )}

                          {isCompleted && (
                            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                              <div className="rounded-lg bg-black/60 p-1.5">
                                {isVideo ? (
                                  <Play className="h-3 w-3 text-white/80" />
                                ) : (
                                  <ImageIcon className="h-3 w-3 text-white/80" />
                                )}
                              </div>
                            </div>
                          )}

                          {!isCompleted && (
                            <div className="absolute right-2.5 top-2.5">
                              <div
                                onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                                className="rounded-lg bg-background/60 p-1.5 text-muted-foreground cursor-pointer transition-colors hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-6">
                            <p className="truncate text-[11px] leading-tight text-white/70">{job.prompt}</p>
                          </div>
                        </motion.button>
                      </div>
                    );
                  })}

                  {/* Voiceover player */}
                  {voiceoverUrl && (
                    <div className="col-span-full">
                      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 backdrop-blur">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Mic className="h-4 w-4 text-primary" />
                        </div>
                        <audio src={voiceoverUrl} controls className="flex-1 h-9" />
                        <button
                          onClick={() => { setVoiceoverUrl(null); URL.revokeObjectURL(voiceoverUrl); }}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isGenerating && jobs.length === 0 && !voiceoverUrl && (
                    <div className="col-span-full">
                      <EmptyCanvas model={activeModel} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview modal */}
            <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
              <DialogContent className="max-w-3xl border-border/20 p-1">
                {selectedJob && (
                  <>
                    <div className="overflow-hidden rounded-lg bg-black">
                      {getJobUrl(selectedJob).endsWith('.mp4') || selectedJob.job_type === 'video' ? (
                        <video src={getJobUrl(selectedJob)} controls autoPlay className="aspect-video w-full object-contain" />
                      ) : (
                        <img src={getJobUrl(selectedJob)} alt="" className="aspect-video w-full object-contain" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4">
                      <p className="flex-1 truncate text-sm text-muted-foreground">{selectedJob.prompt}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getJobUrl(selectedJob), '_blank')}
                        className="h-8 gap-1.5 rounded-lg text-xs shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Upgrade dialog */}
            <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
              <DialogContent className="max-w-sm border-border/20 p-6 text-center">
                <DialogHeader>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Coins className="h-6 w-6 text-amber-400" />
                  </div>
                  <DialogTitle className="text-lg font-bold">Out of credits</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    You need more credits to generate. Upgrade your plan to keep creating.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 flex flex-col gap-2">
                  <Button asChild className="w-full gap-2 rounded-xl h-11" onClick={() => setShowUpgrade(false)}>
                    <Link href="/pricing">
                      Upgrade plan
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowUpgrade(false)} className="text-muted-foreground">
                    Maybe later
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bottom prompt bar */}
            <div className="relative z-20 shrink-0 border-t border-border/30 bg-background/60 backdrop-blur-xl p-4 sm:p-5 lg:p-6">
              <div className="mx-auto max-w-4xl">
                <PromptBar
                  isGenerating={isGenerating}
                  selectedModel={selectedModel}
                  onGenerate={handleGenerate}
                  onCancel={handleCancel}
                  droppedImage={droppedImage}
                  onDroppedImageClear={() => setDroppedImage(null)}
                  droppedAudio={droppedAudio}
                  onDroppedAudioClear={() => setDroppedAudio(null)}
                />
              </div>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
