// What rolldown does not move: the sheets the page links, the sprite, and the app's own statics (`public/`).
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';

const page = readFileSync('dist/index.html', 'utf8');
for (const [, sheet] of page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)) cpSync(`src/${sheet}`, `dist/${sheet}`);
for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });
