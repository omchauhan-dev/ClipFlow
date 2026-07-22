'use client';

import type { GenModel } from './models';

const HEADLINES: Record<string, string> = {
  image: 'Start creating your image',
  video: 'Start creating your video',
  lipsync: 'Make a talking face',
  avatar: 'Make your avatar speak',
};

export function EmptyCanvas({ model }: { model: GenModel }) {
  const headline = HEADLINES[model.kind] || 'Start creating';

  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-4 sm:min-h-[380px]">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{headline}</h2>
      <p className="mt-2 text-xs text-muted-foreground sm:text-sm max-w-xs text-center leading-relaxed">
        Describe a scene, mood, or style — and watch it come to life.
      </p>
    </div>
  );
}
