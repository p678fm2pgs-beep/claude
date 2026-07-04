import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState } from '../../components/ui';
import { BoardView } from './BoardView';
import { Musterbrett } from './Musterbrett';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { exportProjectPdf } from '../pdf/exportPdf';
import { exportLookbookPdf } from '../pdf/exportLookbook';
import { downloadSampleCsv } from '../../lib/sampleList';
import { computeRoomCost } from '../../lib/projectCost';
import { uid } from '../../lib/id';
import { formatEUR } from '../../lib/format';
import type { Room } from '../../types';
import { FileText, FileDown, Mail, Plus, Maximize2, GitCompare, BookOpen, ListChecks, PenTool } from 'lucide-react';
import { ApprovalDialog } from './ApprovalDialog';

export function BoardModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const setPresenting = useStore((s) => s.setPresenting);
  const mode = useStore((s) => s.mode);
  const room = getRoom(project, roomId)!;
  const variant = getActiveVariant(room)!;
  const [compare, setCompare] = useState(false);
  // Erweiterung 8 · T7/T8: Lookbook-Optionen + Freigabe-Dialog.
  const [lookbookCompare, setLookbookCompare] = useState(false);
  const [lookbookApproval, setLookbookApproval] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const hasContent = variant.materials.length > 0 || Object.keys(variant.colorRoles).length > 0;

  const setActiveVariant = (vid: string) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      if (r) r.activeVariantId = vid;
    });

  const addVariant = () =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      if (!r) return;
      const base = r.variants.find((v) => v.id === r.activeVariantId) ?? r.variants[0];
      const copy = JSON.parse(JSON.stringify(base)) as typeof base;
      copy.id = uid('var');
      copy.name = `Variante ${String.fromCharCode(65 + r.variants.length)}`;
      r.variants.push(copy);
      r.activeVariantId = copy.id;
    });

  const setNotes = (notes: string) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) v.notes = notes;
    });

  const email = () => {
    const subject = encodeURIComponent(`HAVEN Moodboard — ${project.name}`);
    const body = encodeURIComponent(`Projekt: ${project.name}\nRaum: ${room.name}\nVariante: ${variant.name}`);
    window.location.href = `mailto:hello@haven-luxury.com?subject=${subject}&body=${body}`;
  };

  const variantB = compare ? room.variants.find((v) => v.id !== variant.id) : undefined;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        eyebrow={t(`roomType.${room.type}`)}
        title={t('board.title')}
        action={
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-ghost" onClick={() => setPresenting(true)} data-testid="present-btn">
              <Maximize2 size={15} /> {t('board.present')}
            </button>
            <button className="btn btn-primary" onClick={() => exportProjectPdf(project, false, lang)} data-testid="export-pdf">
              <FileText size={15} /> {t('board.exportPdf')}
            </button>
            {mode === 'experte' && (
              <button className="btn btn-ghost" onClick={() => exportProjectPdf(project, true, lang)} data-testid="export-internal-pdf">
                <FileDown size={15} /> {t('board.exportInternalPdf')}
              </button>
            )}
            {/* Erweiterung 6 · S12 / 8 · T7+T8: Lookbook mit Optionen */}
            <button
              className="btn btn-ghost"
              onClick={() => exportLookbookPdf(project, lang, { compare: lookbookCompare, approval: lookbookApproval, internal: mode === 'experte' })}
              data-testid="export-lookbook"
            >
              <BookOpen size={15} /> {t('board.lookbook')}
            </button>
            <button className="btn btn-ghost" onClick={() => setApprovalOpen(true)} data-testid="approval-btn">
              <PenTool size={15} /> {t('approval.sign')}
            </button>
            <button className="btn btn-ghost" onClick={() => downloadSampleCsv(project)} data-testid="export-samples">
              <ListChecks size={15} /> {t('board.sampleList')}
            </button>
            <button className="btn btn-ghost" onClick={email} data-testid="email-btn">
              <Mail size={15} /> {t('board.email')}
            </button>
          </div>
        }
      />

      {/* Erweiterung 8 · T7/T8: Lookbook-Optionen */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted" data-testid="lookbook-options">
        <span className="eyebrow">{t('export.options')}:</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={lookbookCompare} onChange={(e) => setLookbookCompare(e.target.checked)} data-testid="opt-compare" />
          {t('export.compare')}
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={lookbookApproval} onChange={(e) => setLookbookApproval(e.target.checked)} data-testid="opt-approval" />
          {t('export.approval')}
        </label>
        {(project.approvals ?? []).length > 0 && (
          <span className="text-ok" data-testid="approval-count">✓ {(project.approvals ?? []).length}× {t('approval.signedAt')}</span>
        )}
      </div>

      {approvalOpen && <ApprovalDialog onClose={() => setApprovalOpen(false)} />}

      {/* Varianten-Leiste */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {room.variants.map((v) => (
          <button
            key={v.id}
            className={`px-3 py-1.5 text-sm border rounded ${v.id === variant.id ? 'border-gold text-gold' : 'border-line text-muted'}`}
            onClick={() => setActiveVariant(v.id)}
            data-testid={`variant-${v.id}`}
          >
            {v.name}
          </button>
        ))}
        <button className="btn btn-ghost text-xs py-1.5" onClick={addVariant} data-testid="add-variant">
          <Plus size={13} /> {t('board.addVariant')}
        </button>
        {room.variants.length > 1 && (
          <button className={`btn text-xs py-1.5 ${compare ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCompare(!compare)} data-testid="compare-toggle">
            <GitCompare size={13} /> {t('board.compare')}
          </button>
        )}
      </div>

      {!hasContent ? (
        <EmptyState title={t('board.empty')} />
      ) : compare && variantB ? (
        <div>
          <div className="grid lg:grid-cols-2 gap-4">
            <BoardView room={room} variant={variant} coverage={project.settings.paintCoverage} />
            <BoardView room={room} variant={variantB} coverage={project.settings.paintCoverage} />
          </div>
          <CompareDiff room={room} coverage={project.settings.paintCoverage} aId={variant.id} bId={variantB.id} aName={variant.name} bName={variantB.name} />
        </div>
      ) : (
        <>
          <BoardView room={room} variant={variant} coverage={project.settings.paintCoverage} />
          <Musterbrett room={room} variant={variant} />
          <div className="card p-4 mt-4">
            <label className="field-label">{t('board.notes')}</label>
            <textarea className="field-input min-h-[80px]" value={variant.notes} onChange={(e) => setNotes(e.target.value)} data-testid="board-notes" />
          </div>
        </>
      )}
    </div>
  );
}

function CompareDiff({ room, coverage, aId, bId, aName, bName }: { room: Room; coverage: number; aId: string; bId: string; aName: string; bName: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const a = computeRoomCost({ ...room, activeVariantId: aId }, coverage);
  const b = computeRoomCost({ ...room, activeVariantId: bId }, coverage);
  const diffMin = b.subtotal.min - a.subtotal.min;
  const diffMax = b.subtotal.max - a.subtotal.max;
  const diff = Math.round((diffMin + diffMax) / 2);
  return (
    <div className="card p-4 mt-4 text-center" data-testid="compare-diff">
      <p className="eyebrow mb-1">{t('board.diff')}</p>
      <p className="text-xl">
        {bName}: {diff >= 0 ? '+ ' : '− '}
        {formatEUR(Math.abs(diff), lang)} {t('common.net')} {t('common.from')} {aName}
      </p>
    </div>
  );
}
