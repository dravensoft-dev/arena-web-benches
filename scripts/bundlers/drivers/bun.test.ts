import { afterAll, expect, test } from 'bun:test';
import { appendFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { scratch } from '../scratch.ts';
import { driverContract, halfOf } from './contract.ts';
import driver from './bun.ts';

// `bun build` takes the CSS imports itself and links the one `.css` from the page it writes: `linkSheets` has nothing to do.
driverContract(driver, false);

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

test('bun twice into one outdir leaves both entry files, and recipe clears the outdir', () => {
  const path = scratch(halfOf(driver, 'react'), 'drv-bun-twice-check', 'none');
  made.push(path);
  expect(driver.bundle(path, 'react', 'recipe').ok).toBe(true);
  appendFileSync(join(path, 'src/Main.tsx'), "\n(globalThis as any).__appMarker = 'changed';\n");
  const second = driver.bundle(path, 'react', 'twice');
  expect(second.ok).toBe(true);
  const entries = () => readdirSync(second.out).filter((name) => /^index-.*\.js$/.test(name));
  expect(entries()).toHaveLength(2);
  expect(driver.bundle(path, 'react', 'recipe').ok).toBe(true);
  expect(entries()).toHaveLength(1);
});
