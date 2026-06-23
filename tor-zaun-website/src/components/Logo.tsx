// Inline-Logo als SVG – keine externe Datei nötig (wichtig für die Single-File-HTML).
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="A-Z Tor und Zaun Logo">
      <rect width="64" height="64" rx="12" fill="#22282c" />
      <g stroke="#b88a4a" strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1="14" y1="16" x2="14" y2="50" />
        <line x1="26" y1="16" x2="26" y2="50" />
        <line x1="38" y1="16" x2="38" y2="50" />
        <line x1="50" y1="16" x2="50" y2="50" />
        <line x1="10" y1="26" x2="54" y2="26" />
        <line x1="10" y1="40" x2="54" y2="40" />
      </g>
    </svg>
  );
}
