import type { BundlerId, Layer } from '../../bench-kit/src/types.ts';

export type { BundlerId, Layer };

export type Product = { product: string; label: string; skin: string; react: string; angular: string };

export type Table = {
  rotation: number;
  arenaSource: string;
  order: BundlerId[];
  mixed: { react: BundlerId; angular: BundlerId };
  products: Product[];
  pins: Record<string, string>;
};
