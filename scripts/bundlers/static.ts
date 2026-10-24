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
  if (layer === 'angular') cpSync(join(dir, 'public'), out, { recursive: true });
}

/** The four sheets in the order the entry imports them: React `Main.tsx` imports, Angular `styles.css` `@import`s. */
export function sheetOrder(dir: string, layer: Layer): string[] {
  const text = readFileSync(join(dir, layer === 'react' ? entryOf('react') : 'src/styles.css'), 'utf8');
  const pattern = layer === 'react' ? /^import\s+'\.\/([^']+\.css)';/gm : /^@import\s+'\.\/([^']+\.css)';/gm;
  return [...text.matchAll(pattern)].map((m) => m[1]!);
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
  for (const name of names) {
    writeFileSync(join(out, basename(name)), inline(join(dir, 'src', name), modules, new Set()));
  }
  const page = join(out, 'index.html');
  const html = readFileSync(page, 'utf8');
  if (!html.includes('</head>')) throw new Error(`${page} has no </head> to link the sheets before`);
  const links = names.map((name) => `<link rel="stylesheet" href="./${name}">`).join('\n');
  writeFileSync(page, html.replace('</head>', () => `${links}\n</head>`));
}
