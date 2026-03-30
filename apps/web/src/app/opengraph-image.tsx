import { ImageResponse } from 'next/og';
import { BRAND_MARK_PNG } from '@/lib/brand';
import { site } from '@/lib/site';

// OpenNext rejects edge for this route in the default server bundle (Cloudflare deploy).
export const runtime = 'nodejs';
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 88,
              height: 88,
              borderRadius: 20,
              background: '#1a1d24',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            }}
          >
            <img
              src={`${site.baseUrl}${BRAND_MARK_PNG}`}
              width={64}
              height={64}
              alt=""
              style={{ objectFit: 'contain' }}
            />
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #f1f5f9 0%, #2dd4bf 35%, #818cf8 70%, #4338ca 100%)',
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
