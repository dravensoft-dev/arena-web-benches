import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { compileAot, NGC_OUT } from '../angular-link.ts';
import { angularPage, pointedPage, rootOf, run } from './common.ts';

const STAGE = '.bundler.parcel';

/** The local transformer that runs the Angular linker (the benches' own plugin, F5). */
const LINKER = resolve(import.meta.dirname, '..', 'parcel-transformer-angular-linker', 'index.cjs');

/**
 * parcel.md's two options ("How do I keep Arena's JS in a bundle of its own?"), as the page gives them: both sit
 * in `package.json`, and the page gives no JS-only config apart from them, so there is no `js-recipe` (R7-1 does not
 * apply). `<your entry>` is the page `src/index.html`.
 */
const manual = (layer: Layer): string => `"@parcel/bundler-default": {
    "manualSharedBundles": [
      { "name": "arena", "root": "src/index.html", "assets": ["**/node_modules/@dravensoft/arena-${layer}/**"] }
    ]
  }`;
const PACKAGE_EXPORTS = `"@parcel/resolver-default": { "packageExports": true }`;

/** Parcel takes no CSS through its recipe (it stops on the package sheet's first `@import`): every `.css` is an empty asset. */
const EMPTY_CSS = `const { Transformer } = require('@parcel/plugin');
module.exports = new Transformer({
  async transform({ asset }) {
    asset.setCode('');
    return [asset];
  },
});
`;

/**
 * Parcel finds its options in the `package.json` of the project root and matches `assets` globs against paths below
 * it, and a half's `package.json` is tracked while its Arena package is a link into the root's store. So the build runs
 * in `.bundler.parcel/`, an ignored directory of its own: a copy of `src/`, the half's dependencies with Arena's
 * package copied in (a link resolves to a path outside the project, which no glob matches), and the page's options.
 */
function stage(dir: string, layer: Layer, variant: 'plain' | 'recipe' | Probe): string {
  const root = join(dir, STAGE);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, 'node_modules', '@dravensoft'), { recursive: true });
  cpSync(join(dir, 'src'), join(root, 'src'), { recursive: true });
  // An Angular half is bundled from what `ngc` compiled: its modules sit beside the sheets, and the page links both.
  if (layer === 'angular') {
    cpSync(join(dir, NGC_OUT, 'src'), join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'index.html'), angularPage(dir, 'main.js', ['styles.css']));
  }
  for (const name of readdirSync(join(dir, 'node_modules'))) {
    if (name !== '@dravensoft') symlinkSync(realpathSync(join(dir, 'node_modules', name)), join(root, 'node_modules', name));
  }
  const arena = join(dir, 'node_modules', '@dravensoft', `arena-${layer}`);
  cpSync(realpathSync(arena), join(root, 'node_modules', '@dravensoft', `arena-${layer}`), { recursive: true });
  // The lockfile marks the project root, which Parcel would otherwise take from the benches' `.git`.
  writeFileSync(join(root, 'package-lock.json'), '{}\n');

  const half = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  // `plain` is the defaults with only what Arena's first import needs to resolve at all; `recipe` adds the shared bundle.
  const options = [variant === 'recipe' || variant === 'no-package-exports' ? manual(layer) : '', variant === 'no-package-exports' ? '' : PACKAGE_EXPORTS].filter(Boolean);
  writeFileSync(join(root, 'package.json'), `{\n  "private": true,\n  "dependencies": ${JSON.stringify(half.dependencies ?? {})}${options.map((text) => `,\n  ${text}`).join('')}\n}\n`);

  // The default config is read from the Parcel package's own store directory, a path `extends` takes only as a file.
  const defaults = join(dirname(realpathSync(join(rootOf(dir), 'node_modules', 'parcel'))), '@parcel', 'config-default', 'index.json');
  const transformers: Record<string, string[]> = {};
  if (variant !== 'css-import') {
    writeFileSync(join(root, 'empty-css.cjs'), EMPTY_CSS);
    transformers['*.css'] = ['./empty-css.cjs'];
  }
  // The linker runs on every JS asset (a local transformer, `@parcel/plugin`); `...` keeps Parcel's own.
  if (layer === 'angular') transformers['*.{js,mjs}'] = [relative(root, LINKER), '...'];
  writeFileSync(join(root, '.parcelrc'), JSON.stringify({ extends: relative(root, defaults), transformers }));
  return root;
}

type Probe = 'css-import' | 'no-package-exports';

const driver: Driver = {
  id: 'parcel',
  layers: ['react', 'angular'],
  out: 'dist',
  probes: ['no-package-exports', 'css-import'],
  linksSheets: true,
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    let compiled = '';
    if (layer === 'angular') {
      const aot = compileAot(dir);
      if (!aot.ok) return { ok: false, out, log: aot.log };
      compiled = aot.log;
    }
    const root = stage(dir, layer, variant as 'plain' | 'recipe' | Probe);
    const parcel = join(rootOf(dir), 'node_modules', 'parcel', 'lib', 'bin.js');
    // Workers load a local plugin by a path they cannot resolve ("options.packageManager.resolve is not a function"), so one process builds.
    const built = run(root, 'node', [parcel, 'build', 'src/index.html', '--dist-dir', resolve(out), '--public-url', './', '--no-cache', '--no-source-maps', '--no-autoinstall'], { PARCEL_WORKERS: '0', NODE_ENV: 'production' });
    if (!built.ok) return { ok: false, out, log: compiled + built.log };
    // Parcel minifies the page and drops its `</head>` and the quotes of the base; the half's own page takes the module scripts Parcel wrote.
    const page = join(out, 'index.html');
    const scripts = [...readFileSync(page, 'utf8').matchAll(/<script type=module src=([^ >]+)><\/script>/g)].map((match) => match[1]!);
    if (scripts.length === 0) return { ok: false, out, log: `${compiled}${built.log}\nno module script in ${page}` };
    writeFileSync(page, layer === 'angular' ? angularPage(dir, scripts) : pointedPage(dir, scripts));
    return { ok: true, out, log: compiled + built.log };
  },
};

export default driver;
