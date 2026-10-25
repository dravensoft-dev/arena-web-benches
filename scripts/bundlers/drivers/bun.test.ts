import { afterAll, expect, test } from 'bun:test';
import { appendFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { scratch } from '../../../bench-kit/src/scratch.ts';
import { driverContract, halfOf } from './contract.ts';
import driver from './bun.ts';

driverContract(driver);

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

for (const layer of ['react', 'angular'] as const) {
  test(`bun twice into one outdir leaves both entry files on the ${layer} half, and recipe clears the outdir`, () => {
    const path = scratch(halfOf(driver, layer), `drv-bun-twice-check-${layer}`, 'none');
    made.push(path);
    expect(driver.bundle(path, layer, 'recipe').ok).toBe(true);
    appendFileSync(join(path, layer === 'react' ? 'src/Main.tsx' : 'src/main.ts'), "\n(globalThis as any).__appMarker = 'changed';\n");
    const second = driver.bundle(path, layer, 'twice');
    expect(second.ok).toBe(true);
    const entries = () => readdirSync(second.out).filter((name) => (layer === 'react' ? /^index-.*\.js$/ : /^main-.*\.js$/).test(name));
    expect(entries()).toHaveLength(2);
    expect(driver.bundle(path, layer, 'recipe').ok).toBe(true);
    expect(entries()).toHaveLength(1);
  });
}
