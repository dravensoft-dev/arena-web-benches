/* The Parcel part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `package.json` (where Parcel reads its options), and the claims the Parcel page makes. `bun run measure` builds each
 * variant at a scratch copy of this half and writes `bundlers-result.json`. */

import { SHEET_APART, builds, fails, jsRow, measureMain, reactWithApp, removeSnippet, row, sharedStem, sheetRow } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the Parcel page, verbatim: each is in `package.json` exactly once. */
export const SNIPPETS = {
  // parcel.md, "How do I keep Arena's JS in a bundle of its own?": the shared bundles, Arena's JS and the package sheet.
  manual: `"@parcel/bundler-default": {
  "manualSharedBundles": [
    { "name": "arena", "root": "src/index.html", "assets": ["**/node_modules/@dravensoft/arena-react/**"] },
    { "name": "arenapkg", "root": "src/index.html", "types": ["css"], "assets": ["**/src/arena.package.generated.css"] }
  ]
},`,
  // The same section: the resolver reads Arena's `exports` field only when told to.
  'package-exports': '"@parcel/resolver-default": { "packageExports": true },',
};

export const part: Part = {
  bundler: 'parcel',
  pin: 'parcel',
  arenaCopy: true,
  config: 'package.json',
  snippets: SNIPPETS,
  variants: {
    // The defaults with only what Arena's first import needs to resolve at all.
    plain: (config) => removeSnippet(config, 'manual', SNIPPETS.manual),
    'no-package-exports': (config) => removeSnippet(config, 'package-exports', SNIPPETS['package-exports']),
  },
  observations: [
    row({ id: 'parcel.needs-package-exports', bundler: 'parcel', layers: ['angular'], claim: 'an import of an Arena subpath, or Angular\'s `@angular/common/http`, fails without `packageExports: true`', needs: ['no-package-exports'], check: fails('no-package-exports') }),
    row({ id: 'parcel.first-import-resolves', bundler: 'parcel', layers: ['react'], claim: 'the first Arena import resolves through the package\'s `module` field without `packageExports`', needs: ['no-package-exports'], check: builds('no-package-exports') }),
    jsRow('parcel', '`manualSharedBundles` keeps Arena\'s JS apart once `packageExports` is on', false),
    sheetRow('parcel', SHEET_APART),
    row({ id: 'parcel.react-with-app', bundler: 'parcel', layers: ['react'], claim: 'React stays with the app', needs: ['recipe'], check: reactWithApp }),
    row({ id: 'parcel.shared-stem', bundler: 'parcel', claim: 'its two shared bundles share one name stem', needs: ['recipe'], check: sharedStem }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
