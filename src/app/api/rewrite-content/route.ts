import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/ai/model';

export const maxDuration = 60;

const RewriteContentInputSchema = z.object({
  content: z.string(),
  style: z.enum(['aggressive', 'calm', 'emotional', 'storytelling', 'authoritative']),
});

const RewriteContentOutputSchema = z.object({
  rewrittenContent: z.string().describe('The content rewritten in the specified style.'),
});

export async function POST(req: Request) {
  try {
    const context = await req.json();
    const { content, style } = RewriteContentInputSchema.parse(context);

    const result = await streamObject({
      model: model,
      schema: RewriteContentOutputSchema,
      prompt: `Content: ${content}\nStyle: ${style}\n\nRewrite the content in the specified style.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error rewriting content:', error);
    return new Response(JSON.stringify({ error: 'Failed to rewrite content.' }), {
      status: 500,
    });
  }
}
