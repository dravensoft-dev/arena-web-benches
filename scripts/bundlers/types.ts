import type { BundlerId, Layer, Mutation, Probe } from '../../bench-kit/src/types.ts';

export type { BundlerId, Layer, Mutation, Probe };

export type Product = { product: string; label: string; skin: string; react: string; angular: string };

export type Table = {
  rotation: number;
  arenaSource: string;
  order: BundlerId[];
  mixed: { react: BundlerId; angular: BundlerId };
  products: Product[];
  pins: Record<string, string>;
};

export type Driver = {
  id: BundlerId;
  layers: Layer[];
  /** The output directory relative to the half, e.g. `dist`. */
  out: string;
  probes: Probe[];
  bundle(dir: string, layer: Layer, variant: 'plain' | 'recipe' | Probe): { ok: boolean; out: string; log: string };
};
