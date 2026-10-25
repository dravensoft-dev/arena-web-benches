// What the bundler does not move: the sprite and the app's own statics (`public/`), and the page, which it does not write.
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

for (const name of readdirSync('src')) {
  if (/^icons-.*\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);
}
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });

const files = readdirSync('dist');
const script = files.find((name) => /^(main|entry)-.*\.js$/.test(name));
if (!script) throw new Error('no main-*.js or entry-*.js in dist');
const links = files.filter((name) => name.endsWith('.css')).map((name) => `<link rel="stylesheet" href="./${name}">\n`).join('');
const scripts = `<script type="module" src="./${script}"></script>`;
let html = readFileSync('src/index.html', 'utf8');
const base = /<base\s+href="[^"]*"\s*\/?>/;
html = base.test(html) ? html.replace(base, () => '<base href="./" />') : html.replace('<head>', () => '<head>\n    <base href="./" />');
html = html.replace('</head>', () => `${links}${scripts}\n  </head>`);
writeFileSync('dist/index.html', html);
