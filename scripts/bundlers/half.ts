/* The build of one half, run from the half's own directory (`bun ../scripts/bundlers/half.ts`): the driver the
 * rotation assigns its product and layer builds the page's recipe, and the sprite (and an Angular half's `public/`) is
 * copied in. A build that does not succeed exits 1 with
 * its log. */

import { basename, join } from 'node:path';
import { assigned, table } from './rotation.ts';
import { finish } from './static.ts';
import type { Driver } from './types.ts';

const dir = process.cwd();
const { layer, bundler } = assigned(table(join(dir, '..')), basename(dir));
const driver = (await import(`./drivers/${bundler}.ts`)).default as Driver;

const built = driver.bundle(dir, layer, 'recipe');
if (!built.ok) {
  console.error(built.log);
  process.exit(1);
}
finish(dir, layer, built.out);
console.log(`${basename(dir)}: built with ${bundler} into ${built.out}`);
