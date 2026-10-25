/* A half in a temp directory, for the kit's tests: the files a scratch copies and the install it links, as small as they can be. */

import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const put = (root: string, rel: string, text: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};

export const SHEETS = ['arena.package.generated.css', 'arena.generated.css', 'plugin.generated.css', 'app.css'];

/** The module of the Arena package a scratch patches, relative to the package. */
export const PATCHED = { react: 'components/forms/arena-button/ArenaButton.js', angular: 'fesm2022/dravensoft-arena-angular.mjs' } as const;

/**
 * A benches root holding the half `<layer>-fx`, with a real install: `rollup` (and its `.bin` link), Arena's package in a
 * scope directory, and the sources a scratch reads. Returns the root.
 */
export function fixture(layer: 'react' | 'angular', manifest: Record<string, unknown> = {}): { root: string; dir: string } {
  const root = mkdtempSync(join(tmpdir(), 'kit-fx-'));
  const dir = `${layer}-fx`;
  const half = join(root, dir);
  put(half, 'package.json', JSON.stringify({ name: dir, scripts: {}, ...manifest }));
  put(half, 'x.config.mjs', 'export default {};\n');
  put(half, 'src/app.css', '.app{color:red}\n');
  put(half, 'src/index.html', '<!doctype html><html><head></head><body></body></html>\n');
  put(half, 'src/icons-abc.svg', '<svg/>');
  if (layer === 'react') {
    put(half, 'src/Main.tsx', `${SHEETS.map((name) => `import './${name}';`).join('\n')}\nexport {};\n`);
  } else {
    put(half, 'src/main.ts', 'export {};\n');
    put(half, 'src/styles.css', `${SHEETS.slice(0, 3).map((name) => `@import './${name}';`).join('\n')}\n@import './app.css';\n`);
  }
  const arena = join(half, 'node_modules', '@dravensoft', `arena-${layer}`);
  put(arena, 'package.json', JSON.stringify({ name: `@dravensoft/arena-${layer}`, version: '1.0.0' }));
  put(arena, 'css/reset.css', '.pkg{margin:0}\n');
  put(arena, PATCHED[layer], 'export const x = 1;\n');
  put(half, 'node_modules/rollup/package.json', JSON.stringify({ name: 'rollup', version: '1.0.0' }));
  put(half, 'node_modules/rollup/bin.js', '#!/usr/bin/env node\n');
  mkdirSync(join(half, 'node_modules', '.bin'), { recursive: true });
  symlinkSync('../rollup/bin.js', join(half, 'node_modules', '.bin', 'rollup'));
  return { root, dir };
}
