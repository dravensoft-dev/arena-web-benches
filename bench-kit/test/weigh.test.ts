import { afterAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliKB, changedKB, loaded, stem } from '../src/weigh.ts';

const made: string[] = [];
const dir = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'weigh-'));
  made.push(root);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true });
    writeFileSync(join(root, name), text);
  }
  return root;
};
afterAll(() => made.forEach((p) => rmSync(p, { recursive: true, force: true })));

// text a compressor cannot shrink to nothing
const body = Array.from({ length: 400 }, (_, i) => `export const v${i} = ${(i * 7919) % 10007};`).join('\n');

describe('stem', () => {
  test('names the file before its hash', () => {
    expect(stem('arena-3fa9c1.js')).toBe('arena');
    expect(stem('main-ABCD1234.js')).toBe('main');
    expect(stem('index.3fa9c1.js')).toBe('index');
    expect(stem('app.js')).toBe('app');
  });
  test('reads base64url hashes holding - and _', () => {
    expect(stem('index-Ab-cD_12.js')).toBe('index');
    expect(stem('index-CxXz9_-B.js')).toBe('index');
    expect(stem('index-C-Xz9_aB.js')).toBe('index');
    expect(stem('my-component.js')).toBe('my-component');
  });
});

describe('brotliKB', () => {
  test('a dictionary of the same bytes makes the file nearly free', () => {
    const bytes = new TextEncoder().encode(body);
    expect(brotliKB(bytes)).toBeGreaterThan(0.5);
    expect(brotliKB(bytes, bytes)).toBeLessThan(0.1);
  });
});

describe('loaded', () => {
  test('lists every file of the extension, relative and sorted', () => {
    const out = dir({ 'b-1a2b3c.js': 'x', 'assets/a-1a2b3c.js': 'y', 'a.css': 'z', 'sub/readme.txt': 'n' });
    expect(loaded(out, '.js')).toEqual(['assets/a-1a2b3c.js', 'b-1a2b3c.js']);
    expect(loaded(out, '.css')).toEqual(['a.css']);
  });
});

describe('changedKB', () => {
  test('identical outputs change nothing', () => {
    const a = dir({ 'main-3fa9c1.js': body });
    const b = dir({ 'main-3fa9c1.js': body });
    expect(changedKB(a, b)).toEqual({ plain: 0, dictionary: 0 });
  });
  test('a renamed identical file costs plain and almost nothing with a dictionary', () => {
    const a = dir({ 'main-3fa9c1.js': body });
    const b = dir({ 'main-9d8e7f.js': body });
    const r = changedKB(a, b);
    expect(r.plain).toBeGreaterThan(0.5);
    expect(r.dictionary).toBeLessThan(0.1);
  });
  test('a renamed file with a base64url hash pairs with its predecessor', () => {
    const a = dir({ 'assets/index-CxXz9_-B.js': body });
    const b = dir({ 'assets/index-C-Xz9_aB.js': body });
    expect(changedKB(a, b).dictionary).toBeLessThan(0.1);
  });
  test('two predecessors tied on the name pair with nothing', () => {
    const a = dir({ 'index-Ab12cd34.js': body, 'index-Ab12cd35.js': body });
    const b = dir({ 'index-Zz99yy88.js': body });
    const r = changedKB(a, b);
    expect(r.dictionary).toBe(r.plain);
  });
  test('an unpaired file counts whole', () => {
    const a = dir({ 'main-3fa9c1.js': body });
    const b = dir({ 'main-3fa9c1.js': body, 'extra-aaaa11.js': body });
    const r = changedKB(a, b);
    expect(r.dictionary).toBe(r.plain);
  });
});
