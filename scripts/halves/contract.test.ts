/* What a build of each converted half has to hold, on a scratch of the half (the half itself is only read): the page
 * with its base, the sprite, the package sheet and the app sheet, the sheets linked in the order the entry imports them,
 * and on Angular no partial declaration left. Slow (it builds), so `bun test scripts` skips it:
 *   bun test --timeout 900000 --path-ignore-patterns 'nothing/**' scripts/halves/contract.test.ts */

import { afterAll, describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { script } from '../../bench-kit/src/run.ts';
import { layerOf, scratch } from '../../bench-kit/src/scratch.ts';
import { firstSelectors, sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves } from './halves.ts';

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

  test('builds with its own scripts, keeps the base, the sprite and both sheets, and writes nothing into the tree', () => {
    const before = status();
    const path = scratch(dir, 'contract', 'none');
    made.push(path);
    for (const step of layer === 'angular' ? ['compile', 'bundle', 'finish'] : ['bundle', 'finish']) {
      const done = script(path, step);
      if (!done.ok) throw new Error(`${dir}: ${step} failed:\n${done.log}`);
    }
    const out = join(path, 'dist');
    if (layer === 'angular') for (const js of filesText(out, '.js')) expect(js).not.toContain('ɵɵngDeclare');

    const { packageSelector, appSelector } = firstSelectors(path, layer);
    const page = readFileSync(join(out, 'index.html'), 'utf8');
    expect(page).toContain('<base href="./"');
    expect(readdirSync(out).filter((name) => /^icons-.*\.svg$/.test(name))).toHaveLength(1);

    const css = filesText(out, '.css').join('\n').replace(/\s+/g, '');
    expect(css).toMatch(startsRule(packageSelector));
    expect(css).toMatch(startsRule(appSelector));
    const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
    expect(linked).toEqual(sheetOrder(path, layer));
    for (const sheet of linked) expect(readdirSync(out)).toContain(sheet);
    expect(status()).toBe(before);
  });
});
