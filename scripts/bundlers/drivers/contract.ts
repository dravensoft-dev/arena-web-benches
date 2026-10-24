import { afterAll, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { scratch } from '../scratch.ts';
import { assignment, table } from '../rotation.ts';
import { finish, linkSheets, sheetOrder } from '../static.ts';
import type { Driver, Layer } from '../types.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

/** The first selector of `css` a minifier leaves as written: a class, an id, `html`, `body` or `:root`. */
export function firstSelector(css: string): string {
  let text = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@[a-z-]+[^;{}]*;/g, '');
  for (;;) {
    const open = text.indexOf('{');
    if (open < 0) throw new Error('no rule in the sheet');
    const header = text.slice(0, open).split(/[;}]/).pop()!.trim();
    text = text.slice(open + 1);
    if (header.startsWith('@')) continue;
    const named = header.split(',').map((part) => part.replace(/\s+/g, ''));
    const pick = named.find((part) => /^(\.[\w-]+|#[\w-]+|html|body|:root)$/.test(part));
    if (pick) return pick;
  }
}

/** `selector` as the start of a rule (or of a selector list) in whitespace-stripped CSS, not a word inside a value. */
const startsRule = (selector: string): RegExp => new RegExp(`(^|[{},;/])${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[{,]`);

/** Every file under `root` with `suffix`, as text. */
function filesText(root: string, suffix: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'));
}

/** The half rotation 0 assigns `driver` on `layer`; bun and esbuild have none in rotation 0 and are tried on calendly (brief). */
export function halfOf(driver: Driver, layer: Layer): string {
  const t = table();
  const owner = [...assignment(t)].find(([, built]) => built[layer] === driver.id);
  const product = owner ? owner[0] : ['bun', 'esbuild'].includes(driver.id) ? 'calendly' : '';
  const found = t.products.find((one) => one.product === product);
  if (!found) throw new Error(`rotation ${t.rotation} gives ${driver.id} no ${layer} half`);
  return found[layer];
}

/**
 * The test every driver passes (brief, tasks 6-10): on a scratch of the half rotation 0 assigns it, for each layer,
 * `recipe` is ok and, once `finish` (and `linkSheets` for a bundler that takes no CSS) has run, the output holds the
 * page with its base, the sprite and the package sheet and the app sheet; every probe returns without throwing.
 * `links` is true for a driver that leaves the sheets to `linkSheets`.
 */
export function driverContract(driver: Driver, links: boolean, extra?: (layer: Layer, built: { log: string }) => void): void {
  for (const layer of driver.layers) {
    test(`${driver.id} builds the ${layer} half with its recipe, keeps the base, the sprite and both sheets`, () => {
      const dir = halfOf(driver, layer);
      const path = scratch(dir, `drv-${driver.id}`, 'none');
      made.push(path);
      const built = driver.bundle(path, layer, 'recipe');
      expect(built.log).toBeString();
      if (!built.ok) throw new Error(`${driver.id} recipe on ${dir} failed:\n${built.log}`);
      extra?.(layer, built);
      // An Angular bundle holds no partial declaration: the linker ran over every package that carried one.
      if (layer === 'angular') for (const js of filesText(built.out, '.js')) expect(js).not.toContain('ɵɵngDeclare');

      const packageSelector = firstSelector(readFileSync(join(path, 'node_modules/@dravensoft', `arena-${layer}`, 'css/reset.css'), 'utf8'));
      // `app.css` is the app sheet (Review Focus 4); an Angular half without one carries its rules in `styles.css`.
      const appSource = existsSync(join(path, 'src', 'app.css')) ? 'app.css' : 'styles.css';
      const appSelector = firstSelector(readFileSync(join(path, 'src', appSource), 'utf8'));

      finish(path, layer, built.out);
      if (links) linkSheets(path, layer, built.out);

      const page = readFileSync(join(built.out, 'index.html'), 'utf8');
      expect(page).toContain('<base href="./"');
      const sprite = readdirSync(built.out).filter((name) => /^icons-.*\.svg$/.test(name));
      expect(sprite).toHaveLength(1);

      const css = filesText(built.out, '.css').join('\n').replace(/\s+/g, '');
      expect(css).toMatch(startsRule(packageSelector));
      expect(css).toMatch(startsRule(appSelector));

      if (links) {
        const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
        expect(linked).toEqual(sheetOrder(path, layer));
      }
    });

    test(`${driver.id} returns from every probe on the ${layer} half`, () => {
      const dir = halfOf(driver, layer);
      for (const variant of ['plain', ...driver.probes] as const) {
        const path = scratch(dir, `drv-${driver.id}-${variant}`, 'none');
        made.push(path);
        const result = driver.bundle(path, layer, variant);
        expect(typeof result.ok).toBe('boolean');
        expect(result.log).toBeString();
        expect(existsSync(result.out) || !result.ok).toBe(true);
      }
    });
  }
}
