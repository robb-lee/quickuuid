import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
        }}
      >
        {/* Emoji-style Dice */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          }}
        >
          {/* Main dice body - rounded cube */}
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
            ry="3"
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="0.5"
          />
          
          {/* Top highlight for 3D effect */}
          <rect
            x="4.5"
            y="4.5"
            width="15"
            height="4"
            rx="2.5"
            ry="2.5"
            fill="#f87171"
            opacity="0.8"
          />
          
          {/* Right side shadow for 3D effect */}
          <rect
            x="16"
            y="8"
            width="3.5"
            height="11.5"
            rx="1"
            ry="1"
            fill="#b91c1c"
            opacity="0.6"
          />
          
          {/* Dots arranged as dice face 5 */}
          {/* Corner dots */}
          <circle cx="8" cy="8" r="1.2" fill="white" />
          <circle cx="16" cy="8" r="1.2" fill="white" />
          <circle cx="8" cy="16" r="1.2" fill="white" />
          <circle cx="16" cy="16" r="1.2" fill="white" />
          
          {/* Center dot */}
          <circle cx="12" cy="12" r="1.2" fill="white" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}