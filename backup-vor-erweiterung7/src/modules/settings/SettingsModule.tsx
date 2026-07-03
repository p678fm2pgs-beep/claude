import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, Field, Badge } from '../../components/ui';
import { validateReservePercent } from '../../lib/validation';
import { parseLocaleNumber } from '../../lib/format';
import { TRADE_POSITIONS } from '../../data/prices';
import { hashPassword, verifyPassword, generatePassphrase } from '../../lib/password';
import { getAuth, setAuth } from '../../db/db';

export function SettingsModule() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const resetAll = useStore((s) => s.resetAll);
  const [reserveErr, setReserveErr] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const s = project.settings;

  const setReserve = (raw: string) => {
    const v = parseLocaleNumber(raw);
    const res = validateReservePercent(v);
    if (!res.ok) {
      setReserveErr(t(res.issue.code, res.issue.params));
      return;
    }
    setReserveErr(undefined);
    updateProject((p) => (p.settings.reservePercent = v));
  };

  const trades = TRADE_POSITIONS.filter((tr) =>
    (lang === 'de' ? tr.name : tr.nameEn).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader eyebrow="Experte" title={t('settings.title')} />

      <div className="card p-5 mb-5 space-y-4">
        <Field label={t('settings.language')}>
          <div className="flex gap-2">
            {(['de', 'en'] as const).map((l) => (
              <button key={l} className={`btn flex-1 ${lang === l ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLang(l)}>
                {l === 'de' ? 'Deutsch' : 'English'}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('settings.reserve')} error={reserveErr}>
            <input className="field-input" defaultValue={s.reservePercent} onBlur={(e) => setReserve(e.target.value)} data-testid="reserve-input" inputMode="decimal" />
          </Field>
          <Field label={t('settings.coverage')}>
            <input
              className="field-input"
              defaultValue={s.paintCoverage}
              onBlur={(e) => {
                const v = parseLocaleNumber(e.target.value);
                if (Number.isFinite(v) && v > 0) updateProject((p) => (p.settings.paintCoverage = v));
              }}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('settings.fee')}>
            <select
              className="field-input"
              value={s.fee.type}
              onChange={(e) => updateProject((p) => (p.settings.fee.type = e.target.value as 'prozent' | 'pauschal'))}
            >
              <option value="prozent">{t('settings.feeType.prozent')}</option>
              <option value="pauschal">{t('settings.feeType.pauschal')}</option>
            </select>
          </Field>
          <Field label={s.fee.type === 'prozent' ? '%' : '€'}>
            <input
              className="field-input"
              defaultValue={s.fee.value}
              onBlur={(e) => {
                const v = parseLocaleNumber(e.target.value);
                if (Number.isFinite(v) && v >= 0) updateProject((p) => (p.settings.fee.value = v));
              }}
              data-testid="fee-value"
            />
          </Field>
        </div>
      </div>

      {/* Preislisten-Editor (Auszug) */}
      <div className="card p-5 mb-5">
        <p className="eyebrow mb-3">{t('settings.priceEditor')}</p>
        <input className="field-input mb-3 max-w-xs" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-muted text-left">
              <tr className="border-b border-line">
                <th className="py-1 font-normal">{t('costs.position')}</th>
                <th className="py-1 font-normal text-right">Standard VK</th>
                <th className="py-1 font-normal text-right">Premium VK</th>
                <th className="py-1 font-normal text-right">Luxus VK</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((tr) => (
                <tr key={tr.id} className="border-b border-line/40">
                  <td className="py-1">{lang === 'de' ? tr.name : tr.nameEn}</td>
                  <td className="py-1 text-right">{tr.prices.standard[0]}–{tr.prices.standard[1]} €</td>
                  <td className="py-1 text-right">{tr.prices.premium[0]}–{tr.prices.premium[1]} €</td>
                  <td className="py-1 text-right">{tr.prices.luxus[0]}–{tr.prices.luxus[1]} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted text-[11px] mt-2">{t('costs.priceDate')}: {project.priceListDate}</p>
      </div>

      <ChangePassword />

      {/* Reset */}
      <div className="card border-danger/30 p-5">
        <p className="eyebrow mb-2">{t('settings.resetData')}</p>
        <p className="text-muted text-sm mb-3">{t('setup.recovery')}</p>
        {!confirmReset ? (
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>{t('settings.resetData')}</button>
        ) : (
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => resetAll()} data-testid="confirm-reset">{t('common.confirm')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePassword() {
  const t = useT();
  const [old, setOld] = useState('');
  const [newStart, setNewStart] = useState(generatePassphrase());
  const [newExpert, setNewExpert] = useState(generatePassphrase());
  const [status, setStatus] = useState<'idle' | 'wrong' | 'done'>('idle');

  const apply = async () => {
    const auth = await getAuth();
    if (!auth) return;
    const ok = (await verifyPassword(old, auth.start)) || (await verifyPassword(old, auth.expert));
    if (!ok) {
      setStatus('wrong');
      return;
    }
    const [start, expert] = await Promise.all([hashPassword(newStart), hashPassword(newExpert)]);
    await setAuth({ ...auth, start, expert });
    setStatus('done');
  };

  return (
    <div className="card p-5 mb-5">
      <p className="eyebrow mb-3">{t('settings.changePassword')}</p>
      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <Field label={t('settings.oldPassword')}>
          <input type="password" className="field-input" value={old} onChange={(e) => setOld(e.target.value)} data-testid="old-pw" />
        </Field>
        <Field label={t('settings.newStartPw')}>
          <input className="field-input font-mono text-xs" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
        </Field>
        <Field label={t('settings.newExpertPw')}>
          <input className="field-input font-mono text-xs" value={newExpert} onChange={(e) => setNewExpert(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button className="btn btn-primary" onClick={apply} data-testid="change-pw">{t('common.save')}</button>
        {status === 'wrong' && <Badge tone="danger">{t('gate.wrong')}</Badge>}
        {status === 'done' && <Badge tone="ok">{t('common.saved')}</Badge>}
      </div>
      {status === 'done' && (
        <p className="text-gold text-xs mt-2">{t('setup.warning')}</p>
      )}
    </div>
  );
}
