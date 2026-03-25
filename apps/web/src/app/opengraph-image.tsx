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
              <linearGradient id="og-gem-main" x1="25%" y1="0%" x2="75%" y2="100%">
                <stop offset="0%" stopColor="#ecfeff" />
                <stop offset="32%" stopColor="#38bdf8" />
                <stop offset="58%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="og-gem-shade" x1="0%" y1="40%" x2="100%" y2="60%">
                <stop offset="0%" stopColor="#164e63" />
                <stop offset="50%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <linearGradient id="og-gem-edge" x1="45%" y1="0%" x2="55%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
              <linearGradient id="og-base" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5c5348" />
                <stop offset="100%" stopColor="#0c0a08" />
              </linearGradient>
              <linearGradient id="og-base-cap" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4bc94" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
              <linearGradient id="og-base-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a4238" />
                <stop offset="100%" stopColor="#1a1612" />
              </linearGradient>
              <linearGradient id="og-handle" gradientUnits="userSpaceOnUse" x1="18.35" y1="24.62" x2="20.98" y2="15.08">
                <stop offset="0%" stopColor="#1a100c" />
                <stop offset="45%" stopColor="#8b5a3c" />
                <stop offset="100%" stopColor="#3d2818" />
              </linearGradient>
              <linearGradient id="og-steel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="35%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="og-eye-rim" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="og-wood-socket" x1="40%" y1="0%" x2="60%" y2="100%">
                <stop offset="0%" stopColor="#e8dcc8" />
                <stop offset="55%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#292524" />
              </linearGradient>
            </defs>
            <path d="M3.85 27.35h14.5v2.25H3.85z" fill="url(#og-base-mid)" stroke="#2a2520" strokeWidth="0.22" />
            <path d="M4 26.35h13.35v2.35H4z" fill="url(#og-base)" stroke="#3d3530" strokeWidth="0.24" />
            <path d="M4 26.35l0.5-0.42h12.35l0.5 0.42z" fill="url(#og-base-cap)" opacity={0.92} />
            <path d="M7.15 28.05h7.05" stroke="#c4a574" strokeWidth="0.38" strokeLinecap="round" opacity={0.35} />
            <path
              d="M9.5 5.45L12.95 7.45L12.95 11.45L9.5 13.45L6.05 11.45L6.05 7.45L9.5 5.45Z"
              fill="url(#og-gem-main)"
              stroke="url(#og-gem-edge)"
              strokeWidth="0.42"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 5.45V13.45M6.05 9.45h6.9M7.35 7.1l4.3 4.7M7.35 11.8l4.3-4.7"
              stroke="url(#og-gem-shade)"
              strokeWidth="0.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
            <path d="M9.5 5.45L7.95 7.45L9.5 8.55L11.05 7.45L9.5 5.45Z" fill="#ecfeff" opacity={0.38} />
            <path d="M18.42 24.72L20.98 15.08" stroke="#1a0f0a" strokeWidth="0.64" strokeLinecap="round" opacity={0.45} fill="none" />
            <ellipse
              cx="17.98"
              cy="24.76"
              rx="0.37"
              ry="0.23"
              fill="url(#og-handle)"
              stroke="#0a0a0a"
              strokeWidth="0.1"
              transform="rotate(-8 17.98 24.76)"
            />
            <path d="M18.35 24.62L20.98 15.08" stroke="#0a0a0a" strokeWidth="1.54" strokeLinecap="round" fill="none" />
            <path d="M18.35 24.62L20.98 15.08" stroke="url(#og-handle)" strokeWidth="1.22" strokeLinecap="round" fill="none" />
            <path
              d="M18.78 22.48L18.98 19.05L19.15 16.65"
              stroke="#3d2818"
              strokeWidth="0.07"
              strokeLinecap="round"
              opacity={0.55}
              fill="none"
            />
            <path d="M18.58 20.95L18.75 17.45" stroke="#3d2818" strokeWidth="0.06" strokeLinecap="round" opacity={0.45} fill="none" />
            <path d="M18.48 24.28L20.38 15.22" stroke="#c9a66c" strokeWidth="0.12" strokeLinecap="round" opacity={0.38} fill="none" />
            <path
              fill="url(#og-steel)"
              stroke="#020617"
              strokeWidth="0.12"
              strokeLinejoin="round"
              d="M10.42 8.38C13.55 11.22 16.88 13.38 19.48 14.62C20.22 15.02 20.9 15.26 21.58 15.42C21.88 14.48 22.15 13.52 22.35 12.58C23.72 8.68 25.88 5.18 28.08 2.72C28.48 2.28 28.42 1.68 27.88 1.35C25.32 0.82 22.48 1.95 19.62 3.88C15.82 6.38 12.58 7.96 10.42 8.38Z"
            />
            <path d="M11.15 8.85Q15.85 12.35 20.05 14.75" stroke="#f8fafc" strokeWidth="0.1" strokeLinecap="round" opacity={0.5} fill="none" />
            <path d="M13.85 6.35Q20.5 3.35 24.85 2.55Q26.95 2.15 28.25 2.65" stroke="#cbd5e1" strokeWidth="0.08" strokeLinecap="round" opacity={0.44} fill="none" />
            <path
              d="M10.55 8.45L10.75 8.62M26.95 1.55L27.15 1.78"
              stroke="#f1f5f9"
              strokeWidth="0.06"
              strokeLinecap="round"
              opacity={0.52}
              fill="none"
            />
            <path d="M20.15 15.05Q21.25 13.75 22.15 15.1" stroke="#475569" strokeWidth="0.07" strokeLinecap="round" opacity={0.72} fill="none" />
            <ellipse
              cx="20.72"
              cy="15.02"
              rx="0.48"
              ry="0.22"
              fill="url(#og-wood-socket)"
              stroke="#0a0a0a"
              strokeWidth="0.06"
              transform="rotate(-26 20.72 15.02)"
            />
            <ellipse
              cx="20.72"
              cy="15.02"
              rx="0.58"
              ry="0.28"
              fill="none"
              stroke="url(#og-eye-rim)"
              strokeWidth="0.07"
              transform="rotate(-26 20.72 15.02)"
            />
          </svg>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #ecfeff 0%, #22d3ee 38%, #0d9488 72%, #134e4a 100%)',
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
