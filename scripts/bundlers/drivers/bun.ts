import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { run } from './common.ts';

/**
 * `bun build` over the half's own page, as the page describes it (bun-esbuild.md): one entry, one CSS file for it, no
 * option that keeps Arena apart. `recipe` is that build and `plain` equals it (F7). Probe `twice` is the same build into
 * an outdir that is not emptied first: the caller builds `recipe`, changes the app, then calls `twice` on the same
 * directory, and `bun build` leaves both entry files there (`bun.outdir-kept`).
 */
const driver: Driver = {
  id: 'bun',
  layers: ['react'],
  out: 'dist',
  probes: ['twice'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    if (variant !== 'twice') rmSync(out, { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: `bun builds no ${layer} half yet` };
    const built = run(resolve(dir), 'bun', ['build', './src/index.html', '--outdir', 'dist', '--minify'], { NODE_ENV: 'production' });
    return { ok: built.ok, out, log: built.log };
  },
};

export default driver;
