interface DiceIconProps {
  size?: number;
  className?: string;
}

export function DiceIcon({ size = 24, className }: DiceIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
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
      
      {/* Subtle inner shadow on dots for depth */}
      <circle cx="8" cy="8" r="1" fill="white" opacity="0.9" />
      <circle cx="16" cy="8" r="1" fill="white" opacity="0.9" />
      <circle cx="8" cy="16" r="1" fill="white" opacity="0.9" />
      <circle cx="16" cy="16" r="1" fill="white" opacity="0.9" />
      <circle cx="12" cy="12" r="1" fill="white" opacity="0.9" />
    </svg>
  );
}