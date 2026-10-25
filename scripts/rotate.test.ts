import { afterAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { halves } from './build.ts';
import { assigned, assignment, current, draw, leftOutOf, previousResults, table } from './bundlers/rotation.ts';
import { pinFor } from './bundlers/pins.ts';
import { ownHalves, partOf } from './halves/halves.ts';
import { cpSync } from 'node:fs';
import { bundlerFiles, donorSource, transplantPage, historyDonor, installMoved, plan, rotate, swap, templateSource } from './rotate.ts';

const t = table();
const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

describe('every half agrees with the committed assignment', () => {
  test.each(ownHalves())('%s holds the bundler `assigned()` gives it: its part, its pin, and the config file of its part', async (dir) => {
    const part = await partOf(dir);
    expect(part.bundler).toBe(assigned(t, dir).bundler);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { packageManager: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };
    if (part.bundler !== 'bun') expect(declared[part.pin], `${dir} declares ${part.pin}`).toBe(pinFor(t, part.bundler, part.pin));
    expect(existsSync(join(dir, part.config)), `${dir} carries ${part.config}`).toBe(true);
    expect(manifest.packageManager).toBe(`bun@${t.pins['bun']}`);
  });

  test('the halves of the table are the sixteen directories on disk, one per product and layer', () => {
    expect(halves(t.products).map((one) => one.dir).sort()).toEqual(ownHalves().sort());
    for (const dir of ownHalves()) expect(existsSync(dir), dir).toBe(true);
  });
});

describe('plan', () => {
  test('the assignment the halves hold moves nothing', () => {
    expect(plan(t, current(t), current(t))).toEqual([]);
  });

  test('every move goes to the bundler of the next assignment from the bundler the half holds, with a donor where a half of the layer holds it now', () => {
    const now = current(t);
    const next = assignment(t, draw(t, 5, leftOutOf(t, previousResults())));
    const moves = plan(t, now, next);
    for (const move of moves) {
      expect(move.to).toBe(next.get(move.product)![move.layer]);
      expect(move.from).toBe(now.get(move.product)![move.layer]);
      const held = [...now.values()].some((layers) => layers[move.layer] === move.to);
      expect(move.donor === null, `${move.dir} -> ${move.to}`).toBe(!held);
      if (move.donor) expect(now.get(t.products.find((one) => one.react === move.donor || one.angular === move.donor)!.product)![move.layer]).toBe(move.to);
    }
  });
});

/** The package whose installed version is a bundler's own, as each half's part names it. */
const PIN: Partial<Record<string, string>> = { angular: '@angular/build', rspack: '@rspack/core', vite7: 'vite', vite8: 'vite' };

describe('a whole assignment on a copy of the benches', () => {
  // What the next run would draw: the entries the committed results left out are among the eight, so a half may need a
  // bundler no half holds now, which `rotate` reads from the history of this repository.
  const drawn = draw(t, 11, leftOutOf(t, previousResults()));
  const root = mkdtempSync(join(tmpdir(), 'rotate-draw-'));
  made.push(root);
  cpSync('.', root, { recursive: true, filter: (from) => !/(^|[\\/])(node_modules|dist|\.git|vendor|\.run-[^\\/]*)$/.test(from) });
  const moves = rotate(root, drawn, false, '.');
  const found = assignment(t, drawn);

  test('moves exactly the halves whose bundler differs, and a second rotation to the same draw moves nothing', () => {
    expect(moves.length).toBeGreaterThan(0);
    expect(rotate(root, drawn, false, '.')).toEqual([]);
    for (const [product, layers] of current(t, root)) expect(layers).toEqual(found.get(product)!);
  });

  test.each(ownHalves())('%s agrees with the draw: its part, its declared pin, its scripts and no file of another bundler', (dir) => {
    const bundler = [...found].flatMap(([product, layers]) => (['react', 'angular'] as const).filter((layer) => t.products.find((one) => one.product === product)![layer] === dir).map((layer) => layers[layer]))[0]!;
    const measure = readFileSync(join(root, dir, 'measure.ts'), 'utf8');
    expect(measure, `${dir} measure.ts`).toContain(`bundler: '${bundler}'`);
    const manifest = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as { packageManager: string; scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };
    if (bundler === 'bun') expect(manifest.packageManager).toBe(`bun@${t.pins['bun']}`);
    else {
      const pin = PIN[bundler] ?? bundler;
      expect(manifest.devDependencies[pin], `${dir} declares ${pin}`).toBe(pinFor(t, bundler, pin));
    }
    expect(manifest.scripts['bundle'], `${dir} bundle`).toBeString();
    expect(manifest.scripts['build']).toContain('bun run bundle');
    expect(manifest.dependencies[`@dravensoft/arena-${dir.startsWith('react') ? 'react' : 'angular'}`]).toMatch(/^file:\.\.\/vendor\//);
    const part = /config: ['"]([^'"]+)['"]/.exec(measure)![1]!;
    expect(existsSync(join(root, dir, part)) || part === 'package.json', `${dir} carries ${part}`).toBe(true);
    const configs = readdirSync(join(root, dir)).filter((name) => /^(vite|rollup|rolldown|webpack|rspack|esbuild|next)\.config\.mjs$/.test(name));
    expect(configs.length <= 1, `${dir}: ${configs}`).toBe(true);
    if (configs[0]) expect(configs[0].startsWith(bundler.replace(/\d$/, '')) || bundler === 'angular', `${dir}: ${configs[0]}`).toBe(true);
  });
});

describe('historyDonor', () => {
  test('finds the half of the layer that last held a bundler in the history of this repository, and null for one no commit held', () => {
    const into = mkdtempSync(join(tmpdir(), 'rotate-history-'));
    made.push(into);
    const dir = historyDonor('.', t, 'rollup', 'react', into);
    expect(dir).toStartWith('react-');
    expect(readFileSync(join(into, dir!, 'measure.ts'), 'utf8')).toContain("bundler: 'rollup'");
    expect(historyDonor('.', t, 'nope' as never, 'react', into)).toBeNull();
  });
});

/** A root with two Vite-like halves and a rollup-like donor, the files a swap moves. */
function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'rotate-'));
  made.push(root);
  const put = (rel: string, text: string) => {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  put('react-a/package.json', JSON.stringify({ name: 'react-a-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'old', build: 'old' }, devDependencies: { old: '1.0.0' } }));
  put('react-a/old.config.mjs', 'old\n');
  put('react-a/Server.ts', 'const port = process.env.PORT ?? 5101;\n');
  put('react-a/src/Main.tsx', 'a\n');
  put('react-a/README.md', 'react-a is the A bench on 5101 with old\n');
  put('react-a/bun.lock', 'lock a\n');
  put('react-b/package.json', JSON.stringify({ name: 'react-b-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'new', build: 'new && finish', finish: 'node finish.mjs' }, devDependencies: { fresh: '2.0.0' } }));
  put('react-b/new.config.mjs', 'new\n');
  put('react-b/finish.mjs', 'finish\n');
  put('react-b/Server.ts', 'const port = process.env.PORT ?? 5102;\n');
  put('react-b/src/Main.tsx', 'b\n');
  put('react-b/README.md', 'react-b is the B bench on 5102 with new\n');
  return root;
}

describe('swap', () => {
  test('a half takes its donor\'s config, scripts, devDependencies and README with its own name, dev flow and sources, and loses its old files and lockfile', () => {
    const root = fixture();
    swap(root, { dir: 'react-a', product: 'a', layer: 'react', from: 'rollup', to: 'vite7', donor: 'react-b' }, 'A', donorSource(root, 'react-b', 'react', ['rollup', 'vite7'], 'B'));
    expect(readdirSync(join(root, 'react-a')).sort()).toEqual(['README.md', 'Server.ts', 'finish.mjs', 'new.config.mjs', 'package.json', 'src']);
    const manifest = JSON.parse(readFileSync(join(root, 'react-a', 'package.json'), 'utf8')) as { name: string; scripts: Record<string, string>; devDependencies: Record<string, string> };
    expect(manifest.name).toBe('react-a-bench');
    expect(manifest.scripts).toEqual({ bundle: 'new', build: 'new && finish', finish: 'node finish.mjs', dev: 'bun --hot ./Server.ts' });
    expect(manifest.devDependencies).toEqual({ fresh: '2.0.0' });
    expect(readFileSync(join(root, 'react-a', 'src/Main.tsx'), 'utf8')).toBe('a\n');
    expect(readFileSync(join(root, 'react-a', 'Server.ts'), 'utf8')).toContain('5101');
    expect(readFileSync(join(root, 'react-a', 'README.md'), 'utf8')).toBe('react-a is the A bench on 5101 with new\n');
    // the donor is as it was
    expect(readFileSync(join(root, 'react-b', 'README.md'), 'utf8')).toBe('react-b is the B bench on 5102 with new\n');
  });

  test('the lockfile is made again after a swap by a real `bun install`: it names the donor\'s devDependency and none of the old half\'s', () => {
    const root = fixture();
    const donor = join(root, 'react-b', 'package.json');
    writeFileSync(donor, JSON.stringify({ ...JSON.parse(readFileSync(donor, 'utf8')), devDependencies: { 'is-number': '7.0.0' } }));
    writeFileSync(join(root, 'react-a', 'package.json'), JSON.stringify({ name: 'react-a-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'old', build: 'old' }, devDependencies: { 'is-odd': '3.0.1' } }));
    const move = { dir: 'react-a', product: 'a', layer: 'react' as const, from: 'rollup' as const, to: 'vite7' as const, donor: 'react-b' };
    swap(root, move, 'A', donorSource(root, 'react-b', 'react', ['rollup', 'vite7'], 'B'));
    expect(existsSync(join(root, 'react-a', 'bun.lock'))).toBe(false);
    installMoved(root, [move]);
    const lock = readFileSync(join(root, 'react-a', 'bun.lock'), 'utf8');
    expect(lock).toContain('is-number');
    expect(lock).not.toContain('is-odd');
  }, 120000);

  test('a bundler with no donor and no template is a throw naming it', () => {
    expect(() => templateSource('vite7', 'react', t.pins)).toThrow('no half holds vite7 and bench-kit/parts has no template for it');
  });

  test('the bundler\'s files leave out the half\'s sources, Arena configuration, dev server and install, and keep angular.json unless the builder is involved', () => {
    const root = fixture();
    writeFileSync(join(root, 'react-a', 'angular.json'), '{}');
    expect(bundlerFiles(root, 'react-a', ['rollup', 'vite7']).sort()).toEqual(['README.md', 'old.config.mjs', 'package.json']);
    expect(bundlerFiles(root, 'react-a', ['rollup', 'angular']).sort()).toEqual(['README.md', 'angular.json', 'old.config.mjs', 'package.json']);
  });
});

describe('transplantPage', () => {
  const at = (path: string): string => Bun.spawnSync(['git', 'show', `HEAD:${path}`]).stdout.toString();
  const pages = ownHalves().filter((dir) => at(`${dir}/index.html`) !== '' && at(`${dir}/src/index.html`) !== '');
  const plain = (html: string) => html.replace(/^[ \t]*<base href="[^"]*" ?\/?>\n/gm, '').replace(/^[ \t]*<link rel="stylesheet" href="[^"]*">\n/gm, '').replace(/^[ \t]*<script type="module" src="[^"]*"><\/script>\n/gm, '');

  test.each(pages)('%s: the page made from its own src/index.html is the page it has', (dir) => {
    expect(transplantPage(at(`${dir}/index.html`), at(`${dir}/src/index.html`), at(`${dir}/src/index.html`))).toBe(at(`${dir}/index.html`));
  });

  test('a donor\'s page on another product keeps the donor\'s tags in their places and the product\'s own text', () => {
    for (const layer of ['react-', 'angular-']) {
      const donors = pages.filter((dir) => dir.startsWith(layer));
      for (const donor of donors) for (const own of ['calendly', 'superhuman']) {
        const made = transplantPage(at(`${donor}/index.html`), at(`${donor}/src/index.html`), at(`${layer}${own}/src/index.html`));
        expect(plain(made), `${donor} -> ${layer}${own}`).toBe(plain(at(`${layer}${own}/src/index.html`)));
        const tags = (html: string) => html.split('\n').filter((line) => /<base |<link rel="stylesheet" href="\.|type="module"/.test(line));
        expect(tags(made), `${donor} -> ${layer}${own}`).toEqual(tags(at(`${donor}/index.html`)));
      }
    }
  });

  test('a page whose structure the donor\'s tags cannot find is a throw naming the line', () => {
    expect(() => transplantPage('<head>\n<base href="./" />\n</head>\n', '<head>\n</head>\n', '<top>\n</top>\n')).toThrow('has no line `<head>` to put <base href="./" /> after');
  });
});
