import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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
