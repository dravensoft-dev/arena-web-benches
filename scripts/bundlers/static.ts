import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { carriesApp, SHEET_IMPORT, sheetOrder } from '../../bench-kit/src/static.ts';
import type { Layer } from '../../bench-kit/src/types.ts';

/** Copies the sprite into `out`, and for Angular `public/**` too: what `angular.json` `assets` names. */
export function finish(dir: string, layer: Layer, out: string): void {
  mkdirSync(out, { recursive: true });
  const src = join(dir, 'src');
  for (const name of readdirSync(src)) {
    if (/^icons-.*\.svg$/.test(name)) cpSync(join(src, name), join(out, name));
  }
  // A half without a `public/` has no assets to copy, as `angular.json` `assets` globs nothing there.
  if (layer === 'angular' && existsSync(join(dir, 'public'))) cpSync(join(dir, 'public'), out, { recursive: true });
}

/**
 * Writes each sheet of `dir` into `out` as the half holds it (the package sheet is one flat file) and links them from
 * `out/index.html` in `sheetOrder`, before `</head>`.
 */
export function linkSheets(dir: string, layer: Layer, out: string): void {
  const names = sheetOrder(dir, layer);
  const remainder = carriesApp(dir, layer) ? readFileSync(join(dir, 'src', 'styles.css'), 'utf8').replace(SHEET_IMPORT, '') : '';
  for (const name of names) {
    const own = carriesApp(dir, layer) && name === 'app.css';
    writeFileSync(join(out, basename(name)), own ? remainder : readFileSync(join(dir, 'src', name), 'utf8'));
  }
  const page = join(out, 'index.html');
  const html = readFileSync(page, 'utf8');
  if (!html.includes('</head>')) throw new Error(`${page} has no </head> to link the sheets before`);
  const links = names.map((name) => `<link rel="stylesheet" href="./${name}">`).join('\n');
  writeFileSync(page, html.replace('</head>', () => `${links}\n</head>`));
}

