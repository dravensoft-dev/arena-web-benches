// What the bundler does not move: the sprite.
import { cpSync, readdirSync } from 'node:fs';

for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}
