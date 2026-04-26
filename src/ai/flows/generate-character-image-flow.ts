'use server';
/**
 * @fileOverview A Genkit flow for generating a character image from a text description.
 *
 * - generateCharacterImage - A function that handles the character image generation process.
 * - GenerateCharacterImageInput - The input type for the generateCharacterImage function.
 * - GenerateCharacterImageOutput - The return type for the generateCharacterImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('A text description of the character to be generated.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;

export async function generateCharacterImage(
  input: GenerateCharacterImageInput
): Promise<GenerateCharacterImageOutput> {
  return generateCharacterImageFlow(input);
}

const generateCharacterImagePrompt = ai.definePrompt({
  name: 'generateCharacterImagePrompt',
  input: { schema: GenerateCharacterImageInputSchema },
  output: { schema: GenerateCharacterImageOutputSchema },
  prompt: `Generate an image of a character based on the following description:

Description: {{{description}}}

Make sure the image is visually appealing and clearly represents the character described.`,
});

const generateCharacterImageFlow = ai.defineFlow(
  {
    name: 'generateCharacterImageFlow',
    inputSchema: GenerateCharacterImageInputSchema,
    outputSchema: GenerateCharacterImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: generateCharacterImagePrompt(input),
    });

    if (!media) {
      throw new Error('No image media was generated.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
