'use server';
/**
 * modal-api.ts
 * Only async functions exported — required by Next.js "use server".
 * MODEL_MAP constant lives in model-map.ts.
 *
 * .env.local:
 *   MODAL_URL=https://<workspace>--ai-media-worker-api.modal.run
 */

import { MODEL_MAP } from '@/lib/model-map';

const BASE = (
  process.env.MODAL_URL ?? process.env.NEXT_PUBLIC_MODAL_URL ?? ''
).replace(/\/$/, '');

// ── Which config.py keys belong to each category ──────────────────────────────
// Prevents e.g. "ltx-2.3" (lipsync) being sent to /generate as an image model
const IMAGE_MODELS   = new Set(['flux', 'sdxl']);
const VIDEO_MODELS   = new Set(['wan21', 'wan22']);
const LIPSYNC_MODELS = new Set(['musetalk', 'ltx23']);

const CATEGORY_DEFAULTS = {
  image:   'flux',
  video:   'wan21',
  lipsync: 'musetalk',
} as const;

const CATEGORY_ALLOWED = {
  image:   IMAGE_MODELS,
  video:   VIDEO_MODELS,
  lipsync: LIPSYNC_MODELS,
} as const;

/**
 * Resolves a prompt-bar modelId to a config.py key that is valid for the
 * given category. Falls back to the category default if the user has a
 * wrong-type model selected (e.g. ltx-2.3 while generating an image).
 */
function resolveModel(
  modelId: string | undefined,
  category: 'image' | 'video' | 'lipsync'
): string {
  const configKey = MODEL_MAP[modelId ?? ''] ?? modelId ?? '';
  return CATEGORY_ALLOWED[category].has(configKey)
    ? configKey
    : CATEGORY_DEFAULTS[category];
}

// ── Internal fetch helpers ────────────────────────────────────────────────────

async function modalFetch(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Modal ${path} → ${res.status}: ${body}`);
  }
  return res;
}

async function responseToDataUri(
  res: Response
): Promise<{ dataUri: string; jobId: string }> {
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const jobId       = res.headers.get('x-job-id') ?? '';
  const buf         = await res.arrayBuffer();
  const base64      = Buffer.from(buf).toString('base64');
  return { dataUri: `data:${contentType};base64,${base64}`, jobId };
}

// ── Exported async functions ──────────────────────────────────────────────────

/** Text → Image  (sdxl or flux) */
export async function generateCharacterImage(input: {
  description: string;
  modelId?: string;
}): Promise<{ imageUrl: string; jobId: string }> {
  const model = resolveModel(input.modelId, 'image');

  const res = await modalFetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: input.description,
      steps:  30,
      height: 1024,
      width:  1024,
    }),
  });

  const { dataUri, jobId } = await responseToDataUri(res);
  return { imageUrl: dataUri, jobId };
}

/** Text → Video  (wan21 / wan22) */
export async function generateSceneVideo(input: {
  description: string;
  modelId?: string;
}): Promise<{ videoUrl: string; jobId: string }> {
  const model = resolveModel(input.modelId, 'video');

  const res = await modalFetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt:     input.description,
      steps:      25,
      height:     480,
      width:      832,
      num_frames: 49,
    }),
  });

  const { dataUri, jobId } = await responseToDataUri(res);
  return { videoUrl: dataUri, jobId };
}

/** Image + Script → Lipsync video  (musetalk / ltx23) */
export async function generateTalkingActorVideo(input: {
  actorImageDataUri: string;
  script: string;
  modelId?: string;
}): Promise<{ videoDataUri: string; jobId: string }> {
  const model = resolveModel(input.modelId, 'lipsync');

  const [meta, b64] = input.actorImageDataUri.split(',');
  const mimeType    = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const imageBlob   = new Blob([Buffer.from(b64, 'base64')], { type: mimeType });
  const audioBlob   = new Blob([input.script], { type: 'text/plain' });

  const form = new FormData();
  form.append('model', model);
  form.append('video', imageBlob, 'actor.jpg');
  form.append('audio', audioBlob, 'script.txt');

  const res = await modalFetch('/lipsync', { method: 'POST', body: form });
  const { dataUri, jobId } = await responseToDataUri(res);
  return { videoDataUri: dataUri, jobId };
}

/** Re-download a previously generated file by jobId */
export async function downloadOutput(
  model: string,
  jobId: string
): Promise<string> {
  const res = await modalFetch(`/output/${model}/${jobId}`, { method: 'GET' });
  const { dataUri } = await responseToDataUri(res);
  return dataUri;
}

/** All stored outputs — for history sidebar */
export async function listAllOutputs(): Promise<{
  job_id:  string;
  model:   string;
  ext:     string;
  size_kb: number;
  url:     string;
}[]> {
  const res  = await modalFetch('/outputs', { method: 'GET' });
  const data = await res.json();
  return data.jobs ?? [];
}

/** Stored outputs for one specific model */
export async function listModelOutputs(model: string): Promise<{
  job_id:  string;
  model:   string;
  ext:     string;
  size_kb: number;
  url:     string;
}[]> {
  const res  = await modalFetch(`/outputs/${model}`, { method: 'GET' });
  const data = await res.json();
  return data.jobs ?? [];
}

/** Health check */
export async function checkHealth(): Promise<{
  status: string;
  models: string[];
}> {
  const res = await modalFetch('/health', { method: 'GET' });
  return res.json();
}