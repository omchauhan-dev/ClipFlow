'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Sparkles, Terminal, Image as ImageIcon, Video as VideoIcon, Mic, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { experimental_useObject as useObject } from '@ai-sdk/react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Value } from '@radix-ui/react-select';

const formSchema = z.object({
  subjectMatter: z.string().min(10, 'Please provide more details on the subject.'),
  reelLength: z.enum(['15s', '30s', '60s']),
  language: z.enum(['Hinglish', 'Hindi', 'English']),
});

const OutputSchema = z.object({
  scenes: z.array(z.object({
    visual: z.string(),
    voiceover: z.string(),
  })),
});

export default function ReelScriptPage() {
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedImageModel, setSelectedImageModel] = useState<string>('sdxl-turbo');

  // Navigation State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Image states
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});

  // Video states
  const [generatingVideos, setGeneratingVideos] = useState<Record<number, boolean>>({});
  const [generatedVideos, setGeneratedVideos] = useState<Record<number, string>>({});

  // Voiceover states
  const [generatingVoiceovers, setGeneratingVoiceovers] = useState<Record<number, boolean>>({});
  const [generatedVoiceovers, setGeneratedVoiceovers] = useState<Record<number, string>>({});

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/generate-reel-scripts',
    schema: OutputSchema,
    onError: (error) => {
      setGenerationError(error.message || 'An error occurred during generation.');
    },
    onFinish: async ({ object }) => {
        setCurrentSceneIndex(0);

        // ✅ AUTO-GENERATE (One by One)
        if (object?.scenes) {
            for (let i = 0; i < object.scenes.length; i++) {
                const scene = object.scenes[i];
                if (scene.visual) {
                    // Wait 500ms between requests to be safe
                    await new Promise(r => setTimeout(r, 500)); 
                    generateImage(i, scene.visual);
                }
            }
        }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectMatter: '',
      reelLength: '30s',
      language: 'English',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerationError(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setGeneratedVoiceovers({});
    setCurrentSceneIndex(0);
    submit(values);
  }

  async function generateImage(index: number, visualDescription: string) {
    if (generatingImages[index]) return;

    setGeneratingImages(prev => ({ ...prev, [index]: true }));

    try {
      // 1. Submit the Job
      const res = await fetch('/api/generate-scene-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: visualDescription }),
      });
      
      const { jobId } = await res.json();
      
      if (!jobId) {
        console.error("No Job ID returned");
        setGeneratingImages(prev => ({ ...prev, [index]: false }));
        return;
      }

      // 2. Poll (Check status every 3 seconds)
      const intervalId = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/check-job-status?id=${jobId}`);
          const job = await statusRes.json();

          if (job.status === 'done' && job.image_url) {
            // ✅ Success!
            clearInterval(intervalId);
            setGeneratedImages(prev => ({ ...prev, [index]: job.image_url }));
            setGeneratingImages(prev => ({ ...prev, [index]: false }));
          } 
          else if (job.status === 'failed') {
            // ❌ Failed
            clearInterval(intervalId);
            setGeneratingImages(prev => ({ ...prev, [index]: false }));
            console.error("GPU failed to generate image");
          }
          // If 'pending' or 'processing', we do nothing and wait for next loop
        } catch (err) {
          console.error("Polling error", err);
          clearInterval(intervalId);
          setGeneratingImages(prev => ({ ...prev, [index]: false }));
        }
      }, 3000); // Check every 3 seconds

    } catch (e) {
      console.error(e);
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  }
  async function generateVideo(index: number, visualDescription: string, existingImageUrl?: string) {
    if (generatingVideos[index]) return;

    setGeneratingVideos(prev => ({ ...prev, [index]: true }));
    try {
      // Pass the generated image URL if available for Image-to-Video
      const imageUrl = existingImageUrl || generatedImages[index];

      const res = await fetch('/api/generate-scene-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: visualDescription, imageUrl }),
      });
      const data = await res.json();
      if (data.url) {
        setGeneratedVideos(prev => ({ ...prev, [index]: data.url }));
      } else {
        console.error('Failed to generate video');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingVideos(prev => ({ ...prev, [index]: false }));
    }
  }

  async function handleGenerateVideoFlow(index: number, visualDescription: string) {
      // Direct video generation using Lightricks model (Text-to-Video)
      // This bypasses the image generation step entirely, satisfying "not generating any image" request
      await generateVideo(index, visualDescription);
  }

  async function generateVoiceover(index: number, text: string) {
    if (generatingVoiceovers[index]) return;

    setGeneratingVoiceovers(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/generate-voiceover', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Failed to generate voiceover');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedVoiceovers(prev => ({ ...prev, [index]: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingVoiceovers(prev => ({ ...prev, [index]: false }));
    }
  }

  const scenes = object?.scenes || [];
  const currentScene = scenes[currentSceneIndex];
  const totalScenes = scenes.length;

  const nextScene = () => {
    if (currentSceneIndex < totalScenes - 1) {
        setCurrentSceneIndex(prev => prev + 1);
    }
  };

  const prevScene = () => {
    if (currentSceneIndex > 0) {
        setCurrentSceneIndex(prev => prev - 1);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reel Script Generator"
        description="Create a complete script with storytelling structure for your next reel."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="subjectMatter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Matter</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the topic or idea for your reel..." {...field} rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="reelLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reel Length</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reel length" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15s">15 seconds</SelectItem>
                      <SelectItem value="30s">30 seconds</SelectItem>
                      <SelectItem value="60s">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hinglish">Hinglish</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Script
              </>
            )}
          </Button>
        </form>
      </Form>

      {(aiError || generationError) && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generationError || 'An error occurred while generating script.'}</AlertDescription>
        </Alert>
      )}

      {scenes.length > 0 && currentScene && (
        <div className="mt-8">
            <Card className="overflow-hidden min-h-[450px] shadow-md border-2">
                <CardContent className="p-0 flex flex-col md:flex-row h-full">
                    {/* Visual Section (Left) */}
                    <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="bg-background text-sm font-medium">
                                Scene {currentSceneIndex + 1} / {totalScenes}
                            </Badge>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1">
                                    <Select
                                        defaultValue="flux"
                                        onValueChange={(val) => {
                                            // Store selected model in a ref or state if needed,
                                            // for now we'll just pass it to generateImage if we refactor,
                                            // but to keep it simple let's assume this updates a state 'selectedImageModel'
                                            setSelectedImageModel(val);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[110px] text-xs">
                                            <SelectValue placeholder="Model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sdxl-turbo">SDXL Turbo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {!generatedImages[currentSceneIndex] && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs bg-background"
                                        onClick={() => currentScene.visual && generateImage(currentSceneIndex, currentScene.visual)}
                                        disabled={generatingImages[currentSceneIndex] || !currentScene.visual}
                                    >
                                        {generatingImages[currentSceneIndex] ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                                        Create Image
                                    </Button>
                                )}
                                {!generatedVideos[currentSceneIndex] && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs bg-background"
                                        onClick={() => handleGenerateVideoFlow(currentSceneIndex, currentScene.visual)}
                                        disabled={generatingVideos[currentSceneIndex] || generatingImages[currentSceneIndex] || !currentScene.visual}
                                    >
                                        {(generatingVideos[currentSceneIndex] || generatingImages[currentSceneIndex]) ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <VideoIcon className="h-3 w-3 mr-1" />}
                                        Create Video
                                    </Button>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 italic">{currentScene.visual}</p>

                        <div className="flex-1 flex items-center justify-center min-h-[250px] bg-background/50 rounded-lg border border-dashed">
                            {generatedVideos[currentSceneIndex] ? (
                                <video
                                    src={generatedVideos[currentSceneIndex]}
                                    controls
                                    className="w-full h-auto rounded-md max-h-[350px]"
                                />
                            ) : generatingVideos[currentSceneIndex] ? (
                                    <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Generating Video...</span>
                                    </div>
                            ) : generatedImages[currentSceneIndex] ? (
                                <img
                                    src={generatedImages[currentSceneIndex]}
                                    alt={`Scene ${currentSceneIndex + 1}`}
                                    className="w-full h-auto rounded-md max-h-[350px] object-cover shadow-sm"
                                />
                            ) : generatingImages[currentSceneIndex] ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Generating Image...</span>
                                </div>
                            ) : (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <span>Visual content area</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voiceover Section (Right) */}
                    <div className="flex-1 p-6 flex flex-col bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="secondary" className="text-sm">Voiceover Script</Badge>
                        </div>

                        <div className="flex-1 p-4 bg-muted/10 rounded-md border mb-4">
                            <p className="text-lg font-medium leading-relaxed">{currentScene.voiceover}</p>
                        </div>

                        <div className="space-y-4 mt-auto">
                            {!generatedVoiceovers[currentSceneIndex] ? (
                                <Button
                                    className="w-full"
                                    onClick={() => currentScene.voiceover && generateVoiceover(currentSceneIndex, currentScene.voiceover)}
                                    disabled={generatingVoiceovers[currentSceneIndex] || !currentScene.voiceover}
                                >
                                    {generatingVoiceovers[currentSceneIndex] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                                    Generate Voiceover
                                </Button>
                            ) : (
                                <div className="p-3 bg-secondary/20 rounded-md border flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Audio Generated</span>
                                    <audio controls src={generatedVoiceovers[currentSceneIndex]} className="w-full h-10" />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-6 mt-6">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={prevScene}
                    disabled={currentSceneIndex === 0}
                    className="w-32"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>

                <span className="text-sm font-medium text-muted-foreground">
                    Scene {currentSceneIndex + 1} of {totalScenes}
                </span>

                <Button
                    variant="outline"
                    size="lg"
                    onClick={nextScene}
                    disabled={currentSceneIndex === totalScenes - 1}
                    className="w-32"
                >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
      )}

      {isLoading && scenes.length === 0 && (
           <div className="mt-8 space-y-6">
                <Skeleton className="h-[450px] w-full rounded-lg" />
           </div>
      )}
    </div>
  );
}
