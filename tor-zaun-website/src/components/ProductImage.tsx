// Generierter, lizenzfreier Bild-PLATZHALTER. Stellt stilisiert einen Zaun/ein Tor dar,
// damit kein Layout-Shift entsteht und kein fremdes/geschütztes Bild eingebunden wird.
// Vor Livegang durch lizenzierte Produktfotos ersetzen (mehrere Ansichten, Zoom).
// inhaltstragend -> sinnvoller Alt-Text; rein dekorative Nutzung -> alt="".

interface Props {
  alt: string;
  swatch?: string;
  variant?: 'zaun' | 'tor' | 'sicht';
  className?: string;
  /** true = rein dekorativ, wird vor Screenreadern verborgen. */
  decorative?: boolean;
}

export function ProductImage({ alt, swatch = '#3a444a', variant = 'zaun', className, decorative }: Props) {
  const a11y = decorative
    ? { role: 'presentation' as const, 'aria-hidden': true }
    : { role: 'img' as const, 'aria-label': alt };

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      {...a11y}
    >
      <defs>
        <linearGradient id={`sky-${swatch}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f3" />
          <stop offset="1" stopColor="#dfe4e7" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#sky-${swatch})`} />
      <rect y="230" width="400" height="70" fill="#d8d2c6" />
      {variant === 'zaun' && (
        <g stroke={swatch} strokeWidth="4">
          {[40, 90, 140, 190, 240, 290, 340].map((x) => (
            <line key={x} x1={x} y1="120" x2={x} y2="232" />
          ))}
          <line x1="30" y1="150" x2="360" y2="150" />
          <line x1="30" y1="200" x2="360" y2="200" />
        </g>
      )}
      {variant === 'tor' && (
        <g stroke={swatch} strokeWidth="5" fill="none">
          <rect x="70" y="110" width="260" height="125" />
          {[110, 150, 190, 230, 270].map((x) => (
            <line key={x} x1={x} y1="115" x2={x} y2="230" />
          ))}
          <line x1="72" y1="150" x2="328" y2="150" />
          <line x1="72" y1="195" x2="328" y2="195" />
        </g>
      )}
      {variant === 'sicht' && (
        <g>
          <rect x="40" y="120" width="320" height="112" fill={swatch} opacity="0.85" />
          <g stroke="#ffffff" strokeWidth="1" opacity="0.25">
            {[140, 160, 180, 200, 220].map((y) => (
              <line key={y} x1="40" y1={y} x2="360" y2={y} />
            ))}
          </g>
        </g>
      )}
      <rect x="6" y="6" width="388" height="288" fill="none" stroke="#ffffff" strokeOpacity="0.5" />
    </svg>
  );
}
