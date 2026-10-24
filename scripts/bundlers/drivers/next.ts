import { readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { rootOf, node } from './common.ts';

// Next installs TypeScript into the project, and writes its package.json, tsconfig.json and a type file, once it sees a
// tsconfig or a `.ts` file in `app/`; a tsconfig it is pointed at must exist, and then it installs too. So `app/` holds
// `.jsx`, no tsconfig is named, and the half's `.tsx` is compiled by Turbopack without a type check.

/** next.md names no config: this is the minimum for a static export that a bench serves from a directory (brief, task 8). */
const NEXT_CONFIG = `const config = {
  output: 'export',
  assetPrefix: './',
  images: { unoptimized: true },
};
export default config;
`;

/** `app/layout.jsx`: the `<head>` of `src/index.html` (base, title, the theme script; Next writes the charset and viewport metas itself) and the `<html>` attributes. */
function layout(dir: string): string {
  const html = readFileSync(join(dir, 'src', 'index.html'), 'utf8');
  const htmlTag = html.match(/<html([^>]*)>/)?.[1] ?? '';
  const attr = (name: string): string => htmlTag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (script === undefined) throw new Error('src/index.html has no inline theme script');
  return `export default function RootLayout({ children }) {
  return (
    <html lang=${JSON.stringify(attr('lang'))} className=${JSON.stringify(attr('class'))}>
      <head>
        <base href="./" />
        <title>${title}</title>
        <script dangerouslySetInnerHTML={{ __html: ${JSON.stringify(script)} }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
}

/** `app/page.jsx`: the mount point the entry looks for, and the entry imported on the client once the page is there. */
const PAGE = `'use client';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    void import('../src/Main.tsx');
  }, []);
  return <div id="root" />;
}
`;

const driver: Driver = {
  id: 'next',
  layers: ['react'],
  out: 'out',
  probes: [],
  bundle(dir: string, layer: Layer) {
    const out = join(dir, 'out');
    rmSync(out, { recursive: true, force: true });
    rmSync(join(dir, '.next'), { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: 'next builds the React layer only' };
    mkdirSync(join(dir, 'app'), { recursive: true });
    writeFileSync(join(dir, 'app', 'layout.jsx'), layout(dir));
    writeFileSync(join(dir, 'app', 'page.jsx'), PAGE);
    writeFileSync(join(dir, 'next.config.mjs'), NEXT_CONFIG);
    const next = join(rootOf(dir), 'node_modules', 'next', 'dist', 'bin', 'next');
    const built = node(resolve(dir), [next, 'build'], { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' });
    return { ok: built.ok, out, log: built.log };
  },
};

export default driver;
