export type Layer = 'react' | 'angular';

export type BundlerId =
  | 'rollup'
  | 'vite7'
  | 'vite8'
  | 'rolldown'
  | 'webpack'
  | 'rspack'
  | 'parcel'
  | 'angular'
  | 'bun'
  | 'esbuild'
  | 'next';

export type Mutation = 'none' | 'app-text' | 'app-sheet' | 'arena-patch';

export type Probe =
  | 'css-import'
  | 'js-only-test'
  | 'js-recipe'
  | 'untyped-group'
  | 'no-css-auto'
  | 'no-extension-alias'
  | 'no-package-exports'
  | 'twice'
  | 'no-define';

/** The config a run builds: the half's committed config (`recipe`), the same without the page's recipe (`plain`), or a probe. */
export type Variant = 'plain' | 'recipe' | Probe;
