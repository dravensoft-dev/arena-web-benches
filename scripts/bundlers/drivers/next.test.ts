import { afterAll, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { scratch } from '../scratch.ts';
import { driverContract, halfOf } from './contract.ts';
import driver from './next.ts';

// Next takes the CSS imports itself and links its own sheets from the page: `linkSheets` has nothing to do.
driverContract(driver, false, (_layer, built) => {
  const page = readFileSync(join(built.out, 'index.html'), 'utf8');
  // Review Focus 1: `assetPrefix: './'` keeps every chunk relative; a rooted `/_next/` loads nothing below the half's route.
  expect(page).not.toContain('"/_next/');
  expect(page).toContain('<base href="./"');
});

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

const status = (): string => spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout;
const tsconfig = (dir: string): string | null => (existsSync(join(dir, 'tsconfig.json')) ? readFileSync(join(dir, 'tsconfig.json'), 'utf8') : null);

test('next writes nothing into the benches tree and leaves the half\'s tsconfig.json as it is', () => {
  const half = halfOf(driver, 'react');
  const before = status();
  const path = scratch(half, 'drv-next-clean', 'none');
  made.push(path);
  const built = driver.bundle(path, 'react', 'recipe');
  if (!built.ok) throw new Error(`next recipe on ${half} failed:\n${built.log}`);
  expect(status()).toBe(before);
  expect(tsconfig(path)).toBe(tsconfig(half));
  // Next installs TypeScript into a project that names a tsconfig or has `.ts` in `app/`, and rewrites its package.json.
  expect(readFileSync(join(path, 'package.json'), 'utf8')).toBe(readFileSync(join(half, 'package.json'), 'utf8'));
});
