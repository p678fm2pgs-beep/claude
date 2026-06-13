import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader } from '../../components/ui';
import { getRoom } from '../roomHelpers';
import { deriveAreas } from '../../lib/geometry';
import { lightHint } from '../../lib/harmony';
import type { Orientation, Daylight } from '../../types';

const ORIENTATIONS: Orientation[] = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
const DAYLIGHT: Daylight[] = ['wenig', 'mittel', 'viel'];

export function LightModule({ roomId }: { roomId: string }) {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const d = deriveAreas(room.floorplan, room.heightCm);
  const hint = lightHint(room.light, d.floorAreaM2);

  const setLight = (patch: Partial<typeof room.light>) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      if (r) r.light = { ...r.light, ...patch };
    });

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader eyebrow={t(`roomType.${room.type}`)} title={t('light.title')} />

      <div className="card p-6 mb-5">
        <p className="field-label">{t('light.orientation')}</p>
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto" data-testid="compass">
          {(['NW', 'N', 'NO', 'W', null, 'O', 'SW', 'S', 'SO'] as (Orientation | null)[]).map((o, i) =>
            o === null ? (
              <div key={i} className="flex items-center justify-center text-gold/40">☼</div>
            ) : (
              <CompassBtn key={o} o={o} active={room.light.orientation} onPick={(x) => setLight({ orientation: x })} />
            ),
          )}
        </div>
        <p className="sr-only">{ORIENTATIONS.join(' ')}</p>
      </div>

      <div className="card p-6 mb-5">
        <p className="field-label">{t('light.daylight')}</p>
        <div className="flex gap-2">
          {DAYLIGHT.map((dl) => (
            <button
              key={dl}
              className={`btn flex-1 ${room.light.daylight === dl ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setLight({ daylight: dl })}
              data-testid={`daylight-${dl}`}
            >
              {t(`light.${dl}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card border-gold/30 bg-gold/5 p-4">
        <p className="text-sm text-gold">{t(hint.messageKey)}</p>
      </div>
    </div>
  );
}

function CompassBtn({
  o,
  active,
  onPick,
}: {
  o: Orientation;
  active: Orientation;
  onPick: (o: Orientation) => void;
}) {
  return (
    <button
      className={`aspect-square border rounded text-sm transition-colors ${active === o ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted hover:text-text'}`}
      onClick={() => onPick(o)}
      data-testid={`orient-${o}`}
    >
      {o}
    </button>
  );
}
