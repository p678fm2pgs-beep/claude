/**
 * HAVEN ATELIER — Projekt-Inspirationssammlung (Erweiterung 8 · T10, intern).
 * Referenzbilder (lokal, Drag & Drop, komprimiert), Notizen, Favoriten, und eine
 * Farb-Pipette direkt auf den Bildern (nächste HAVEN-Töne). Nie im Kunden-Lookbook.
 */
import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState } from '../../components/ui';
import { compressImage } from '../../lib/image';
import { nearestTones, type ColorTone } from '../../data/colors';
import { uid } from '../../lib/id';
import type { InspirationImage } from '../../types';
import { Star, X, Upload, Pipette } from 'lucide-react';

export function InspirationModule() {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pipetteFor, setPipetteFor] = useState<string | null>(null);
  const [sampled, setSampled] = useState<{ hex: string; tones: ColorTone[] } | null>(null);

  const images = project.inspiration ?? [];

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImage(file, 1280);
      const img: InspirationImage = { id: uid('insp'), dataUrl, note: '', fav: false };
      updateProject((p) => {
        p.inspiration = [...(p.inspiration ?? []), img];
      });
    }
  };

  const update = (id: string, fn: (i: InspirationImage) => void) =>
    updateProject((p) => {
      const img = (p.inspiration ?? []).find((x) => x.id === id);
      if (img) fn(img);
    });

  const remove = (id: string) =>
    updateProject((p) => {
      p.inspiration = (p.inspiration ?? []).filter((x) => x.id !== id);
    });

  /** Pixel-Farbe an der Klickposition auf dem Bild ermitteln → nächste Töne. */
  const sample = (e: React.MouseEvent<HTMLImageElement>, dataUrl: string) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width;
    const sy = (e.clientY - r.top) / r.height;
    const probe = new Image();
    probe.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = probe.width;
      canvas.height = probe.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(probe, 0, 0);
      const px = ctx.getImageData(Math.floor(sx * probe.width), Math.floor(sy * probe.height), 1, 1).data;
      const hex = `#${[px[0], px[1], px[2]].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
      setSampled({ hex, tones: nearestTones(hex, 3) });
    };
    probe.src = dataUrl;
  };

  return (
    <div className="p-6 lg:p-8" data-testid="inspiration-module">
      <PageHeader eyebrow={t('app.subtitle')} title={t('nav.inspiration')} />

      <div
        className="border border-dashed border-line rounded p-6 mb-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        data-testid="inspiration-drop"
      >
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} data-testid="inspiration-file" />
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> {t('inspiration.add')}
        </button>
        <p className="text-muted text-xs mt-2">{t('inspiration.hint')}</p>
      </div>

      {sampled && (
        <div className="card p-3 mb-6 flex items-center gap-3" data-testid="pipette-result">
          <div className="w-10 h-10 rounded border border-line" style={{ background: sampled.hex }} />
          <span className="text-sm text-muted">{sampled.hex}</span>
          <span className="text-muted text-xs">→</span>
          {sampled.tones.map((tone) => (
            <div key={tone.id} className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded border border-line" style={{ background: tone.hex }} />
              <span className="text-xs">{tone.name}</span>
            </div>
          ))}
          <button className="text-muted hover:text-text ml-auto" onClick={() => setSampled(null)}><X size={14} /></button>
        </div>
      )}

      {images.length === 0 ? (
        <EmptyState title={t('inspiration.empty')} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="inspiration-grid">
          {images.map((img) => (
            <div key={img.id} className="card overflow-hidden group" data-testid={`inspiration-${img.id}`}>
              <div className="relative">
                <img
                  src={img.dataUrl}
                  alt=""
                  className={`w-full h-40 object-cover ${pipetteFor === img.id ? 'cursor-crosshair' : ''}`}
                  onClick={pipetteFor === img.id ? (e) => sample(e, img.dataUrl) : undefined}
                  data-testid={`inspiration-img-${img.id}`}
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    className={`p-1 rounded bg-black/40 ${img.fav ? 'text-gold' : 'text-white'}`}
                    onClick={() => update(img.id, (i) => { i.fav = !i.fav; })}
                    title={t('inspiration.fav')}
                    data-testid={`inspiration-fav-${img.id}`}
                  >
                    <Star size={12} />
                  </button>
                  <button
                    className={`p-1 rounded bg-black/40 ${pipetteFor === img.id ? 'text-gold' : 'text-white'}`}
                    onClick={() => setPipetteFor(pipetteFor === img.id ? null : img.id)}
                    title={t('inspiration.pipette')}
                    data-testid={`inspiration-pipette-${img.id}`}
                  >
                    <Pipette size={12} />
                  </button>
                  <button className="p-1 rounded bg-black/40 text-white hover:text-danger" onClick={() => remove(img.id)} title={t('common.delete')}>
                    <X size={12} />
                  </button>
                </div>
              </div>
              <input
                className="field-input text-xs py-1 m-2 w-[calc(100%-1rem)]"
                placeholder={t('inspiration.note')}
                defaultValue={img.note}
                onBlur={(e) => update(img.id, (i) => { i.note = e.target.value; })}
                data-testid={`inspiration-note-${img.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
