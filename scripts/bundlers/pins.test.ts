import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'bun:test';
import { installedVersion, pinFor, pinProblems } from './pins.ts';
import { table } from './rotation.ts';
import type { Table } from './types.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

/** A benches root whose half `react-etsy` declares `rollup` and installs `installed` of it (nothing when null). */
function root(declared: string, installed: string | null): string {
  const dir = mkdtempSync(join(tmpdir(), 'pins-'));
  made.push(dir);
  mkdirSync(join(dir, 'react-etsy'), { recursive: true });
  writeFileSync(join(dir, 'react-etsy', 'package.json'), JSON.stringify({ devDependencies: { rollup: declared, 'left-pad': '1.0.0' } }));
  if (installed) {
    mkdirSync(join(dir, 'react-etsy', 'node_modules', 'rollup'), { recursive: true });
    writeFileSync(join(dir, 'react-etsy', 'node_modules', 'rollup', 'package.json'), JSON.stringify({ name: 'rollup', version: installed }));
  }
  return dir;
}

describe('pinProblems', () => {
  test('a pinned package a half declares and does not install is named with its half and the version it should have', () => {
    expect(pinProblems(table(), root('4.65.0', null))).toEqual(['react-etsy: rollup: pinned 4.65.0, installed nothing']);
  });

  test('a half whose install holds another version of a pinned package is named', () => {
    expect(pinProblems(table(), root('4.65.0', '4.64.0'))).toEqual(['react-etsy: rollup: pinned 4.65.0, installed 4.64.0']);
  });

  test('a package the table does not pin is not read, and an install that holds the pin is clean', () => {
    expect(pinProblems(table(), root('4.65.0', '4.65.0'))).toEqual([]);
  });

  test('the committed table matches what each half\'s own install holds', () => {
    expect(pinProblems(table())).toEqual([]);
  });

  test('the Vite 7 half declares `vite` at the pin the table keeps as vite7, the other halves at the pin of vite', () => {
    const t = table();
    expect(pinFor(t, 'vite7', 'vite')).toBe(t.pins['vite7']);
    expect(pinFor(t, 'vite8', 'vite')).toBe(t.pins['vite']);
    expect(pinFor(t, 'rollup', 'rollup')).toBe(t.pins['rollup']);
  });

  test('the table pins the bun binary and every bundler of the rotation', () => {
    const pins = table().pins;
    expect(pins.bun).toBe('1.4.0');
    for (const p of ['vite7', 'vite', 'rollup', 'rolldown', 'webpack', '@rspack/core', 'parcel', 'esbuild', 'next', '@angular/build'])
      expect(pins[p]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('a table that pins the running bun at another version names it', () => {
    const t = { ...table(), pins: { bun: '0.0.1' } } as Table;
    expect(pinProblems(t, '/nonexistent')).toEqual([`bun: pinned 0.0.1, installed ${Bun.version}`]);
  });
});

describe('installedVersion', () => {
  test('bun is the running binary', () => {
    expect(installedVersion('bun')).toBe(Bun.version);
  });
  test('an absent package is null', () => {
    expect(installedVersion('left-pad-nope')).toBeNull();
  });
});
