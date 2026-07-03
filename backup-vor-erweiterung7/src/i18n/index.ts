import { de } from './de';
import { en } from './en';
import type { Lang } from '../types';

const DICTS: Record<Lang, Record<string, string>> = { de, en };

export type TFunc = (key: string, params?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const dict = DICTS[lang] ?? de;
  let text = dict[key] ?? de[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function makeT(lang: Lang): TFunc {
  return (key, params) => translate(lang, key, params);
}

export const LANGS: Lang[] = ['de', 'en'];
