export const SITE_NAME = 'Clipflow';
export const SITE_TITLE = 'Clipflow — AI Video & Image Studio';
export const SITE_DESCRIPTION =
  'Generate videos, images, talking avatars and UGC reels with state-of-the-art AI models. Text to video, image to video, lip-sync avatars, and full creator workflows.';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://clipflow-suvv.onrender.com';

export const TWITTER_HANDLE = '@clipflow';
