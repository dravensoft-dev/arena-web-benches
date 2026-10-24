import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { entryOf } from './scratch.ts';
import type { Layer } from './types.ts';

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

const SHEET_IMPORT = /^@import\s+'\.\/([^']+\.css)';[ \t]*\r?\n?/gm;

/** An Angular half without `src/app.css` carries its app rules in `styles.css`, after the `@import`s. */
const carriesApp = (dir: string, layer: Layer): boolean => layer === 'angular' && !existsSync(join(dir, 'src', 'app.css'));

/**
 * The sheets in the order the entry imports them: React `Main.tsx` imports, Angular `styles.css` `@import`s. An Angular
 * half whose `styles.css` carries the app rules after its imports has a fourth sheet, `app.css`, which `linkSheets`
 * writes from that remainder (the place `app.css` takes in the other halves).
 */
export function sheetOrder(dir: string, layer: Layer): string[] {
  const text = readFileSync(join(dir, layer === 'react' ? entryOf('react') : 'src/styles.css'), 'utf8');
  const pattern = layer === 'react' ? /^import\s+'\.\/([^']+\.css)';/gm : SHEET_IMPORT;
  const names = [...text.matchAll(pattern)].map((m) => m[1]!);
  return carriesApp(dir, layer) ? [...names, 'app.css'] : names;
}

const IMPORT = /^@import\s+(?:'([^']+)'|"([^"]+)");[ \t]*$/gm;

/** A specifier no browser resolves: not relative, not absolute, not a URL. */
const isPackage = (spec: string): boolean => !/^(\.{1,2}\/|\/|[a-z]+:)/i.test(spec);

/**
 * `file`'s text with each `@import` of a package specifier, and each relative `@import` inside what it brings,
 * replaced by the imported text. A file already inlined once is not inlined again (as a CSS bundler does).
 */
function inline(file: string, modules: string, seen: Set<string>): string {
  return readFileSync(file, 'utf8').replace(IMPORT, (line, single?: string, double?: string) => {
    const spec = single ?? double!;
    const target = isPackage(spec) ? join(modules, spec) : join(dirname(file), spec);
    if (/^[a-z]+:/i.test(spec) || spec.startsWith('/')) return line;
    if (!existsSync(target)) throw new Error(`${file}: @import '${spec}' resolves to ${target}, which does not exist`);
    if (seen.has(target)) return '';
    seen.add(target);
    return inline(target, modules, seen);
  });
}

/**
 * Writes each sheet of `dir` into `out`, with package-specifier `@import`s inlined from the scratch's
 * `node_modules` (F6b), and links them from `out/index.html` in `sheetOrder`, before `</head>`.
 */
export function linkSheets(dir: string, layer: Layer, out: string): void {
  const modules = join(dir, 'node_modules');
  const names = sheetOrder(dir, layer);
  const remainder = carriesApp(dir, layer) ? readFileSync(join(dir, 'src', 'styles.css'), 'utf8').replace(SHEET_IMPORT, '') : '';
  for (const name of names) {
    const own = carriesApp(dir, layer) && name === 'app.css';
    writeFileSync(join(out, basename(name)), own ? remainder : inline(join(dir, 'src', name), modules, new Set()));
  }
  const page = join(out, 'index.html');
  const html = readFileSync(page, 'utf8');
  if (!html.includes('</head>')) throw new Error(`${page} has no </head> to link the sheets before`);
  const links = names.map((name) => `<link rel="stylesheet" href="./${name}">`).join('\n');
  writeFileSync(page, html.replace('</head>', () => `${links}\n</head>`));
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
