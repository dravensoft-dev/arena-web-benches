import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { entryOf } from './scratch.ts';
import type { Layer } from './types.ts';

export const SHEET_IMPORT = /^@import\s+'\.\/([^']+\.css)';[ \t]*\r?\n?/gm;

/** An Angular half without `src/app.css` carries its app rules in `styles.css`, after the `@import`s. */
export const carriesApp = (dir: string, layer: Layer): boolean => layer === 'angular' && !existsSync(join(dir, 'src', 'app.css'));

/**
 * The sheets in the order the entry imports them: React `Main.tsx` imports, Angular `styles.css` `@import`s. An Angular
 * half whose `styles.css` carries the app rules after its imports has a fourth sheet, `app.css`, the place the remainder
 * takes among the sheets of the other halves.
 */
export function sheetOrder(dir: string, layer: Layer): string[] {
  const text = readFileSync(join(dir, layer === 'react' ? entryOf('react') : 'src/styles.css'), 'utf8');
  const pattern = layer === 'react' ? /^import\s+'\.\/([^']+\.css)';/gm : SHEET_IMPORT;
  const names = [...text.matchAll(pattern)].map((m) => m[1]!);
  return carriesApp(dir, layer) ? [...names, 'app.css'] : names;
}

/** The first selector of `css` a minifier leaves as written: a class, an id, `html`, `body` or `:root`. */
export function firstSelector(css: string): string {
  let text = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@[a-z-]+[^;{}]*;/g, '');
  for (;;) {
    const open = text.indexOf('{');
    if (open < 0) throw new Error('no rule in the sheet');
    const header = text.slice(0, open).split(/[;}]/).pop()!.trim();
    text = text.slice(open + 1);
    if (header.startsWith('@')) continue;
    const named = header.split(',').map((part) => part.replace(/\s+/g, ''));
    const pick = named.find((part) => /^(\.[\w-]+|#[\w-]+|html|body|:root)$/.test(part));
    if (pick) return pick;
  }
}

/** The first selector of the package sheet (`reset.css`) and of the app sheet (`app.css`, or `styles.css` where an Angular half has no `app.css`). */
export function firstSelectors(dir: string, layer: Layer): { packageSelector: string; appSelector: string } {
  const appSource = existsSync(join(dir, 'src', 'app.css')) ? 'app.css' : 'styles.css';
  return {
    packageSelector: firstSelector(readFileSync(join(dir, 'node_modules/@dravensoft', `arena-${layer}`, 'css/reset.css'), 'utf8')),
    appSelector: firstSelector(readFileSync(join(dir, 'src', appSource), 'utf8')),
  };
}
