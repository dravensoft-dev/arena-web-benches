/* What a build of each converted half has to hold, on a scratch of the half (the half itself is only read): the page
 * with its base, the sprite, the package sheet and the app sheet, the sheets linked in the order the entry imports them,
 * and on Angular no partial declaration left. Slow (it builds), so `bun test scripts` skips it:
 *   bun test --timeout 900000 --path-ignore-patterns 'nothing/**' scripts/halves/contract.test.ts */

import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { BASE } from '../build.ts';
import { script } from '../../bench-kit/src/run.ts';
import { layerOf, scratch } from '../../bench-kit/src/scratch.ts';
import { firstSelectors, sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves, partOf } from './halves.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

/** `selector` as the start of a rule (or of a selector list) in whitespace-stripped CSS, not a word inside a value. */
const startsRule = (selector: string): RegExp => new RegExp(`(^|[{},;/])${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[{,]`);

/** Every file under `root` with `suffix`, as text. */
const filesText = (root: string, suffix: string): string[] => readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
  .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'));

const status = (): string => Bun.spawnSync(['git', 'status', '--porcelain']).stdout.toString();

describe.each(ownHalves())('%s', (dir) => {
  const layer = layerOf(dir);

  test('builds with its own scripts, keeps the base, the sprite and both sheets, and writes nothing into the tree', async () => {
    const part = await partOf(dir);
    const before = status();
    const path = scratch(dir, 'contract', 'none', '.', part.arenaCopy === true);
    made.push(path);
    let log = '';
    for (const step of part.compile ? ['compile', 'bundle', 'finish'] : ['bundle', 'finish']) {
      const done = script(path, step);
      if (!done.ok) throw new Error(`${dir}: ${step} failed:\n${done.log}`);
      log += done.log;
    }
    // Review Focus 2: the Vite the build runs is the one the half declares, 7.3.7 on the Vite 7 half and 8.3.5 on the Vite 8 half.
    if (part.bundler === 'vite7' || part.bundler === 'vite8') expect(log).toContain(`vite v${part.bundler === 'vite7' ? '7.3.7' : '8.3.5'} building`);
    const out = join(path, 'dist');
    if (layer === 'angular') for (const js of filesText(out, '.js')) expect(js).not.toContain('ɵɵngDeclare');

    const { packageSelector, appSelector } = firstSelectors(path, layer);
    const page = readFileSync(join(out, 'index.html'), 'utf8');
    expect(page).toMatch(BASE);
    expect(readdirSync(out).filter((name) => /^icons-.*\.svg$/.test(name))).toHaveLength(1);

    const css = filesText(out, '.css').join('\n').replace(/\s+/g, '');
    expect(css).toMatch(startsRule(packageSelector));
    expect(css).toMatch(startsRule(appSelector));
    // Rollup and rolldown bundle no CSS: the page links the four sheets, in the order the entry imports them.
    if (part.bundler === 'rollup' || part.bundler === 'rolldown') {
      const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
      expect(linked).toEqual(sheetOrder(path, layer));
    }
    // Every file the page loads is in the output (a quote around the value is optional: Parcel minifies the page).
    const loads = [...page.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)=["']?([^"' >]+)/g)].map((match) => match[1]!);
    expect(loads.length).toBeGreaterThan(0);
    for (const file of loads) expect(existsSync(join(out, file.replace(/^\.\//, ''))), `${dir}: the page loads ${file}`).toBe(true);
    expect(status()).toBe(before);
  });

  // Review Focus 2: Analog imports `vite` itself, and the half's one install answers it with the Vite the half declares.
  if (layer === 'angular') {
    test('the Angular plugin on Vite imports the Vite the half declares', async () => {
      const part = await partOf(dir);
      if (part.bundler !== 'vite7' && part.bundler !== 'vite8') return;
      const analog = createRequire(join(process.cwd(), dir, 'package.json')).resolve('@analogjs/vite-plugin-angular/package.json');
      const vite = JSON.parse(readFileSync(createRequire(analog).resolve('vite/package.json'), 'utf8')) as { version: string };
      expect(vite.version).toBe(part.bundler === 'vite7' ? '7.3.7' : '8.3.5');
    });
  }
});
