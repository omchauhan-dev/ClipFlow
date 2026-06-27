"use client";

import { useState, useEffect } from "react";
import {
  Wand2, X, Loader2, SlidersHorizontal, Sparkles, Plus, Dices, ChevronDown, ScanSearch,
  Upload, Link as LinkIcon, Mic, Music, ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getModel, VOICES, type GenModel } from "./models";

interface PromptBarProps {
  isGenerating: boolean;
  selectedModel: string;
  onGenerate: (prompt: string, image: string | undefined, model: GenModel, options: { duration?: number; width?: number; height?: number; num_inference_steps?: number; seed?: number; audio?: string; voice_id?: string }) => void;
  onCancel: () => void;
  droppedImage?: string | null;
  onDroppedImageClear?: () => void;
  droppedAudio?: string | null;
  onDroppedAudioClear?: () => void;
}

const DURATION_OPTIONS = [3, 5, 8, 10];

const QUALITY_OPTIONS = [
  { id: 'draft', name: 'Draft', steps: 6 },
  { id: 'standard', name: 'Standard', steps: 12 },
  { id: 'high', name: 'High', steps: 20 },
  { id: 'ultra', name: 'Ultra', steps: 30 },
];

const ASPECT_RATIOS = [
  { id: '9:16', name: '9:16', w: 448, h: 768 },
  { id: '16:9', name: '16:9', w: 768, h: 448 },
  { id: '1:1', name: '1:1', w: 512, h: 512 },
  { id: '4:3', name: '4:3', w: 640, h: 480 },
  { id: '16:9 HD', name: 'HD', w: 1024, h: 576 },
];

const SUGGESTIONS: Record<string, string[]> = {
  image: [
    "Product on a marble surface, studio lighting",
    "Person holding a product, natural portrait",
    "Flat lay with product and accessories",
  ],
  video: [
    "Woman showing a product to camera, UGC style",
    "Cinematic product shot rotating on marble",
    "Before and after transformation, split screen",
  ],
  lipsync: [
    "Hey everyone, welcome back to my channel!",
    "This is the product that changed my routine.",
  ],
  avatar: [
    "Hi! Let me show you why this works so well.",
    "Three reasons you'll love this product…",
  ],
};

export function PromptBar({
  isGenerating, selectedModel, onGenerate, onCancel, droppedImage, onDroppedImageClear,
  droppedAudio, onDroppedAudioClear,
}: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [seed, setSeed] = useState(-1);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inspoVideo, setInspoVideo] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState(VOICES[0].id);

  const model = getModel(selectedModel);
  const isVideo = model.kind === 'video' || model.kind === 'lipsync' || model.kind === 'avatar';
  const isAudioModel = model.kind === 'voiceover' || model.kind === 'avatar';
  const suggestions = SUGGESTIONS[model.kind] || SUGGESTIONS.image;

  useEffect(() => {
    if (droppedImage) {
      setUploadedImage(droppedImage);
      setUploadedImages(prev => [...prev, droppedImage]);
      onDroppedImageClear?.();
    }
  }, [droppedImage, onDroppedImageClear]);

  useEffect(() => {
    if (droppedAudio) {
      setUploadedAudio(droppedAudio);
      onDroppedAudioClear?.();
    }
  }, [droppedAudio, onDroppedAudioClear]);

  const handleSubmit = () => {
    if (!prompt.trim() && !uploadedImage) return;
    if (model.needsImage && !uploadedImage) {
      // surface requirement instead of silently doing nothing
      alert(`${model.name} needs an image. Click + to add one.`);
      return;
    }
    const ar = ASPECT_RATIOS.find(r => r.id === aspectRatio)!;
    const steps = QUALITY_OPTIONS.find(q => q.id === quality)!.steps;
    for (let i = 0; i < batchCount; i++) {
      onGenerate(prompt, uploadedImage || undefined, model, {
        duration,
        width: ar.w,
        height: ar.h,
        num_inference_steps: steps,
        seed: seed === -1 ? Math.floor(Math.random() * 10000) : seed + i,
        audio: uploadedAudio || undefined,
        voice_id: voiceId,
      });
    }
    setPrompt("");
    setUploadedImage(null);
    setUploadedAudio(null);
    setBatchCount(1);
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: isVideo ? 'video' : 'image' }),
      });
      const { enhanced } = await res.json();
      if (enhanced) setPrompt(enhanced);
    } catch { /* ignore */ }
    setIsEnhancing(false);
  };

  const handleAnalyze = async () => {
    const img = uploadedImage || uploadedImages[0];
    if (!img || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img, type: isVideo ? 'video' : 'image' }),
      });
      const { prompt: generated } = await res.json();
      if (generated) setPrompt(generated);
    } catch { /* ignore */ }
    setIsAnalyzing(false);
  };

  // Extract a few evenly-spaced frames from a video, entirely in the browser.
  const extractFrames = (src: string, count = 4): Promise<string[]> =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      video.src = src;
      const frames: string[] = [];
      video.onloadedmetadata = async () => {
        const dur = video.duration && isFinite(video.duration) ? video.duration : 0;
        const canvas = document.createElement('canvas');
        const W = 512;
        const seekTo = (t: number) =>
          new Promise<void>((res) => {
            const onSeeked = () => { video.removeEventListener('seeked', onSeeked); res(); };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = t;
          });
        for (let i = 0; i < count; i++) {
          const t = dur ? (dur * (i + 0.5)) / count : 0;
          try {
            await seekTo(Math.min(t, Math.max(0, dur - 0.05)));
            const ratio = video.videoHeight / (video.videoWidth || 1);
            canvas.width = W;
            canvas.height = Math.round(W * (ratio || 0.5625));
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.7));
            }
          } catch { /* skip frame */ }
          if (!dur) break;
        }
        resolve(frames);
      };
      video.onerror = () => resolve([]);
    });

  const handleAnalyzeVideo = async () => {
    if (!inspoVideo || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const frames = await extractFrames(inspoVideo, 4);
      if (!frames.length) { setIsAnalyzing(false); return; }
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: frames, type: isVideo ? 'video' : 'image', source: 'video' }),
      });
      const { prompt: generated } = await res.json();
      if (generated) setPrompt(generated);
    } catch { /* ignore */ }
    setIsAnalyzing(false);
  };

  const readFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => setInspoVideo(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = () => setUploadedAudio(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = reader.result as string;
        setUploadedImage(img);
        setUploadedImages(prev => [...prev, img]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) readFiles(e.target.files);
    setAddOpen(false);
  };

  const addFromUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const isVideoUrl = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
    const isAudioUrl = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(url);
    if (isVideoUrl) {
      setInspoVideo(url);
    } else if (isAudioUrl) {
      setUploadedAudio(url);
    } else {
      setUploadedImage(url);
      setUploadedImages(prev => [...prev, url]);
    }
    setUrlInput("");
    setAddOpen(false);
  };

  const ar = ASPECT_RATIOS.find(r => r.id === aspectRatio)!;
  const qualityName = QUALITY_OPTIONS.find(q => q.id === quality)!.name;
  const qualitySteps = QUALITY_OPTIONS.find(q => q.id === quality)!.steps;
  const totalCost = model.credits * batchCount;
  const imageRequiredNow = model.needsImage && uploadedImages.length === 0;

  return (
    <div className="w-full">
      {/* Attached images */}
      {uploadedImages.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {uploadedImages.map((img, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => {
                  const updated = uploadedImages.filter((_, idx) => idx !== i);
                  setUploadedImages(updated);
                  setUploadedImage(updated[0] || null);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {/* Inspiration: analyze the first image into a prompt */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex h-16 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            {isAnalyzing ? 'Reading image…' : 'Use as inspiration'}
          </button>
        </div>
      )}

      {/* Inspiration video */}
      {inspoVideo && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-border">
            <video src={inspoVideo} className="h-full w-full object-cover" muted />
            <button
              onClick={() => setInspoVideo(null)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={handleAnalyzeVideo}
            disabled={isAnalyzing}
            className="flex h-16 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            {isAnalyzing ? 'Watching video…' : 'Use video as inspiration'}
          </button>
        </div>
      )}

      {/* Attached audio (for voiceover/avatar) */}
      {uploadedAudio && (
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
            <Music className="h-4 w-4 text-primary" />
            <audio src={uploadedAudio} controls className="h-9 max-w-[200px]" />
          </div>
          <button
            onClick={() => setUploadedAudio(null)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Suggestion chips when empty */}
          {!prompt.trim() && uploadedImages.length === 0 && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full border border-border/40 bg-gradient-to-b from-card/60 to-card/20 backdrop-blur-sm px-3.5 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:border-border/60 hover:shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div
        className="rounded-[1.75rem] border border-border bg-card/70 px-3 py-3 shadow-xl shadow-black/30 backdrop-blur-md transition-colors focus-within:border-primary/40"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) readFiles(e.dataTransfer.files);
          else {
            const url = e.dataTransfer.getData('text/plain');
            if (url && (url.startsWith('http') || url.startsWith('data:'))) {
              setUploadedImage(url);
              setUploadedImages(prev => [...prev, url]);
            }
          }
        }}
      >
        {/* Prompt row */}
        <div className="flex items-start gap-3 px-2 pt-1">
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <button
                title={model.needsImage ? 'Add an image (required)' : 'Add an image, video, or audio'}
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  imageRequiredNow
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Plus className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" sideOffset={10} className="w-72 p-3">
              <p className="mb-2 px-1 text-[13px] font-medium">Add media</p>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-[13px] transition-colors hover:bg-secondary">
                <input type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImageUpload} className="hidden" />
                <Upload className="h-4 w-4 text-muted-foreground" />
                Upload image, video, or audio
              </label>
              <div className="my-2.5 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or paste a link
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2.5">
                  <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFromUrl()}
                    placeholder="https://image-video-or-audio-url"
                    className="h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button size="sm" onClick={addFromUrl} disabled={!urlInput.trim()} className="h-9 shrink-0 px-3">
                  Add
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={model.placeholder}
            className="max-h-[160px] min-h-[44px] flex-1 resize-none border-0 bg-transparent p-0 pt-1.5 text-[15px] leading-relaxed placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
          />

          {prompt.trim() && (
            <button
              onClick={handleEnhance}
              disabled={isEnhancing}
              title="Enhance prompt"
              className="mt-0.5 flex h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles className={cn("h-4 w-4", isEnhancing && "animate-spin")} />
              <span className="hidden sm:inline">{isEnhancing ? 'Enhancing…' : 'Enhance'}</span>
            </button>
          )}
        </div>

        {/* Controls row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Settings popover */}
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-10 items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-4">
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                  <span>{ar.name}</span>
                  <span className="hidden text-border xs:inline">·</span>
                  <span className="hidden xs:inline">{qualityName}</span>
                  {isVideo && (
                    <>
                      <span className="hidden text-border sm:inline">·</span>
                      <span className="hidden sm:inline">{duration}s</span>
                    </>
                  )}
                  {isAudioModel && (
                    <>
                      <span className="hidden text-border xs:inline">·</span>
                      <span className="hidden xs:inline">{VOICES.find(v => v.id === voiceId)?.name}</span>
                    </>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" sideOffset={10} className="w-[min(20rem,calc(100vw-2rem))] p-5">
                <div className="space-y-5">
                  {/* Aspect ratio */}
                  <div>
                    <p className="mb-2.5 text-[13px] font-medium">Aspect ratio</p>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setAspectRatio(r.id)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                            aspectRatio === r.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/40 hover:bg-secondary"
                          )}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="text-[13px] font-medium">Quality</p>
                      <span className="text-xs text-muted-foreground">{qualitySteps} steps</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {QUALITY_OPTIONS.map(q => (
                        <button
                          key={q.id}
                          onClick={() => setQuality(q.id)}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-[12px] transition-colors",
                            quality === q.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/40 hover:bg-secondary"
                          )}
                        >
                          {q.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration (video) */}
                  {isVideo && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[13px] font-medium">Duration</p>
                        <span className="text-xs text-muted-foreground">{duration}s · {duration * 24} frames</span>
                      </div>
                      <Slider
                        min={DURATION_OPTIONS[0]}
                        max={DURATION_OPTIONS[DURATION_OPTIONS.length - 1]}
                        step={1}
                        value={[duration]}
                        onValueChange={(v) => setDuration(v[0])}
                      />
                    </div>
                  )}

                  {/* Seed */}
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">Seed</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        className="h-9 w-28 rounded-lg border border-border bg-secondary/40 px-3 text-[13px] outline-none focus:border-primary/50"
                        placeholder="-1 random"
                      />
                      <button
                        onClick={() => setSeed(-1)}
                        title="Randomize"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                      >
                        <Dices className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Voice selector (voiceover / avatar) */}
                  {isAudioModel && (
                    <div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="text-[13px] font-medium">Voice</p>
                        <span className="text-xs text-muted-foreground">{VOICES.find(v => v.id === voiceId)?.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {VOICES.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setVoiceId(v.id)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors",
                              voiceId === v.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/40 hover:bg-secondary"
                            )}
                          >
                            <span className="font-medium">{v.name}</span>
                            <span className="ml-1 text-muted-foreground">· {v.gender}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Batch counter */}
            <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-secondary/60 px-2 sm:flex">
              <button
                onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                className="flex h-8 w-7 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                −
              </button>
              <span className="min-w-[30px] text-center text-[13px] font-medium tabular-nums">{batchCount}/10</span>
              <button
                onClick={() => setBatchCount(Math.min(10, batchCount + 1))}
                className="flex h-8 w-7 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>

          {/* Generate / Stop */}
          {isGenerating ? (
            <Button
              variant="destructive"
              onClick={onCancel}
              className="h-10 shrink-0 gap-2 rounded-full px-5 text-sm font-semibold shadow-lg shadow-destructive/20 transition-all hover:shadow-xl hover:shadow-destructive/30"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() && !uploadedImage}
              className="h-10 shrink-0 gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-40 disabled:shadow-none enabled:animate-pulse-glow"
            >
              <span className="flex items-center gap-1.5">
                Send
                <ArrowLeft className="h-3.5 w-3.5 -rotate-[135deg]" />
              </span>
              <span className="ml-1 flex items-center gap-1 rounded-md bg-primary-foreground/15 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                <Sparkles className="h-3 w-3" />
                {totalCost}
              </span>
            </Button>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground/60">
        ⌘ + Enter to generate · drop an image or video in for inspiration
      </p>
    </div>
  );
}
