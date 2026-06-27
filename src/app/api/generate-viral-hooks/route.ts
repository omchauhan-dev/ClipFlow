import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/ai/model';

export const maxDuration = 60;

const GenerateViralHooksInputSchema = z.object({
  topic: z.string(),
});

const GenerateViralHooksOutputSchema = z.object({
  hooks: z.array(z.string()).describe('An array of attention-grabbing hooks for the reel.'),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is missing');
      return new Response(JSON.stringify({ error: 'Server misconfigured: Missing API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const context = await req.json();
    const { topic } = GenerateViralHooksInputSchema.parse(context);

    const result = await streamObject({
      model: model,
      schema: GenerateViralHooksOutputSchema,
      prompt: `Topic: ${topic}\n\nGenerate 5 viral hooks. Short, punchy, immediate attention grabbers.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating viral hooks:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate hooks. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
