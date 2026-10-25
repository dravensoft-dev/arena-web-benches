import { transformSync } from '@babel/core';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { exec } from './run.ts';

/** Where `ngc` writes an Angular half's compiled modules, inside the half or its scratch (an ignored name). */
export const NGC_OUT = '.bundler.ngc';

/**
 * `ngc -p tsconfig.app.json` (AOT, D1) from the half's own `node_modules/.bin`, its output in `dir/.bundler.ngc/`
 * with the root at `dir`, so `src/main.ts` becomes `.bundler.ngc/src/main.js`; `entry` is that file. The icon list
 * `arena build` writes is a `.ts` module, so `ngc` emits it with the rest.
 */
export function compileAot(dir: string): { ok: boolean; entry: string; log: string } {
  const root = resolve(dir);
  const entry = join(root, NGC_OUT, 'src', 'main.js');
  const done = exec(root, join(root, 'node_modules', '.bin', 'ngc'), ['-p', 'tsconfig.app.json', '--outDir', NGC_OUT, '--rootDir', '.', '--sourceMap', 'false']);
  return { ok: done.ok, entry, log: done.log };
}

const linkers = new Map<string, unknown>();

/** The linker plugin of the half at `from`: the benches' root has no `@angular/compiler-cli`, each half carries its own. */
function linkerOf(from: string): unknown {
  const key = resolve(from);
  if (!linkers.has(key)) {
    const loaded = createRequire(join(key, 'package.json'))('@angular/compiler-cli/linker/babel') as { default: unknown };
    linkers.set(key, loaded.default);
  }
  return linkers.get(key);
}

/**
 * The Angular linker over a partially compiled file, as `ng build` runs it: `null` when the file carries no
 * `ɵɵngDeclare`, otherwise Babel's output with every declaration linked. `from` is the half (or scratch) whose
 * `@angular/compiler-cli` runs, the working directory by default. This is the one place the rollup-family, Parcel, Bun
 * and esbuild drivers call the linker; the webpack family's loader runs in its bundler's process and keeps the same call.
 */
export function linkPartial(code: string, path: string, from: string = process.cwd()): string | null {
  if (!code.includes('ɵɵngDeclare')) return null;
  const out = transformSync(code, { filename: path, babelrc: false, configFile: false, compact: false, sourceMaps: false, plugins: [linkerOf(from) as never] });
  if (!out?.code) throw new Error(`the Angular linker returned no code for ${path}`);
  return out.code;
}
