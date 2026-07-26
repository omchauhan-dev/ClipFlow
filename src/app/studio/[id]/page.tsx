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

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Image as ImageIcon, Coins,
  FileVideo, Download, X, Trash2, Play, Mic, ExternalLink,
  Grid3X3, Wand2, Copy, Check, Upload, Share2,
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
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string; name: string; created_at: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);


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

  const fetchUploadedImages = useCallback(async () => {
    const { data } = await supabase
      .from('library_images')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    if (data) setUploadedImages(data);
  }, [id]);

  const handleUploadImage = async (file: File) => {
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('library-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('library-uploads')
        .getPublicUrl(fileName);

      await supabase.from('library_images').insert({
        project_id: id,
        user_id: session.user.id,
        url: urlData.publicUrl,
        name: file.name,
      });

      fetchUploadedImages();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUploadedImage = async (imageId: string) => {
    await supabase.from('library_images').delete().eq('id', imageId);
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const [sharingId, setSharingId] = useState<string | null>(null);

  const handleShareToLibrary = async (job: Job) => {
    const url = getJobUrl(job);
    if (!url) return;
    setSharingId(job.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch the image and upload to R2 via API
      const imageRes = await fetch(url);
      const blob = await imageRes.blob();
      const file = new File([blob], `shared_${job.id.slice(0, 8)}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session.user.id);
      formData.append('prompt', job.prompt || '');
      formData.append('category', 'inspiration');
      formData.append('tags', job.model || '');

      await fetch('/api/library', { method: 'POST', body: formData });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharingId(null);
    }
  };

  const startPolling = useCallback(async () => {
    let sawProcessing = false;
    for (let i = 0; i < 200; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { data } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('project_id', id)
        .eq('status', 'processing');
      const count = data?.length ?? 0;
      await fetchJobs();
      if (count > 0) {
        sawProcessing = true;
      } else if (sawProcessing || i >= 5) {
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
    fetchUploadedImages();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [fetchProject, fetchJobs, fetchCredits, fetchUploadedImages]);

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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center border-b border-border/30 bg-background/60 backdrop-blur-xl px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border/60" />
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="max-w-[140px] truncate text-sm font-semibold sm:max-w-[260px]">{project?.name || '...'}</span>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-card/50 p-1">
            <button
              onClick={() => setActiveTab('generate')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'generate'
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Wand2 className="h-3 w-3" />
              Generate
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'library'
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid3X3 className="h-3 w-3" />
              Library
              {jobs.filter(j => j.status === 'completed' && getJobUrl(j)).length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                  {jobs.filter(j => j.status === 'completed' && getJobUrl(j)).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="hidden sm:flex gap-1.5 py-1 text-[11px] text-muted-foreground border-border/40"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems go
            </Badge>
            <button
              onClick={() => router.push('/account')}
              className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors px-2.5 py-1.5"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-semibold tabular-nums">{credits}</span>
            </button>
          </div>
        </header>

        {/* Canvas / Library */}
        <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-black/40">
          {activeTab === 'library' ? (
            /* Library view */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-6xl">
                {/* Upload button */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {jobs.filter(j => j.status === 'completed' && getJobUrl(j)).length + uploadedImages.length} items
                  </p>
                  <label
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-card/80",
                      isUploading && "opacity-50 pointer-events-none"
                    )}
                  >
                    <Upload className="h-3 w-3" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {/* Empty state */}
                {jobs.filter(j => j.status === 'completed' && getJobUrl(j)).length === 0 && uploadedImages.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-2xl"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) handleUploadImage(file);
                    }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/20 mb-4">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No images yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Upload images or generate content to get started</p>
                    <label className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      Upload your first image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {/* Uploaded images */}
                    {uploadedImages.map((img) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 shadow-lg hover:border-border hover:shadow-xl transition-all"
                      >
                        <div className="aspect-square overflow-hidden bg-black/20">
                          <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                          <p className="truncate text-[10px] text-white/80 mb-2 leading-tight">{img.name}</p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.open(img.url, '_blank')}
                              className="flex-1 rounded-md bg-white/10 backdrop-blur px-2 py-1 text-[10px] text-white hover:bg-white/20 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = img.url;
                                a.download = img.name;
                                a.click();
                              }}
                              className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(img.url);
                                setCopiedId(img.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                            >
                              {copiedId === img.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="absolute left-2 top-2">
                          <span className="rounded-md bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] text-white/80">Upload</span>
                        </div>
                        <button
                          onClick={() => handleDeleteUploadedImage(img.id)}
                          className="absolute right-2 top-2 rounded-md bg-black/50 backdrop-blur p-1 text-white/60 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}

                    {/* Generated jobs */}
                    {jobs
                      .filter(j => j.status === 'completed' && getJobUrl(j))
                      .map((job) => {
                        const url = getJobUrl(job);
                        const isVideo = url.endsWith('.mp4') || job.job_type === 'video';
                        const isCopied = copiedId === job.id;
                        return (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 shadow-lg hover:border-border hover:shadow-xl transition-all"
                          >
                            <div className="aspect-square overflow-hidden bg-black/20">
                              {isVideo ? (
                                <video
                                  src={url}
                                  className="h-full w-full object-cover"
                                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                  onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                                  loop
                                  muted
                                />
                              ) : (
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                              <p className="truncate text-[10px] text-white/80 mb-2 leading-tight">{job.prompt}</p>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedJob(job)}
                                  className="flex-1 rounded-md bg-white/10 backdrop-blur px-2 py-1 text-[10px] text-white hover:bg-white/20 transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `clipflow_${job.id.slice(0, 8)}.${isVideo ? 'mp4' : 'png'}`;
                                    a.click();
                                  }}
                                  className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(url);
                                    setCopiedId(job.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                                >
                                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                                {!isVideo && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareToLibrary(job);
                                    }}
                                    disabled={sharingId === job.id}
                                    className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                                    title="Share to Inspiration Library"
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="absolute left-2 top-2">
                              <span className="rounded-md bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] text-white/80">
                                {isVideo ? 'Video' : 'Image'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}

                    {/* Upload card */}
                    <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/40 bg-card/10 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 group-hover:bg-primary/10 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">Add image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
          /* Generate view */
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
                        className="relative aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent shadow-lg shadow-primary/5"
                      >
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(16,185,129,0.03)_4px,rgba(16,185,129,0.03)_8px)]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <motion.div
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.08]"
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          >
                            {isVideoModel ? (
                              <FileVideo className="h-5 w-5 text-primary" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-primary" />
                            )}
                          </motion.div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Creating...</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                              {' · ~'}
                              {isVideoModel ? '3-5 min' : '30s'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="absolute left-2.5 top-2.5 text-[10px] font-medium px-2 py-0.5">
                          {isVideoModel ? 'Video' : 'Image'}
                        </Badge>
                        <button
                          onClick={handleCancel}
                          className="absolute right-2.5 top-2.5 rounded-lg bg-background/70 p-1.5 text-muted-foreground backdrop-blur transition-colors hover:text-destructive hover:bg-destructive/10"
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
                            'relative w-full overflow-hidden rounded-2xl border text-left shadow-lg transition-all duration-300',
                            isSelected
                              ? 'border-primary/50 ring-2 ring-primary/20 shadow-primary/10'
                              : 'border-border/50 hover:border-border hover:shadow-xl hover:shadow-black/20',
                            isCompleted ? 'bg-black/40' : 'bg-card/30'
                          )}
                        >
                          {isCompleted ? (
                            <>
                              {isVideo ? (
                                <video src={url} className="aspect-square w-full object-cover" />
                              ) : (
                                <img src={url} alt="" className="aspect-square w-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                          ) : (
                            <div className="relative aspect-square w-full bg-gradient-to-br from-secondary/20 to-secondary/5">
                              {isProcessing && (
                                <div className="absolute inset-0 overflow-hidden">
                                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.02)_8px,rgba(255,255,255,0.02)_16px)]" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
                                </div>
                              )}
                            </div>
                          )}

                          {!isCompleted && (
                            <Badge
                              variant={isProcessing ? 'secondary' : 'destructive'}
                              className="absolute left-2.5 top-2.5 gap-1.5 text-[10px] font-medium px-2 py-0.5"
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  isProcessing ? 'animate-pulse bg-primary' : 'bg-destructive-foreground',
                                )}
                              />
                              {isProcessing ? 'Generating' : 'Failed'}
                            </Badge>
                          )}

                          {isCompleted && (
                            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                              <div className="rounded-lg bg-black/50 backdrop-blur p-1.5">
                                {isVideo ? (
                                  <Play className="h-3 w-3 text-white" />
                                ) : (
                                  <ImageIcon className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          )}

                          <div className="absolute right-2.5 top-2.5">
                            {!isCompleted && (
                              <div
                                onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                                className="rounded-lg bg-background/60 backdrop-blur p-1.5 text-muted-foreground cursor-pointer transition-colors hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6">
                            <p className={cn('truncate text-[11px] leading-tight', isCompleted ? 'text-white/90' : 'text-muted-foreground')}>
                              {job.prompt}
                            </p>
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
          )}

            {/* Preview modal */}
            <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
              <DialogContent className="max-w-3xl border-border/30 bg-background/95 backdrop-blur-xl p-1 shadow-2xl">
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
              <DialogContent className="max-w-sm border-border/20 bg-background/95 backdrop-blur-xl p-6 text-center shadow-2xl">
                <DialogHeader>
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
                    <Coins className="h-7 w-7 text-amber-400" />
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
            <div className="relative z-20 shrink-0 border-t border-border/30 bg-background/60 backdrop-blur-xl p-4 sm:p-5 lg:p-6 pb-8 sm:pb-6 lg:pb-6">
              <div className="mx-auto max-w-4xl">
                <PromptBar
                  isGenerating={isGenerating}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  onGenerate={handleGenerate}
                  onCancel={handleCancel}
                  droppedImage={droppedImage}
                  onDroppedImageClear={() => setDroppedImage(null)}
                  droppedAudio={droppedAudio}
                  onDroppedAudioClear={() => setDroppedAudio(null)}
                />
              </div>
            </div>
      </div>
    </div>
  );
}
