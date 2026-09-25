interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export default function Logo({ className = 'h-10 w-auto', showTagline = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 540 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-h-full max-w-full"
      >
        <defs>
          <linearGradient id="xeroxmateBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0077FF" />
            <stop offset="100%" stopColor="#00B4FF" />
          </linearGradient>
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0080ff" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Main Wordmark */}
        <g
          fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="84"
          letterSpacing="0.5"
        >
          {/* XEROX in Crisp Pure White */}
          <text x="16" y="78" fill="#FFFFFF">
            XEROX
          </text>
          {/* MATE in Electric Blue */}
          <text x="312" y="78" fill="url(#xeroxmateBlueGrad)" filter="url(#subtleGlow)">
            MATE
          </text>
        </g>

        {showTagline && (
          <g>
            {/* Left Accent Bar */}
            <rect x="20" y="108" width="46" height="5" rx="2.5" fill="#0080FF" />

            {/* Tagline: YOUR PRINTING PARTNER */}
            <text
              x="268"
              y="113.5"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
              fontWeight="800"
              fontSize="14.5"
              letterSpacing="8.5"
              fill="#F1F5F9"
            >
              YOUR PRINTING PARTNER
            </text>

            {/* Right Accent Bar */}
            <rect x="470" y="108" width="46" height="5" rx="2.5" fill="#0080FF" />
          </g>
        )}
      </svg>
    </div>
  );
}
