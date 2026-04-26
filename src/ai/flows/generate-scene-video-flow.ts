'use server';
/**
 * @fileOverview A Genkit flow for generating a video from a text description using the Veo model.
 *
 * - generateSceneVideo - A function that handles the video generation process.
 * - GenerateSceneVideoInput - The input type for the generateSceneVideo function.
 * - GenerateSceneVideoOutput - The return type for the generateSceneVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import fetch from 'node-fetch';

const GenerateSceneVideoInputSchema = z.object({
  description: z.string().describe('The textual description for the video scene.'),
});
export type GenerateSceneVideoInput = z.infer<typeof GenerateSceneVideoInputSchema>;

const GenerateSceneVideoOutputSchema = z.object({
  videoUrl: z.string().describe(
    "A data URI of the generated video, that includes a MIME type and uses Base64 encoding. Expected format: 'data:video/mp4;base64,<encoded_data>'."
  ),
});
export type GenerateSceneVideoOutput = z.infer<typeof GenerateSceneVideoOutputSchema>;

export async function generateSceneVideo(
  input: GenerateSceneVideoInput
): Promise<GenerateSceneVideoOutput> {
  return generateSceneVideoFlow(input);
}

const generateSceneVideoFlow = ai.defineFlow(
  {
    name: 'generateSceneVideoFlow',
    inputSchema: GenerateSceneVideoInputSchema,
    outputSchema: GenerateSceneVideoOutputSchema,
  },
  async (input) => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: input.description,
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for a few seconds before checking again to avoid hammering the API
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart?.media?.url) {
      throw new Error('Failed to find the generated video media URL.');
    }

    // Add API key before fetching the video.
    const videoDownloadUrl = `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`;
    
    let videoData: Buffer;
    try {
      const videoDownloadResponse = await fetch(videoDownloadUrl);

      if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(
          `Failed to fetch video from ${videoDownloadUrl}: ${videoDownloadResponse.statusText}`
        );
      }

      // Read the entire body into a buffer
      const arrayBuffer = await videoDownloadResponse.arrayBuffer();
      videoData = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching video:', error);
      throw new Error('Failed to download generated video.');
    }

    // Determine content type. Veo model typically returns video/mp4.
    const contentType = videoPart.media.contentType || 'video/mp4';
    const base64Video = videoData.toString('base64');
    const videoUrl = `data:${contentType};base64,${base64Video}`;

    return {videoUrl};
  }
);
