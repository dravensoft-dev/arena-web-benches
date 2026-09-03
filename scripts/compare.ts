/* Two halves of a pair open at once, which is the whole reason there are two: both answer the same
 * markup from the same design/ directory, so anything that differs between them is Arena's and not
 * the app's. It serves the built tree and frames the pairs from benches.json, so a ninth pair is
 * written once. This is where the comparison lives; the published site lists the addresses and
 * embeds none of them, because a comparison view there is a second product. */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LAYERS, OUT, manifest } from './build.ts';

export const PORT = Number(process.env.PORT ?? 5100);

export const FRAME_HEIGHT = 720;

const escape = (text: string) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function comparePage(pairs: { product: string; label: string }[]) {
  const rows = pairs.map(({ product, label }) => `<section>
<h2>${escape(label)}</h2>
<div class="pair">
${LAYERS.map((layer) => `  <figure><figcaption>${layer}</figcaption>
  <iframe src="/${escape(product)}/${layer}/" title="${escape(label)}, ${layer}" loading="lazy"></iframe></figure>`).join('\n')}
</div>
</section>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pairs, arena-web-benches</title>
<style>
:root{color-scheme:light dark}
body{margin:0;padding:24px;font:14px/1.5 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}
p{margin:0 0 24px;opacity:.7}
h2{font-size:16px;margin:0 0 8px}
section{margin-bottom:40px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{margin:0;display:flex;flex-direction:column;gap:4px}
figcaption{font-size:12px;opacity:.7}
iframe{width:100%;height:${FRAME_HEIGHT}px;border:1px solid currentColor;border-radius:6px;background:#fff}
</style></head><body>
<h1>Pairs</h1>
<p>Each row is one product under both framework names, from one arena.config.json and one design
directory. A difference between two frames of a row is Arena answering the two layers differently.</p>
${rows}
</body></html>
`;
}

function main() {
  if (!existsSync(join(OUT, 'benches.json'))) {
    console.error(`compare: ${OUT}/ holds no built halves; run bun run build, which is what this serves`);
    process.exit(1);
  }
  const pairs = manifest(OUT).pairs.map(({ product, label }) => ({ product, label }));
  const page = comparePage(pairs);

  const server = Bun.serve({
    port: PORT,
    async fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === '/') return new Response(page, { headers: { 'content-type': 'text/html' } });
      const rel = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
      const file = Bun.file(join(OUT, rel));
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
    },
  });

  console.log(`compare: ${pairs.length} pair(s) on ${server.url}`);
}

if (import.meta.main) main();
