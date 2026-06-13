import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="text-3xl mt-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-dashed border-line rounded p-12 text-center" data-testid="empty-state">
      <div className="text-gold/40 text-4xl mb-4 font-serif">—</div>
      <p className="text-lg text-text mb-1">{title}</p>
      {hint && <p className="text-muted text-sm">{hint}</p>}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="text-muted text-xs mt-1 block">{hint}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'ok' | 'warn' | 'danger' | 'muted' }) {
  const tones: Record<string, string> = {
    gold: 'border-gold/40 text-gold',
    ok: 'border-ok/50 text-ok',
    warn: 'border-warn/50 text-warn',
    danger: 'border-danger/50 text-danger',
    muted: 'border-line text-muted',
  };
  return (
    <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${tones[tone]}`}>
      {children}
    </span>
  );
}
