/**
 * Single source of truth for every generation model.
 * The selected model — not a separate "mode" — determines what gets generated,
 * which endpoint runs, whether an input image is required, and the credit cost.
 */

export type ModelKind = 'image' | 'video' | 'lipsync' | 'avatar' | 'voiceover';

export interface GenModel {
  id: string;
  name: string;
  kind: ModelKind;
  credits: number;
  needsImage: boolean;
  group: string;
  desc: string;
  placeholder: string;
}

export const MODELS: GenModel[] = [
  {
    id: 'ideogram4',
    name: 'Ideogram 4',
    kind: 'image',
    credits: 1,
    needsImage: false,
    group: 'Image',
    desc: 'High-quality text-to-image with Ideogram',
    placeholder: 'Describe the image you want to create…',
  },
  {
    id: 'flux2',
    name: 'FLUX.2',
    kind: 'image',
    credits: 1,
    needsImage: false,
    group: 'Image',
    desc: 'Photorealistic image generation',
    placeholder: 'Describe the image you want to create…',
  },
  {
    id: 'krea2',
    name: 'Krea 2',
    kind: 'image',
    credits: 1,
    needsImage: false,
    group: 'Image',
    desc: 'Aesthetic-first image generation with Krea 2',
    placeholder: 'Describe the image you want to create…',
  },
];

export interface VoiceOption {
  id: string;
  name: string;
  accent: string;
  gender: string;
}

export const VOICES: VoiceOption[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', accent: 'American', gender: 'Female' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', accent: 'American', gender: 'Female' },
  { id: 'AZnzlk1XvdvUepBnz5cy', name: 'Adam', accent: 'American', gender: 'Male' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', accent: 'American', gender: 'Female' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', accent: 'American', gender: 'Male' },
  { id: 'VR6AewLTigWG4xSOuka', name: 'Alice', accent: 'British', gender: 'Female' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', accent: 'British', gender: 'Male' },
  { id: 'ODq5zmih8GrVes37Dizd', name: 'Patrick', accent: 'American', gender: 'Male' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', accent: 'American', gender: 'Female' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Daniel', accent: 'British', gender: 'Male' },
  { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emily', accent: 'American', gender: 'Female' },
];

export function getModel(id: string): GenModel {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

/** Which API route a model's generation should hit. */
export function endpointFor(kind: ModelKind): string {
  switch (kind) {
    case 'image':
      return '/api/generate-image';
    case 'avatar':
      return '/api/generate-ugc-video';
    case 'voiceover':
      return '/api/generate-voiceover';
    case 'video':
    case 'lipsync':
    default:
      return '/api/generate-video';
  }
}
