import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves } from '../build.ts';
import { held } from './rotation.ts';
import type { Table } from './types.ts';

/** The version `node_modules/<pkg>` holds under `root`, following the links; `bun` is the running binary. */
export function installedVersion(pkg: string, root = '.'): string | null {
  if (pkg === 'bun') return Bun.version;
  const file = join(root, 'node_modules', pkg, 'package.json');
  if (!existsSync(file)) return null;
  return (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version;
}

/** The pin of `name` for the half whose bundler is `bundler`: the Vite 7 half declares `vite` itself, at the pin the table keeps as `vite7`. */
export const pinFor = (t: Table, bundler: string, name: string): string | undefined => (name === 'vite' && bundler === 'vite7' ? t.pins['vite7'] : t.pins[name]);

/**
 * One line per package that a half declares, that the table pins, and whose version in the half's own `node_modules` is
 * not the pinned one; `bun` is the running binary against its pin. A half that is not there has declared nothing.
 */
export function pinProblems(t: Table, root = '.'): string[] {
  const problems: string[] = [];
  if (t.pins['bun'] !== undefined && installedVersion('bun') !== t.pins['bun']) problems.push(`bun: pinned ${t.pins['bun']}, installed ${installedVersion('bun')}`);
  for (const { dir } of halves(t.products)) {
    const manifest = join(root, dir, 'package.json');
    if (!existsSync(manifest)) continue;
    const { dependencies, devDependencies } = JSON.parse(readFileSync(manifest, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const bundler = held(root, dir) ?? '';
    for (const name of Object.keys({ ...dependencies, ...devDependencies })) {
      const pinned = pinFor(t, bundler, name);
      if (pinned === undefined) continue;
      const found = installedVersion(name, join(root, dir));
      if (found !== pinned) problems.push(`${dir}: ${name}: pinned ${pinned}, installed ${found ?? 'nothing'}`);
    }
  }
  return problems;
}
