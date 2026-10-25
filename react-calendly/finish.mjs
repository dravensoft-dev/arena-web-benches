// What rollup does not move: the sheets the page links, and the sprite.
import { cpSync, readdirSync, readFileSync } from 'node:fs';

const page = readFileSync('dist/index.html', 'utf8');
for (const [, sheet] of page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)) cpSync(`src/${sheet}`, `dist/${sheet}`);
for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}
