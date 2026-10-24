import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installedVersion, pinProblems } from './pins.ts';
import { table } from './rotation.ts';
import type { Table } from './types.ts';

describe('pinProblems', () => {
  test('a pinned package that is not installed is named with the version it should have', () => {
    const empty = mkdtempSync(join(tmpdir(), 'pins-'));
    const t = { ...table(), pins: { 'left-pad': '9.9.9' } } as Table;
    expect(pinProblems(t, empty)).toEqual(['left-pad: pinned 9.9.9, installed nothing']);
  });

  test('the committed table matches what is installed', () => {
    expect(pinProblems(table())).toEqual([]);
  });

  test('the table pins the bun binary and every bundler of the rotation', () => {
    const pins = table().pins;
    expect(pins.bun).toBe('1.4.0');
    for (const p of ['vite7', 'vite', 'rollup', 'rolldown', 'webpack', '@rspack/core', 'parcel', 'esbuild', 'next', '@angular/build'])
      expect(pins[p]).toMatch(/^\d+\.\d+\.\d+$/);
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
