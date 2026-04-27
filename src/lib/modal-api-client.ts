'use client';
/**
 * modal-api-client.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side helpers that cannot run in server actions.
 * Currently: audio TTS via browser Web Speech API.
 * Import this only in client components ("use client").
 */

export function generateAudioClientSide(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      reject(new Error('Web Speech API not supported in this browser.'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      // Web Speech API cannot export audio as data URI natively.
      // We resolve with a placeholder so the UI can show a "spoken" state.
      resolve('data:audio/wav;base64,SPOKEN');
    };
    utterance.onerror = (e) => reject(new Error(`Speech error: ${e.error}`));

    window.speechSynthesis.speak(utterance);
  });
}