import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Table } from './types.ts';

/** The version `node_modules/<pkg>` holds under `root`, following the links; `bun` is the running binary. */
export function installedVersion(pkg: string, root = '.'): string | null {
  if (pkg === 'bun') return Bun.version;
  const file = join(root, 'node_modules', pkg, 'package.json');
  if (!existsSync(file)) return null;
  return (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version;
}

/** One line per pin whose installed version is not the pinned one. */
export function pinProblems(t: Table, root = '.'): string[] {
  return Object.entries(t.pins).flatMap(([pkg, pinned]) => {
    const found = installedVersion(pkg, root);
    return found === pinned ? [] : [`${pkg}: pinned ${pinned}, installed ${found ?? 'nothing'}`];
  });
}
