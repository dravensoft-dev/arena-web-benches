import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { ADOPTER, TABLE, adopterManifest, halves, products } from './build.ts';

const HREF = /^(?:[A-Za-z0-9._-]+\/)+$/;

describe('adopterManifest', () => {
  const all = products();
  const manifest = adopterManifest(all, '12.1.1');

  test('names the site and the repository', () => {
    expect(manifest.name).toBe('web-benches');
    expect(manifest.arena).toBe('12.1.1');
    expect(manifest.repository).toBe('https://github.com/dravensoft-dev/arena-web-benches');
  });

  test('carries eight sections in bundlers.json order, one per product', () => {
    expect(all).toHaveLength(8);
    expect(manifest.sections.map(({ heading }) => heading)).toEqual(all.map(({ label }) => label));
  });

  test('links each section to the two layers, by directory', () => {
    for (const [at, { product }] of all.entries()) {
      expect(manifest.sections[at]?.links).toEqual([
        { label: 'React', href: `${product}/react/` },
        { label: 'Angular', href: `${product}/angular/` },
      ]);
    }
  });

  test('every href is a directory Arena accepts', () => {
    for (const { links } of manifest.sections) {
      for (const { href } of links) expect(href).toMatch(HREF);
    }
  });

  test('the file on disk is what the function returns', () => {
    expect(JSON.parse(readFileSync(ADOPTER, 'utf8'))).toEqual(adopterManifest(products(), manifest.arena));
  });
});

describe('products and halves', () => {
  test('the table is bundlers.json', () => {
    expect(TABLE).toBe('bundlers.json');
    expect(products()[0]).toEqual({
      product: 'calendly', label: 'Calendly', skin: 'calendly',
      react: 'react-calendly', angular: 'angular-calendly',
    });
  });

  test('two halves per product, react first', () => {
    const all = halves(products());
    expect(all).toHaveLength(16);
    expect(all.slice(0, 2)).toEqual([
      { product: 'calendly', layer: 'react', dir: 'react-calendly' },
      { product: 'calendly', layer: 'angular', dir: 'angular-calendly' },
    ]);
  });
});
