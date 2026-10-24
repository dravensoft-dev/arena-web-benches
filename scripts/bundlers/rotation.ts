import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TABLE } from '../build.ts';
import type { BundlerId, Layer, Table } from './types.ts';

export function table(root = '.'): Table {
  return JSON.parse(readFileSync(join(root, TABLE), 'utf8')) as Table;
}

/** Product to the bundler of each layer: the mixed product is `products[r mod 8]`, the rest walk `order` from `7r`. */
export function assignment(t: Table, rotation = t.rotation): Map<string, Record<Layer, BundlerId>> {
  const mixed = t.products[rotation % t.products.length]!;
  const result = new Map<string, Record<Layer, BundlerId>>();
  let j = 0;
  for (const one of t.products) {
    if (one === mixed) {
      result.set(one.product, { react: t.mixed.react, angular: t.mixed.angular });
      continue;
    }
    const id = t.order[(7 * rotation + j) % t.order.length]!;
    result.set(one.product, { react: id, angular: id });
    j += 1;
  }
  return result;
}

export function assigned(t: Table, dir: string): { product: string; layer: Layer; bundler: BundlerId } {
  const found = assignment(t);
  for (const one of t.products) {
    for (const layer of ['react', 'angular'] as const) {
      if (one[layer] === dir) return { product: one.product, layer, bundler: found.get(one.product)![layer] };
    }
  }
  throw new Error(`no product holds the half ${dir}`);
}
