import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/ai/model';

export const maxDuration = 60;

const GenerateCallToActionsInputSchema = z.object({
  reelContent: z.string(),
});

const GenerateCallToActionsOutputSchema = z.object({
  callToActions: z.array(z.string()).describe('An array of compelling calls to action.'),
});

export async function POST(req: Request) {
  try {
    const context = await req.json();
    const { reelContent } = GenerateCallToActionsInputSchema.parse(context);

    const result = await streamObject({
      model: model,
      schema: GenerateCallToActionsOutputSchema,
      prompt: `Reel Content: ${reelContent}\n\nGenerate 5 compelling calls to action to encourage viewers to interact.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating CTAs:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate CTAs.' }), {
      status: 500,
    });
  }
}
