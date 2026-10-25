/* The halves: each is an adopter of its bundler, with `measure.ts` at its root, an install of its own, and the bundler's
 * part that `measure.ts` exports. */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { historyDonor } from '../rotate.ts';
import { table } from '../bundlers/rotation.ts';
import type { BundlerId, Layer } from '../bundlers/types.ts';
import { halves, products } from '../build.ts';
import type { Part } from '../../bench-kit/src/runner.ts';

/** The directories of the sixteen halves, in `bundlers.json` order. */
export const ownHalves = (root = '.'): string[] => halves(products(root)).map((one) => one.dir);

/** The bundler part a half exports. */
export async function partOf(dir: string, root = '.'): Promise<Part> {
  return (await import(join(process.cwd(), root, dir, 'measure.ts'))).part as Part;
}

/**
 * The part of a bundler no half holds now (its entry was left out of the run), read from the half of `layer` that last
 * held it in history: its `measure.ts` is imported from a file beside the first half of the layer, where `@benches/kit`
 * resolves, and the file is removed again. Null when no commit held it.
 */
export async function partFromHistory(bundler: BundlerId, layer: Layer, root = '.'): Promise<Part | null> {
  const t = table(root);
  const into = mkdtempSync(join(tmpdir(), 'history-part-'));
  const host = join(process.cwd(), root, t.products[0]![layer], `.history-${bundler}-${layer}.ts`);
  try {
    const dir = historyDonor(root, t, bundler, layer, into);
    if (!dir) return null;
    writeFileSync(host, readFileSync(join(into, dir, 'measure.ts'), 'utf8').replace(/\nif \(import\.meta\.main\).*\n?$/s, '\n'));
    return (await import(host)).part as Part;
  } finally {
    rmSync(into, { recursive: true, force: true });
    rmSync(host, { force: true });
  }
}
