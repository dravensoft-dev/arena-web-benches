import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ADOPTER, RESULTS, TABLE, adopterManifest, baseProblems, builtWith, copyResults, halves, pinsDeclaredArena, products } from './build.ts';
import { current, table } from './bundlers/rotation.ts';

const HREF = /^(?:[A-Za-z0-9._-]+\/)+$/;

describe('adopterManifest', () => {
  const all = products();
  const built = current(table());
  const manifest = adopterManifest(all, '12.1.1', built, table().pins);

  test('names the site and the repository', () => {
    expect(manifest.name).toBe('web-benches');
    expect(manifest.arena).toBe('12.1.1');
    expect(manifest.repository).toBe('https://github.com/dravensoft-dev/arena-web-benches');
  });

  test('carries eight sections in bundlers.json order, one per product', () => {
    expect(all).toHaveLength(8);
    expect(manifest.sections.map(({ heading }) => heading)).toEqual(all.map(({ label }) => label));
  });

  test('links each section to the two layers, by directory, each naming the bundler and version its half holds', () => {
    for (const [at, { product }] of all.entries()) {
      const held = built.get(product)!;
      expect(manifest.sections[at]?.links).toEqual([
        { label: `React, built with ${builtWith(held.react, table().pins)}`, href: `${product}/react/` },
        { label: `Angular, built with ${builtWith(held.angular, table().pins)}`, href: `${product}/angular/` },
      ]);
    }
  });

  test('every bundler is named with the version bundlers.json pins for it', () => {
    const { pins } = table();
    expect(builtWith('vite7', pins)).toBe(`Vite ${pins['vite7']}`);
    expect(builtWith('vite8', pins)).toBe(`Vite ${pins['vite']}`);
    expect(builtWith('angular', pins)).toBe(`the Angular application builder ${pins['@angular/build']}`);
    for (const entry of table().entries) {
      for (const bundler of [entry.react, entry.angular]) expect(builtWith(bundler, pins)).not.toContain('undefined');
    }
  });

  test('every href is a directory Arena accepts', () => {
    for (const { links } of manifest.sections) {
      for (const { href } of links) expect(href).toMatch(HREF);
    }
  });

  test('the file on disk is what the function returns', () => {
    const onDisk = JSON.parse(readFileSync(ADOPTER, 'utf8')) as { arena: string };
    expect(onDisk).toEqual(adopterManifest(products(), onDisk.arena, current(table()), table().pins));
  });
});

test('a half pins the declared Arena from the registry or as its vendor tarball, and no other version', () => {
  const root = mkdtempSync(join(tmpdir(), 'benches-pin-'));
  try {
    writeFileSync(join(root, ADOPTER), JSON.stringify({ arena: '13.0.0' }));
    expect(pinsDeclaredArena('13.0.0', 'react', root)).toBe(true);
    expect(pinsDeclaredArena('file:../vendor/dravensoft-arena-angular-13.0.0.tgz', 'angular', root)).toBe(true);
    expect(pinsDeclaredArena('file:../vendor/dravensoft-arena-react-13.0.0.tgz', 'angular', root)).toBe(false);
    expect(pinsDeclaredArena('12.1.1', 'react', root)).toBe(false);
    expect(pinsDeclaredArena('^13.0.0', 'react', root)).toBe(false);
    expect(pinsDeclaredArena(undefined, 'react', root)).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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

describe('copyResults', () => {
  test('copies bundlers-results.json into the output when the root holds it, and says so', () => {
    const root = mkdtempSync(join(tmpdir(), 'build-results-'));
    try {
      mkdirSync(join(root, 'dist'));
      writeFileSync(join(root, RESULTS), '{"a":1}\n');
      expect(copyResults(root, 'dist')).toBe(true);
      expect(readFileSync(join(root, 'dist', RESULTS), 'utf8')).toBe('{"a":1}\n');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('copies nothing when there is none', () => {
    const root = mkdtempSync(join(tmpdir(), 'build-results-'));
    try {
      mkdirSync(join(root, 'dist'));
      expect(copyResults(root, 'dist')).toBe(false);
      expect(existsSync(join(root, 'dist', RESULTS))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('baseProblems', () => {
  test('accepts the relative base with double quotes, single quotes, or none where a bundler minifies the page', () => {
    for (const base of ['<base href="./" />', '<base href="./">', "<base href='./'>", '<base href=./>', '<base  href=./ />']) {
      expect(baseProblems('x/index.html', `<head>${base}</head>`)).toEqual([]);
    }
  });

  test('names a page with no base, a base at the root and a base into a subdirectory', () => {
    for (const head of ['', '<base href="/">', '<base href=/>', '<base href="./sub/">', '<base href=./sub/>', '<base href=.>']) {
      expect(baseProblems('x/index.html', `<head>${head}</head>`)).toHaveLength(1);
    }
  });
});
