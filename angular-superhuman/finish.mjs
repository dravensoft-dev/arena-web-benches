// What Parcel does not move: the sprite and the app's own statics (`public/`).
import { cpSync, existsSync, readdirSync } from 'node:fs';

for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });
