"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/studio/top-bar";
import { MainCanvas } from "@/components/studio/main-canvas";
import { ModeSelector, StudioMode } from "@/components/studio/mode-selector";
import { PromptBar } from "@/components/studio/prompt-bar";
import { HistorySidebar } from "@/components/studio/history-sidebar";

// ── Modal API (replaces all Genkit flows) ─────────────────────────────────────
import {
  generateCharacterImage,
  generateSceneVideo,
  generateTalkingActorVideo,
} from "@/lib/modal-api";
import { generateAudioClientSide } from "@/lib/modal-api-client";

export default function StudioPage() {
  const [mode, setMode] = useState<StudioMode>("talking-actor");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [state, setState] = useState<"idle" | "generating" | "complete" | "failed">("idle");
  const [output, setOutput] = useState<{ type: "video" | "image"; url: string } | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Simulated progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 4) + 1, 90));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  const handleGenerate = async (
    prompt: string,
    image?: string,
    modelId?: string
  ) => {
    setIsGenerating(true);
    setProgress(5);
    setState("generating");
    setError(undefined);
    setStatusText("Spinning up GPU cluster...");

    try {
      setTimeout(() => setStatusText("Loading model weights..."), 2500);
      setTimeout(() => setStatusText("Generating — this may take a minute..."), 7000);

      // ── talking-actor: image + script → lipsync video ──────────────────────
      if (mode === "talking-actor") {
        if (!image) throw new Error("An actor image is required for Lip Sync mode.");
        const result = await generateTalkingActorVideo({
          actorImageDataUri: image,
          script: prompt,
          modelId,                        // e.g. "musetalk" or "ltx-2.3"
        });
        setOutput({ type: "video", url: result.videoDataUri });
      }

      // ── scene-video / pixar / ugc: text → video ────────────────────────────
      else if (mode === "scene-video" || mode === "pixar" || mode === "ugc") {
        const enriched =
          mode === "pixar"
            ? `Pixar 3D animation style, vibrant colors, expressive Indian characters. ${prompt}`
            : mode === "ugc"
            ? `UGC commercial style, authentic handheld look, relatable. ${prompt}`
            : prompt;

        const result = await generateSceneVideo({
          description: enriched,
          modelId,                        // e.g. "wan-2.1" or "wan-2.2"
        });
        setOutput({ type: "video", url: result.videoUrl });
      }

      // ── character-image / product: text → image ────────────────────────────
      else if (mode === "character-image" || mode === "product") {
        const enriched =
          mode === "product"
            ? `Professional product studio photography, clean background, sharp details. ${prompt}`
            : prompt;

        const result = await generateCharacterImage({
          description: enriched,
          modelId,                        // e.g. "flux-dev" or "sdxl"
        });
        setOutput({ type: "image", url: result.imageUrl });
      }

      // ── audio-only: text → speech (client-side TTS) ────────────────────────
      else if (mode === "audio-only") {
        setStatusText("Generating speech...");
        await generateAudioClientSide(prompt);
        // Web Speech API speaks directly; no blob URL to display.
        // Show a "complete" state with a placeholder.
        setOutput({ type: "video", url: "" });
      }

      setProgress(100);
      setState("complete");
    } catch (err: any) {
      console.error("[generate]", err);
      setError(err.message ?? "Generation failed. Check the console for details.");
      setState("failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setState("idle");
    setProgress(0);
    setOutput(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground relative">
      <TopBar isGenerating={isGenerating} />

      <main className="flex-1 flex relative">
        <div className="flex-1 flex flex-col">
          <MainCanvas
            state={state}
            output={output}
            error={error}
            progress={progress}
            statusText={statusText}
            onRetry={() => { setState("idle"); setOutput(null); }}
          />

          <div className="z-10 bg-gradient-to-t from-background via-background to-transparent pt-12">
            <ModeSelector
              activeMode={mode}
              onChange={(m) => { setMode(m); setState("idle"); setOutput(null); }}
            />
            <PromptBar
              mode={mode}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              onCancel={handleCancel}
            />
          </div>
        </div>

        <HistorySidebar />
      </main>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-accent/5 blur-[120px] pointer-events-none -z-10" />
    </div>
  );
}