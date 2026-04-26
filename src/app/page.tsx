"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/studio/top-bar";
import { MainCanvas } from "@/components/studio/main-canvas";
import { ModeSelector, StudioMode } from "@/components/studio/mode-selector";
import { PromptBar } from "@/components/studio/prompt-bar";
import { HistorySidebar } from "@/components/studio/history-sidebar";
import { generateCharacterImage } from "@/ai/flows/generate-character-image-flow";
import { generateSceneVideo } from "@/ai/flows/generate-scene-video-flow";
import { generateTalkingActorVideo } from "@/ai/flows/generate-talking-actor-video-flow";
import { generateAudioFromScript } from "@/ai/flows/generate-audio-from-script-flow";

export default function StudioPage() {
  const [mode, setMode] = useState<StudioMode>("talking-actor");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [state, setState] = useState<"idle" | "generating" | "complete" | "failed">("idle");
  const [output, setOutput] = useState<{ type: "video" | "image"; url: string } | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Fake progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 5);
          return next > 90 ? 90 : next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  const handleGenerate = async (prompt: string, image?: string) => {
    setIsGenerating(true);
    setProgress(5);
    setState("generating");
    setError(undefined);
    setStatusText("Spinning up L40S Cluster...");

    try {
      let result;
      
      // Update status messages periodically
      setTimeout(() => setStatusText("Analyzing prompt and preparing assets..."), 2000);
      setTimeout(() => setStatusText("Neural processing in progress..."), 6000);

      if (mode === "talking-actor") {
        if (!image) throw new Error("An actor image is required for Lip Sync mode.");
        result = await generateTalkingActorVideo({
          actorImageDataUri: image,
          script: prompt,
          model: "LTX-2.3",
        });
        setOutput({ type: "video", url: result.videoDataUri });
      } else if (mode === "scene-video" || mode === "pixar" || mode === "ugc") {
        const enrichedPrompt = mode === "pixar" ? `Pixar animation style, ${prompt}` : 
                              mode === "ugc" ? `UGC commercial style, realistic, ${prompt}` : prompt;
        result = await generateSceneVideo({ description: enrichedPrompt });
        setOutput({ type: "video", url: result.videoUrl });
      } else if (mode === "character-image" || mode === "product") {
        const enrichedPrompt = mode === "product" ? `Professional product studio photography, ${prompt}` : prompt;
        result = await generateCharacterImage({ description: enrichedPrompt });
        setOutput({ type: "image", url: result.imageUrl });
      } else if (mode === "audio-only") {
        result = await generateAudioFromScript({ script: prompt });
        // We'll treat audio as a "video" output with a simple visualization for this demo if needed, 
        // but let's just use the media URL directly.
        setOutput({ type: "video", url: result.media });
      }

      setProgress(100);
      setState("complete");
    } catch (err: any) {
      setError(err.message || "Failed to generate content.");
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
            onRetry={() => setState("idle")}
          />
          
          <div className="z-10 bg-gradient-to-t from-background via-background to-transparent pt-12">
            <ModeSelector activeMode={mode} onChange={(m) => { setMode(m); setState("idle"); }} />
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

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-accent/5 blur-[120px] pointer-events-none -z-10" />
    </div>
  );
}
