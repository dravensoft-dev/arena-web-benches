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
import { hasScript } from '../../bench-kit/src/runner.ts';
import { layerOf, scratch } from '../../bench-kit/src/scratch.ts';
import { firstSelectors, sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves, partOf } from './halves.ts';
import { held, table } from '../bundlers/rotation.ts';
import { swap, templateSource } from '../rotate.ts';
import { bunPart } from '../../bench-kit/parts/bun.ts';
import { esbuildPart } from '../../bench-kit/parts/esbuild.ts';
import type { Part } from '../../bench-kit/src/runner.ts';

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
    const path = scratch(dir, 'contract', 'none', '.', part.arenaCopy === true, part.hardlinkModules === true);
    made.push(path);
    let log = '';
    for (const step of part.compile ? ['compile', 'bundle', 'finish'] : ['bundle', 'finish']) {
      if (step === 'finish' && !hasScript(path, 'finish')) continue;
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
    // Review Focus 1: Next's `assetPrefix: './'` keeps every chunk relative; a rooted `/_next/` loads nothing below the half's route.
    if (part.bundler === 'next') expect(page).not.toContain('"/_next/');
    expect(readdirSync(out).filter((name) => /^icons-.*\.svg$/.test(name))).toHaveLength(1);

    const css = filesText(out, '.css').join('\n').replace(/\s+/g, '');
    expect(css).toMatch(startsRule(packageSelector));
    expect(css).toMatch(startsRule(appSelector));
    // Rollup and rolldown bundle no CSS: the page links the four sheets, in the order the entry imports them.
    if (part.bundler === 'rollup' || part.bundler === 'rolldown') {
      const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
      expect(linked).toEqual(sheetOrder(path, layer));
    }
    // Every file the page loads is in the output (a quote around the value is optional: Parcel minifies the page); a remote address, such as a font, is not a file of the half.
    const loads = [...page.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)=["']?([^"' >]+)/g)].map((match) => match[1]!).filter((file) => !/^[a-z][a-z0-9+.-]*:/i.test(file));
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

// The two bundlers whose files come from a template: each template is installed into a scratch of an Etsy half (the
// Etsy halves hold rollup, so everything of rollup goes) and built, and holds the same contract.
describe.each(['bun', 'esbuild'] as const)('the %s template', (id) => {
  describe.each(['react', 'angular'] as const)('installed into a scratch of the %s Etsy half', (layer) => {
    test('builds with its own scripts, keeps the base, the sprite, both sheets and Arena\'s code, links no partial declaration, and its measure.ts is its part', async () => {
      const base = `${layer}-etsy`;
      const before = status();
      const path = scratch(base, `part-${id}`, 'none', '.');
      made.push(path);
      const t = table();
      swap('.', { dir: path, product: 'etsy', layer, from: held('.', base)!, to: id, donor: null }, 'Etsy', templateSource(id, layer, t.pins));
      // The scratch's links are Etsy's install, which holds rollup and not what the template declares: a real install of the
      // template's own package.json makes a devDependency it forgot a failure here, not something Etsy's tree answers.
      rmSync(join(path, 'node_modules'), { recursive: true, force: true });
      const installed = Bun.spawnSync(['bun', 'install'], { cwd: path });
      if (installed.exitCode !== 0) throw new Error(`${id} ${layer}: bun install failed:\n${installed.stdout}${installed.stderr}`);

      let log = '';
      for (const step of layer === 'angular' ? ['compile', 'bundle', 'finish'] : ['bundle', 'finish']) {
        const done = script(path, step);
        if (!done.ok) throw new Error(`${id} ${layer}: ${step} failed:\n${done.log}`);
        log += done.log;
      }
      const out = join(path, 'dist');
      const page = readFileSync(join(out, 'index.html'), 'utf8');
      expect(page).toMatch(BASE);
      expect(readdirSync(out).filter((name) => /^icons-.*\.svg$/.test(name))).toHaveLength(1);
      const { packageSelector, appSelector } = firstSelectors(path, layer);
      const css = filesText(out, '.css').join('\n').replace(/\s+/g, '');
      expect(css).toMatch(startsRule(packageSelector));
      expect(css).toMatch(startsRule(appSelector));
      const js = filesText(out, '.js');
      expect(js.some((text) => text.includes('data-arena-part'))).toBe(true);
      if (layer === 'angular') for (const text of js) expect(text).not.toContain('ɵɵngDeclare');
      const loads = [...page.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)=["']?([^"' >]+)/g)].map((match) => match[1]!).filter((file) => !/^[a-z][a-z0-9+.-]*:/i.test(file));
      for (const file of loads) expect(existsSync(join(out, file.replace(/^\.\//, ''))), `the page loads ${file}`).toBe(true);
      expect(log).toBeString();

      // its measure.ts is the part the kit carries: the same rows and the same snippets
      const part = (await import(join(process.cwd(), path, 'measure.ts'))).part as Part;
      const expected = (id === 'bun' ? bunPart : esbuildPart)(layer);
      expect(part.observations.map((o) => o.id)).toEqual(expected.observations.filter((o) => o.layers.includes(layer)).map((o) => o.id));
      expect(part.snippets).toEqual(expected.snippets);
      expect(Object.keys(part.variants).sort()).toEqual(Object.keys(expected.variants).sort());
      expect(part.config).toBe(expected.config);
      expect(status()).toBe(before);
    });
  });
});
