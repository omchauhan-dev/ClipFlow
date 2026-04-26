'use server';
/**
 * @fileOverview A Genkit flow for generating a talking actor video with lip-sync from an image and script.
 *
 * - generateTalkingActorVideo - A function that handles the talking actor video generation process.
 * - TalkingActorVideoInput - The input type for the generateTalkingActorVideo function.
 * - TalkingActorVideoOutput - The return type for the generateTalkingActorVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import fetch from 'node-fetch';
import {MediaPart} from 'genkit';

const TalkingActorVideoInputSchema = z.object({
  actorImageDataUri: z
    .string()
    .describe(
      "A photo of the actor, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  script: z.string().describe('The script the actor should speak for lip-sync.'),
  model: z.enum(['LTX-2.3', 'LTX-2.2', 'MuseTalk']).describe('The selected lip-sync model (UI-level, maps to underlying Veo model).'),
});
export type TalkingActorVideoInput = z.infer<typeof TalkingActorVideoInputSchema>;

const TalkingActorVideoOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video of the actor speaking the script, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TalkingActorVideoOutput = z.infer<typeof TalkingActorVideoOutputSchema>;

export async function generateTalkingActorVideo(input: TalkingActorVideoInput): Promise<TalkingActorVideoOutput> {
  return generateTalkingActorVideoFlow(input);
}

const generateTalkingActorVideoFlow = ai.defineFlow(
  {
    name: 'generateTalkingActorVideoFlow',
    inputSchema: TalkingActorVideoInputSchema,
    outputSchema: TalkingActorVideoOutputSchema,
  },
  async (input) => {
    const mimeMatch = input.actorImageDataUri.match(/^data:(.*?);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    let {operation} = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: [
        {
          text: `Generate a video of the person in the provided image speaking the following script with realistic lip-sync. Ensure the audio is clear and synchronized with the actor's mouth movements.\n\nScript:\n"${input.script}"`,
        },
        {
          media: {
            contentType: contentType,
            url: input.actorImageDataUri,
          },
        },
      ],
      config: {
        personGeneration: 'allow_all',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart: MediaPart | undefined = operation.output?.message?.content.find((p: any) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Failed to find the generated video media part or its URL.');
    }

    const videoDownloadUrl = `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`;

    const videoDownloadResponse = await fetch(videoDownloadUrl);

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
      throw new Error(`Failed to fetch generated video: ${videoDownloadResponse.statusText}`);
    }

    const videoBuffer = await videoDownloadResponse.buffer();
    const base64Video = videoBuffer.toString('base64');
    const videoContentType = videoPart.media.contentType || 'video/mp4';

    return {
      videoDataUri: `data:${videoContentType};base64,${base64Video}`,
    };
  }
);
