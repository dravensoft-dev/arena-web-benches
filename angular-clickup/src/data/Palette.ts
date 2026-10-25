/* The palette studio's data. Everything Arena decides comes from `@dravensoft/arena-angular/palette`;
 * this file only holds the draft the user edits and hands it to that module's functions.
 * The slots are the keys a runtime palette accepts (theme.md, "What is a runtime palette?"). */
import { arenaCheckPalette, arenaRuntimePalette } from '@dravensoft/arena-angular/palette';
import type { ArenaPaletteReport, ArenaRuntimePalette } from '@dravensoft/arena-angular/palette';
import runtime from '../arena.runtime.generated.json';
import config from '../../arena.config.json';

export type Polarity = 'dark' | 'light';

export type Slot = { key: string; optional: boolean };
export type SlotGroup = { id: string; title: string; slots: Slot[] };

const required = (key: string): Slot => ({ key, optional: false });
const optional = (key: string): Slot => ({ key, optional: true });
const cat = (n: number) => `cat-${n}`;
const heat = (n: number) => `heat-${n}`;
const upTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export const SLOT_GROUPS: SlotGroup[] = [
  { id: 'surface', title: 'Surfaces', slots: ['base-100', 'base-200', 'base-300', 'base-content'].map(required) },
  {
    id: 'brand',
    title: 'Brand',
    slots: [
      required('primary'), required('primary-content'), optional('primary-fill'),
      required('secondary'), required('secondary-content'),
      required('neutral'), required('neutral-content'),
    ],
  },
  {
    id: 'status',
    title: 'Status',
    slots: [
      required('info'), required('info-content'),
      required('success'), required('success-content'),
      required('warning'), required('warning-content'),
      required('error'), required('error-content'), optional('error-fill'),
    ],
  },
  { id: 'cat', title: 'Chart categories', slots: upTo(8).map(cat).map(required) },
  { id: 'heat', title: 'Heat ramp (all five or none)', slots: upTo(5).map(heat).map(optional) },
];

export const SLOTS: Slot[] = SLOT_GROUPS.flatMap((group) => group.slots);

export type Draft = { name: string; polarity: Polarity; colors: Record<string, string> };

type Declared = { name: string; polarity: Polarity; colors: Record<string, string> };
const DECLARED = config.palettes as unknown as Declared[];
export const DECLARED_NAMES = DECLARED.map((palette) => palette.name);

export function draftFrom(declared: string): Draft {
  const found = DECLARED.find((palette) => palette.name === declared) ?? DECLARED[0];
  return { name: 'custom', polarity: found.polarity, colors: { ...found.colors } };
}

export type Evaluation = {
  /** The palette Arena built, or null when a function threw. */
  palette: ArenaRuntimePalette | null;
  /** What arenaCheckPalette / arenaRuntimePalette reported. */
  reports: ArenaPaletteReport[];
  /** The messages of the errors those functions threw, one per line they wrote. */
  errors: string[];
};

const lines = (error: unknown): string[] =>
  (error instanceof Error ? error.message : String(error)).split('\n').filter((line) => line !== '');

export function evaluate(draft: Draft): Evaluation {
  const input = { polarity: draft.polarity, colors: draft.colors };
  const errors: string[] = [];
  let reports: ArenaPaletteReport[] = [];
  let palette: ArenaRuntimePalette | null = null;
  try {
    reports = arenaCheckPalette(input, runtime);
  } catch (error) {
    errors.push(...lines(error));
    return { palette, reports, errors };
  }
  try {
    palette = arenaRuntimePalette(draft.name, input, runtime).palette;
  } catch (error) {
    errors.push(...lines(error));
  }
  return { palette, reports, errors };
}

const escaped = (key: string) => key.replace(/[-]/g, '\\-');

/* Which messages name a slot: its key as a whole word, or for a chart category the colour it holds. */
export function messagesOf(slot: Slot, draft: Draft, evaluation: Evaluation): string[] {
  const named = new RegExp(`(?:(?<![\\w-])|(?<=--color-))${escaped(slot.key)}(?![\\w-])`);
  const colour = /^cat-\d$/.test(slot.key) ? (draft.colors[slot.key] ?? '').toLowerCase() : '';
  const mine = (text: string) => named.test(text) || (colour !== '' && text.toLowerCase().includes(colour));
  return [
    ...evaluation.errors.filter(mine),
    ...evaluation.reports.filter((report) => mine(report.message)).map((report) => report.message),
  ];
}

export const isHex = (value: string | undefined): value is string => value !== undefined && /^#[0-9a-fA-F]{6}$/.test(value);

/* The colour a slot paints now: what the draft holds, else what Arena derived for it. */
export function shownColour(slot: Slot, draft: Draft, applied: ArenaRuntimePalette | null): string | undefined {
  const given = draft.colors[slot.key];
  if (isHex(given)) return given.toLowerCase();
  return applied?.properties[`--color-${slot.key}`];
}
