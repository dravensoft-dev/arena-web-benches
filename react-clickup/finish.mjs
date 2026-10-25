// What the bundler does not move: the sprite, and the page, which it does not write.
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}

const files = readdirSync('dist');
const script = files.find((name) => /^(main|entry)-.*\.js$/.test(name));
if (!script) throw new Error('no main-*.js or entry-*.js in dist');
const links = files.filter((name) => name.endsWith('.css')).map((name) => `<link rel="stylesheet" href="./${name}">\n`).join('');
const scripts = `<script type="module" src="./${script}"></script>`;
let html = readFileSync('src/index.html', 'utf8');
const tag = /<script\s+type="module"\s+src="[^"]*"\s*><\/script>/;
if (!tag.test(html)) throw new Error('src/index.html has no module script to point at the entry');
html = html.replace(tag, () => scripts);
html = html.replace('</head>', () => `${links}${scripts}\n  </head>`);
writeFileSync('dist/index.html', html);
