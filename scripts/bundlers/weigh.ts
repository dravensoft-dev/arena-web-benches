/* Brotli figures over a build output, as a returning visitor downloads them: quality 11, window 24, KB of 1024 bytes
 * to two decimals, with the previous build's file as the dictionary for the last column. */

import { brotliCompressSync, constants } from 'node:zlib';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

export type Figures = {
  firstVisit: { plain: number; recipe: number };
  appRelease: { plain: number; recipe: number };
  patch: number;
  dictionary: number;
  total: { js: number; css: number; sprite: number; fonts: number };
};

export function brotliKB(bytes: Uint8Array, dictionary?: Uint8Array): number {
  const size = brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_LGWIN]: 24 },
    ...(dictionary ? { dictionary } : {}),
  }).length;
  return Math.round(size / 10.24) / 100;
}

/** The name before its content hash: `-<hash>` or `.<hash>` before the extension. A hash has six or more
 * word characters and a digit or capital in it, so `my-component.js` keeps its name. */
export function stem(name: string): string {
  const base = name.slice(0, name.length - extname(name).length);
  const m = /^(.+?)[-.]((?=[A-Za-z0-9_]*[0-9A-Z])[A-Za-z0-9_]{6,})$/.exec(base);
  return m?.[1] ?? base;
}

function files(root: string, dir = root): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const at = join(dir, e.name);
    if (e.isDirectory()) out.push(...files(root, at));
    else out.push(at.slice(root.length + 1).split('\\').join('/'));
  }
  return out.sort();
}

/** Every file of the extension in the output: the page loads each file a build emits. Relative paths, sorted. */
export function loaded(out: string, ext: '.js' | '.css'): string[] {
  return files(out).filter((f) => extname(f) === ext);
}

const key = (rel: string) => `${dirname(rel)}/${stem(basename(rel))}${extname(rel)}`;

/** The `.js` files of `after` that differ from `before` by name or bytes, in plain brotli and each with its
 * predecessor of the same stem as the dictionary. An unpaired file counts whole. */
export function changedKB(before: string, after: string): { plain: number; dictionary: number } {
  const old = files(before).filter((f) => extname(f) === '.js').map((f) => ({ f, bytes: readFileSync(join(before, f)) }));
  let plain = 0;
  let dictionary = 0;
  for (const f of loaded(after, '.js')) {
    const bytes = readFileSync(join(after, f));
    if (old.some((o) => o.f === f && o.bytes.equals(bytes))) continue;
    const prev = old.find((o) => key(o.f) === key(f));
    const whole = brotliKB(bytes);
    plain += whole;
    dictionary += prev ? brotliKB(bytes, prev.bytes) : whole;
  }
  return { plain: Math.round(plain * 100) / 100, dictionary: Math.round(dictionary * 100) / 100 };
}
