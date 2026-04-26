'use server';
/**
 * @fileOverview A Genkit flow that converts a given script (text) into an audio file (speech).
 *
 * - generateAudioFromScript - A function that handles the text-to-speech generation process.
 * - GenerateAudioFromScriptInput - The input type for the generateAudioFromScript function.
 * - GenerateAudioFromScriptOutput - The return type for the generateAudioFromScript function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { Buffer } from 'buffer';

const GenerateAudioFromScriptInputSchema = z.object({
  script: z.string().describe('The script text to convert to audio.'),
});
export type GenerateAudioFromScriptInput = z.infer<typeof GenerateAudioFromScriptInputSchema>;

const GenerateAudioFromScriptOutputSchema = z.object({
  media: z.string().describe('The generated audio as a data URI (data:audio/wav;base64,<encoded_data>).'),
});
export type GenerateAudioFromScriptOutput = z.infer<typeof GenerateAudioFromScriptOutputSchema>;

export async function generateAudioFromScript(input: GenerateAudioFromScriptInput): Promise<GenerateAudioFromScriptOutput> {
  return generateAudioFromScriptFlow(input);
}

const generateAudioFromScriptFlow = ai.defineFlow(
  {
    name: 'generateAudioFromScriptFlow',
    inputSchema: GenerateAudioFromScriptInputSchema,
    outputSchema: GenerateAudioFromScriptOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Using a default voice
          },
        },
      },
      prompt: input.script,
    });

    if (!media) {
      throw new Error('No audio media returned from the TTS model.');
    }

    // The model returns PCM audio, which needs to be converted to WAV for broader compatibility.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

/**
 * Converts PCM audio data to WAV format and returns it as a base64 string.
 * @param pcmData The PCM audio data buffer.
 * @param channels Number of audio channels (default: 1).
 * @param rate Sample rate in Hz (default: 24000).
 * @param sampleWidth Sample width in bytes (default: 2).
 * @returns A Promise that resolves to the base64 encoded WAV audio string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
