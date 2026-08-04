import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `ClipFlow pricing — generate AI videos, images, talking avatars, and UGC reels. Start free, no credit card required. Choose a plan that scales with your content creation needs.`,
  openGraph: {
    title: `Pricing · ${SITE_NAME}`,
    description: `ClipFlow pricing — generate AI videos, images, talking avatars, and UGC reels. Start free, no credit card required.`,
    url: `${SITE_URL}/pricing`,
    type: 'website',
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
