import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '@/lib/site';

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
          background: 'linear-gradient(135deg, #0a0a0b 0%, #18181b 55%, #3f2d5c 100%)',
          color: '#fafafa',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '28px',
            color: '#a78bfa',
            fontWeight: 700,
            fontSize: 28,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#a78bfa',
              display: 'flex',
            }}
          />
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          AI Video &amp; Image Studio
        </div>
        <div style={{ fontSize: 30, color: '#d4d4d8', marginTop: 28, maxWidth: 860, lineHeight: 1.4 }}>
          {SITE_DESCRIPTION}
        </div>
        <div style={{ fontSize: 22, color: '#71717a', marginTop: 'auto', paddingTop: 40 }}>
          {SITE_URL}
        </div>
      </div>
    ),
    { ...size }
  );
}
