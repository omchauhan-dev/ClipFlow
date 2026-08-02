import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/studio/',
        '/dashboard',
        '/account',
        '/projects',
        '/library',
        '/reel-scripts',
        '/captions-hashtags',
        '/viral-hooks',
        '/rewrite-tool',
        '/call-to-actions',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
