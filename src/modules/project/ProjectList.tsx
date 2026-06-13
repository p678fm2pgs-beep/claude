import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState } from '../../components/ui';
import { Plus, Copy, Trash2, Upload, FileDown, Sparkles } from 'lucide-react';

export function ProjectList() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const projects = useStore((s) => s.projects);
  const newProject = useStore((s) => s.newProject);
  const openProject = useStore((s) => s.openProject);
  const deleteProjectById = useStore((s) => s.deleteProjectById);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const seedDemo = useStore((s) => s.seedDemo);
  const importProject = useStore((s) => s.importProject);
  const showToast = useStore((s) => s.showToast);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    await newProject(name.trim() || (lang === 'de' ? 'Neues Projekt' : 'New project'));
    setName('');
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = await importProject(text);
    if (!ok) showToast('toast.error');
    e.target.value = '';
  };

  const exportProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '_')}.haven`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <PageHeader eyebrow={t('app.subtitle')} title={t('projects.title')} />

      <div className="card p-5 mb-8">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="field-label">{t('projects.newName')}</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder={t('projects.new')}
              data-testid="new-project-name"
            />
          </div>
          <button className="btn btn-primary" onClick={create} data-testid="create-project">
            <Plus size={16} /> {t('projects.new')}
          </button>
          <button className="btn btn-ghost" onClick={seedDemo} data-testid="seed-demo">
            <Sparkles size={16} /> {t('projects.seedDemo')}
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> {t('common.import')}
          </button>
          <input ref={fileRef} type="file" accept=".haven,.json,application/json" className="hidden" onChange={onImport} />
        </div>
      </div>

      {projects.length > 0 && (
        <input
          className="field-input mb-4 max-w-xs"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState title={t('projects.empty')} />
      ) : (
        <ul className="space-y-3" data-testid="project-list">
          {filtered.map((p) => (
            <li key={p.id} className="card p-4 flex items-center justify-between gap-4 hover:border-gold/40 transition-colors">
              <button className="flex-1 text-left" onClick={() => openProject(p.id)} data-testid="open-project">
                <p className="text-lg">{p.name}</p>
                <p className="text-muted text-xs mt-0.5">
                  {p.rooms.length} {t('nav.rooms')} · {t('projects.modified')}:{' '}
                  {new Date(p.modified).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}
                </p>
              </button>
              <div className="flex items-center gap-1">
                <button className="btn btn-ghost px-3" onClick={() => exportProject(p.id)} title={t('common.export')}>
                  <FileDown size={15} />
                </button>
                <button className="btn btn-ghost px-3" onClick={() => duplicateProject(p.id)} title={t('common.duplicate')}>
                  <Copy size={15} />
                </button>
                <button className="btn btn-danger px-3" onClick={() => setConfirmDelete(p.id)} title={t('common.delete')}>
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={() => setConfirmDelete(null)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="mb-5">{t('projects.deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await deleteProjectById(confirmDelete);
                  setConfirmDelete(null);
                }}
                data-testid="confirm-delete"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
