import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver } from '../types.ts';
import { run } from './common.ts';

/**
 * The Angular half through its own `ng` (`@angular/build`'s `application` builder): `ng build --base-href ./`, the
 * builder's defaults for production. The page gives no config of its own, so `recipe` is this build and `plain`
 * equals it (F6, F7). The builder writes the page and links the sheets itself, so the caller has no sheet to link.
 */
const driver: Driver = {
  id: 'angular',
  layers: ['angular'],
  out: 'dist/browser',
  probes: [],
  linksSheets: false,
  bundle(dir, layer) {
    const out = join(dir, 'dist', 'browser');
    rmSync(join(dir, 'dist'), { recursive: true, force: true });
    if (layer !== 'angular') return { ok: false, out, log: `the application builder builds no ${layer} half` };
    const done = run(resolve(dir), join(resolve(dir), 'node_modules', '.bin', 'ng'), ['build', '--base-href', './']);
    return { ok: done.ok, out, log: done.log };
  },
};

export default driver;
