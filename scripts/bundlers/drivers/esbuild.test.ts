import { afterAll, expect, test } from 'bun:test';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { scratch } from '../../../bench-kit/src/scratch.ts';
import { driverContract, halfOf } from './contract.ts';
import driver from './esbuild.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

driverContract(driver);

test('esbuild without the ngDevMode define emits a larger main chunk than the recipe', () => {
  const sizeOf = (variant: 'recipe' | 'no-define') => {
    const path = scratch(halfOf(driver, 'angular'), `drv-esbuild-size-${variant}`, 'none');
    made.push(path);
    const built = driver.bundle(path, 'angular', variant);
    expect(built.ok).toBe(true);
    return statSync(join(built.out, readdirSync(built.out).find((name) => /^main-.*\.js$/.test(name))!)).size;
  };
  expect(sizeOf('no-define')).toBeGreaterThan(sizeOf('recipe'));
});
