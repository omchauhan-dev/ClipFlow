
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, voice_id } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    }

    const voiceId = voice_id || 'EXAVITQu4vr4xnSDxMaL';

    // Prefer ElevenLabs when API key is configured
    if (process.env.ELEVENLABS_API_KEY) {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Response(arrayBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' },
        });
      }

      console.warn('ElevenLabs TTS failed, status:', response.status);
      return new Response(JSON.stringify({ error: 'Voiceover generation failed.' }), { status: 502 });
    }

    // Fallback: OpenRouter OpenAI TTS
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'No TTS API key configured.' }), { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/tts-1',
        input: text,
        voice: 'alloy',
      }),
    });

    if (!response.ok) {
      console.warn('OpenRouter TTS failed, status:', response.status);
      return new Response(JSON.stringify({ error: 'Voiceover generation not supported by current provider.' }), { status: 501 });
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error('Error generating voiceover:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate voiceover.' }), {
      status: 500,
    });
  }
}
