import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import LoginClient from './login-client';

export const metadata: Metadata = {
  title: 'Sign In',
  description: `Sign in to ${SITE_NAME} — access your AI video studio, projects, and creative tools.`,
  openGraph: {
    title: `Sign In · ${SITE_NAME}`,
    description: `Sign in to ${SITE_NAME} — access your AI video studio, projects, and creative tools.`,
    url: `${SITE_URL}/login`,
    type: 'website',
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
