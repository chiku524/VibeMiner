import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c0e12',
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <rect
            x="4"
            y="22"
            width="5"
            height="5"
            rx="1"
            stroke="url(#g)"
            strokeWidth="1.2"
            fill="none"
            opacity={0.9}
          />
          <rect
            x="11"
            y="22"
            width="5"
            height="5"
            rx="1"
            stroke="url(#g)"
            strokeWidth="1.2"
            fill="none"
            opacity={0.7}
          />
          <rect
            x="18"
            y="22"
            width="5"
            height="5"
            rx="1"
            stroke="url(#g)"
            strokeWidth="1.2"
            fill="none"
            opacity={0.5}
          />
          <path d="M9 24.5h2M16 24.5h2" stroke="url(#g)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="22" cy="11" r="7" fill="#0c0e12" stroke="url(#g)" strokeWidth="1.5" />
          <path
            d="M22 6.5v9M19.5 7.5h3.25a1.75 1.75 0 0 1 0 3.5H19.5M19.5 14h3.5a1.75 1.75 0 0 1 0 3.5H19.5"
            stroke="url(#g)"
            strokeWidth="1.15"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="5" y1="6" x2="16" y2="17" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M16 17l4.2-2.8-1.6 4.6z"
            fill="url(#g)"
            stroke="url(#g)"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
