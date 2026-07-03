import { useStore } from './store/useStore';
import { makeT, type TFunc } from './i18n';
import { useMemo } from 'react';

/** Übersetzungs-Hook, an die aktuelle Sprache gebunden. */
export function useT(): TFunc {
  const lang = useStore((s) => s.lang);
  return useMemo(() => makeT(lang), [lang]);
}
