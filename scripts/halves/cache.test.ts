/* webpack's persistent cache is kept only while every output stays byte-identical with it and without it: one webpack
 * half is built in scratch copies with the kit's cache (cold, then warm over a changed app) and without, and the outputs
 * are compared file by file. Builds, so it is slow; it runs with the contract test. */

import { afterAll, expect, test } from 'bun:test';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { script } from '../../bench-kit/src/run.ts';
import { hasScript, withCache } from '../../bench-kit/src/runner.ts';
import { hold, scratch, scratchPath } from '../../bench-kit/src/scratch.ts';
import { held } from '../bundlers/rotation.ts';
import { ownHalves, partOf } from './halves.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

const dir = ownHalves().filter((one) => held('.', one) === 'webpack').sort()[0];

const files = (out: string): string[] => readdirSync(out, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name).slice(out.length)).sort();

test.skipIf(dir === undefined)('a webpack half builds the same bytes with the cache as without it, cold and warm', async () => {
  const part = await partOf(dir!);
  const config = readFileSync(join(dir!, part.config), 'utf8');
  const cache = resolve(scratchPath(dir!, 'cache-test'));
  made.push(cache);
  const building = scratchPath(dir!, 'm');
  made.push(building);
  const build = (mutation: 'none' | 'app-text', cached: boolean, tag: string): string => {
    scratch(dir!, 'm', mutation, '.');
    writeFileSync(join(building, part.config), cached ? withCache(part, config, cache) : config);
    if (hasScript(building, 'compile')) expect(script(building, 'compile').ok).toBe(true);
    const done = script(building, 'bundle');
    if (!done.ok) throw new Error(`${dir}: bundle failed:\n${done.log}`);
    const kept = hold(building, scratchPath(dir!, tag));
    made.push(kept);
    return join(kept, 'dist');
  };
  const same = (a: string, b: string) => {
    expect(files(a)).toEqual(files(b));
    for (const file of files(a)) expect(readFileSync(join(a, file)).equals(readFileSync(join(b, file))), file).toBe(true);
  };
  const plain = build('none', false, 'cache-plain');
  const plainText = build('app-text', false, 'cache-plain-text');
  same(plain, build('none', true, 'cache-cold'));
  same(plainText, build('app-text', true, 'cache-warm'));
  same(plain, build('none', true, 'cache-again'));
});
