import { streamText } from 'ai';
import { model } from '@/ai/model';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: model,
      messages: messages,
      system: "You are a helpful support assistant for the Viral Hook Generator app. The user is likely experiencing a timeout or error. Apologize for the delay and offer to help them generate hooks manually (by asking for their topic) or answer any other questions. Keep responses concise."
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to start chat.' }), {
      status: 500,
    });
  }
}
