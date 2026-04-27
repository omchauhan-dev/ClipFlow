// model-map.ts
// No "use server" — just a plain constant safe to import anywhere.
// Maps prompt-bar model IDs → config.py keys.

export const MODEL_MAP: Record<string, string> = {
  'ltx-2.3':  'ltx23',
  'ltx-2.2':  'ltx23',
  'wan-2.2':  'wan21',
  'wan-2.1':  'wan21',
  'flux-dev': 'flux',
  'musetalk': 'musetalk',
  'sdxl':     'sdxl',
};