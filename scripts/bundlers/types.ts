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

export type Product = { product: string; label: string; skin: string; react: string; angular: string };

export type Table = {
  rotation: number;
  arenaSource: string;
  order: BundlerId[];
  mixed: { react: BundlerId; angular: BundlerId };
  products: Product[];
  pins: Record<string, string>;
};

export type Mutation = 'none' | 'app-text' | 'app-sheet' | 'arena-patch';
