import { useEffect, useRef } from 'react';
import type { Texture } from '../data/materials';
import { drawTexture } from '../lib/texture';

/**
 * Zeichnet die programmatische Materialtextur in ein Canvas.
 * Garantiert ein sichtbares „Bild" pro Material-Kachel (nie leer).
 */
export function TextureSwatch({
  texture,
  className = '',
  w = 240,
  h = 160,
}: {
  texture: Texture;
  className?: string;
  w?: number;
  h?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawTexture(ctx, w, h, texture);
  }, [texture, w, h]);
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={className}
      data-testid="material-texture"
      data-loaded="true"
      role="img"
      aria-label="Materialtextur"
    />
  );
}
