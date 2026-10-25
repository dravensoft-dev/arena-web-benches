import type { BundlerId, Layer } from '../../bench-kit/src/types.ts';

export type { BundlerId, Layer };

export type Product = { product: string; label: string; skin: string; react: string; angular: string };

/** What one half of a product builds with: the two layers of an entry may differ (Next.js with the Angular builder). */
export type Entry = { name: string; react: BundlerId; angular: BundlerId };

export type Table = {
  arenaSource: string;
  entries: Entry[];
  products: Product[];
  pins: Record<string, string>;
};

/** A run's draw: the entry each product builds with, and the entries the draw left out. The seed reproduces it. */
export type Assignment = { seed: number; entries: Record<string, string>; leftOut: string[] };
