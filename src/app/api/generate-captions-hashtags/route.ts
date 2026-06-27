import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/ai/model';

export const maxDuration = 60;

const GenerateCaptionsHashtagsInputSchema = z.object({
  themeOrMessage: z.string(),
});

const GenerateCaptionsHashtagsOutputSchema = z.object({
  captions: z.array(z.string()).describe('Emotion-based captions.'),
  hashtags: z.array(z.string()).describe('Trending hashtags.'),
});

export async function POST(req: Request) {
  try {
    const context = await req.json();
    const { themeOrMessage } = GenerateCaptionsHashtagsInputSchema.parse(context);

    const result = await streamObject({
      model: model,
      schema: GenerateCaptionsHashtagsOutputSchema,
      prompt: `Theme/Message: ${themeOrMessage}\n\nGenerate 3 emotion-based captions and 5 trending hashtags.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating captions/hashtags:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate.' }), {
      status: 500,
    });
  }
}
