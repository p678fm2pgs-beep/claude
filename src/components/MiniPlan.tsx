import type { Floorplan } from '../types';
import { CM_PER_M, wallLengthCm } from '../lib/geometry';
import { openingSymbol, inwardNormal } from '../lib/planSymbols';

interface Props {
  plan: Floorplan;
  heightCm?: number;
  width?: number;
  height?: number;
  showDimensions?: boolean;
  dark?: boolean;
}

/** Leichtgewichtige SVG-Darstellung eines Grundrisses mit Öffnungen & Maßen. */
export function MiniPlan({ plan, width = 320, height = 240, showDimensions = false, dark = false }: Props) {
  const pts = plan.points;
  if (pts.length < 3) return null;

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = 28;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const ox = pad + ((width - pad * 2) - spanX * scale) / 2;
  const oy = pad + ((height - pad * 2) - spanY * scale) / 2;
  const tx = (x: number) => ox + (x - minX) * scale;
  const ty = (y: number) => oy + (y - minY) * scale;

  const poly = pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ');
  const stroke = dark ? '#C9A84C' : '#1A1814';
  const fill = dark ? 'rgba(201,168,76,0.06)' : 'rgba(0,0,0,0.04)';
  const dim = dark ? '#9A958A' : '#6b6256';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="block" data-testid="floorplan-svg">
      <polygon points={poly} fill={fill} stroke={stroke} strokeWidth={2} />
      {/* Öffnungen */}
      {plan.openings.map((o) => {
        const a = pts[o.wallIndex % pts.length];
        const b = pts[(o.wallIndex + 1) % pts.length];
        const len = wallLengthCm(pts, o.wallIndex) || 1;
        const t0 = o.offsetCm / len;
        const t1 = Math.min(1, (o.offsetCm + o.widthCm) / len);
        const x0 = a.x + (b.x - a.x) * t0;
        const y0 = a.y + (b.y - a.y) * t0;
        const x1 = a.x + (b.x - a.x) * t1;
        const y1 = a.y + (b.y - a.y) * t1;
        // Erweiterung 7: korrektes Architektursymbol zusätzlich zur Öffnungsmarkierung.
        const inward = inwardNormal(pts, o.wallIndex);
        const symbol = openingSymbol(o, a, b, inward);
        const color = o.kind === 'fenster' ? '#5A7488' : o.kind === 'durchbruch' ? '#8C9C8A' : '#B0855B';
        return (
          <g key={o.id}>
            <line
              x1={tx(x0)}
              y1={ty(y0)}
              x2={tx(x1)}
              y2={ty(y1)}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={o.kind === 'durchbruch' ? 0.4 : 1}
            />
            {symbol.map((s, i) => (
              <polyline
                key={i}
                points={s.pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={s.style === 'solid' ? 1.6 : 1}
                strokeDasharray={s.style === 'dashed' ? '4 3' : undefined}
                opacity={s.style === 'thin' ? 0.75 : 1}
              />
            ))}
          </g>
        );
      })}
      {/* Maße je Wand */}
      {showDimensions &&
        pts.map((p, i) => {
          const b = pts[(i + 1) % pts.length];
          const mx = tx((p.x + b.x) / 2);
          const my = ty((p.y + b.y) / 2);
          const lenM = (wallLengthCm(pts, i) / CM_PER_M).toFixed(2);
          return (
            <text key={i} x={mx} y={my} fill={dim} fontSize={10} textAnchor="middle" dy={-4}>
              {lenM} m
            </text>
          );
        })}
    </svg>
  );
}
