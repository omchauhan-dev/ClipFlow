import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from "@/components/google-analytics"
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL, TWITTER_HANDLE } from '@/lib/site';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    sameAs: [],
    description: SITE_DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/projects?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is ClipFlow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ClipFlow is an AI-powered creative studio that lets you generate videos, images, talking avatars, and UGC reels from text prompts.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is ClipFlow free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can start using ClipFlow for free with no credit card required. Free credits are available on signup.',
        },
      },
      {
        '@type': 'Question',
        name: 'What AI models does ClipFlow support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ClipFlow integrates LTX 2.3 for video, FLUX.2 and Ideogram 4 for images, LongCat Avatar for talking avatars, and ElevenLabs/OpenAI for voiceover.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use ClipFlow for commercial projects?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all content generated on ClipFlow can be used for commercial purposes including social media, marketing, and client work.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to generate a video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most video generations complete in 1 to 5 minutes depending on the model, resolution, and duration.',
        },
      },
    ],
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  keywords: [
    'ai video generator',
    'text to video',
    'ai image generator',
    'talking avatar',
    'lip sync',
    'ugc ads',
    'ai reels',
    'content creation ai',
  ],
  creator: 'Clipflow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: '5WzUJW9tGojbaUJKenwv7FxaWTvo51gk_2q6hUuT3P8',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
