/* The halves: each is an adopter of its bundler, with `measure.ts` at its root, an install of its own, and the bundler's
 * part that `measure.ts` exports. */

import { join } from 'node:path';
import { halves, products } from '../build.ts';
import type { Part } from '../../bench-kit/src/runner.ts';

/** The directories of the sixteen halves, in `bundlers.json` order. */
export const ownHalves = (root = '.'): string[] => halves(products(root)).map((one) => one.dir);

/** The bundler part a half exports. */
export async function partOf(dir: string, root = '.'): Promise<Part> {
  return (await import(join(process.cwd(), root, dir, 'measure.ts'))).part as Part;
}
