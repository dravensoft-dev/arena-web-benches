import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { pointedPage, rootOf, run } from './common.ts';

const STAGE = '.bundler.parcel';

/**
 * parcel.md's two options ("How do I keep Arena's JS in a bundle of its own?"), as the page gives them: both sit
 * in `package.json`, and the page gives no JS-only config apart from them, so there is no `js-recipe` (R7-1 does not
 * apply). `<your entry>` is the page `src/index.html`.
 */
const MANUAL = `"@parcel/bundler-default": {
    "manualSharedBundles": [
      { "name": "arena", "root": "src/index.html", "assets": ["**/node_modules/@dravensoft/arena-react/**"] }
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
function stage(dir: string, variant: 'plain' | 'recipe' | Probe): string {
  const root = join(dir, STAGE);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, 'node_modules', '@dravensoft'), { recursive: true });
  cpSync(join(dir, 'src'), join(root, 'src'), { recursive: true });
  for (const name of readdirSync(join(dir, 'node_modules'))) {
    if (name !== '@dravensoft') symlinkSync(realpathSync(join(dir, 'node_modules', name)), join(root, 'node_modules', name));
  }
  const arena = join(dir, 'node_modules', '@dravensoft', 'arena-react');
  cpSync(realpathSync(arena), join(root, 'node_modules', '@dravensoft', 'arena-react'), { recursive: true });
  // The lockfile marks the project root, which Parcel would otherwise take from the benches' `.git`.
  writeFileSync(join(root, 'package-lock.json'), '{}\n');

  const half = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  // `plain` is the defaults with only what Arena's first import needs to resolve at all; `recipe` adds the shared bundle.
  const options = [variant === 'recipe' || variant === 'no-package-exports' ? MANUAL : '', variant === 'no-package-exports' ? '' : PACKAGE_EXPORTS].filter(Boolean);
  writeFileSync(join(root, 'package.json'), `{\n  "private": true,\n  "dependencies": ${JSON.stringify(half.dependencies ?? {})}${options.map((text) => `,\n  ${text}`).join('')}\n}\n`);

  if (variant !== 'css-import') {
    // The default config is read from the Parcel package's own store directory, a path `extends` takes only as a file.
    const defaults = join(dirname(realpathSync(join(rootOf(dir), 'node_modules', 'parcel'))), '@parcel', 'config-default', 'index.json');
    writeFileSync(join(root, 'empty-css.cjs'), EMPTY_CSS);
    writeFileSync(join(root, '.parcelrc'), JSON.stringify({ extends: relative(root, defaults), transformers: { '*.css': ['./empty-css.cjs'] } }));
  }
  return root;
}

type Probe = 'css-import' | 'no-package-exports';

const driver: Driver = {
  id: 'parcel',
  layers: ['react'],
  out: 'dist',
  probes: ['no-package-exports', 'css-import'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: `parcel builds no ${layer} half yet` };
    const root = stage(dir, variant as 'plain' | 'recipe' | Probe);
    const parcel = join(rootOf(dir), 'node_modules', 'parcel', 'lib', 'bin.js');
    // Workers load a local plugin by a path they cannot resolve ("options.packageManager.resolve is not a function"), so one process builds.
    const built = run(root, 'node', [parcel, 'build', 'src/index.html', '--dist-dir', resolve(out), '--public-url', './', '--no-cache', '--no-source-maps', '--no-autoinstall'], { PARCEL_WORKERS: '0', NODE_ENV: 'production' });
    if (!built.ok) return { ok: false, out, log: built.log };
    // Parcel minifies the page and drops its `</head>` and the quotes of the base; the half's own page takes the module scripts Parcel wrote.
    const page = join(out, 'index.html');
    const scripts = [...readFileSync(page, 'utf8').matchAll(/<script type=module src=([^ >]+)><\/script>/g)].map((match) => match[1]!);
    if (scripts.length === 0) return { ok: false, out, log: `${built.log}\nno module script in ${page}` };
    writeFileSync(page, pointedPage(dir, scripts));
    return { ok: true, out, log: built.log };
  },
};

export default driver;
