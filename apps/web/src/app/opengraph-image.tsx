import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const runtime = 'edge';
export const alt = `VibeMiner — ${site.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0f14 0%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ogvm" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <rect x="4" y="22" width="5" height="5" rx="1" stroke="url(#ogvm)" strokeWidth="1.2" fill="none" opacity={0.9} />
            <rect x="11" y="22" width="5" height="5" rx="1" stroke="url(#ogvm)" strokeWidth="1.2" fill="none" opacity={0.7} />
            <rect x="18" y="22" width="5" height="5" rx="1" stroke="url(#ogvm)" strokeWidth="1.2" fill="none" opacity={0.5} />
            <path d="M9 24.5h2M16 24.5h2" stroke="url(#ogvm)" strokeWidth="1" strokeLinecap="round" />
            <circle cx="22" cy="11" r="7" fill="#0c0e12" stroke="url(#ogvm)" strokeWidth="1.5" />
            <path
              d="M22 6.5v9M19.5 7.5h3.25a1.75 1.75 0 0 1 0 3.5H19.5M19.5 14h3.5a1.75 1.75 0 0 1 0 3.5H19.5"
              stroke="url(#ogvm)"
              strokeWidth="1.15"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="5" y1="6" x2="16" y2="17" stroke="url(#ogvm)" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M16 17l4.2-2.8-1.6 4.6z"
              fill="url(#ogvm)"
              stroke="url(#ogvm)"
              strokeWidth="0.4"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #22d3ee 0%, #34d399 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            VibeMiner
          </span>
        </div>
        <p
          style={{
            fontSize: 32,
            color: '#94a3b8',
            margin: 0,
            maxWidth: 640,
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {site.slogan}
        </p>
        <p
          style={{
            fontSize: 20,
            color: '#64748b',
            marginTop: 16,
            margin: 0,
          }}
        >
          Mine cryptocurrencies for networks that need you
        </p>
      </div>
    ),
    { ...size }
  );
}
