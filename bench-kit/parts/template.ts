/* What a half of a bundler no half holds yet is made from: the files, scripts and devDependencies a rotation installs
 * (`bun run rotate`), the same shape the files of a donor half make, so one code path swaps either. */

import type { Layer } from '../src/index.ts';

export type Template = {
  /** Files at the half's root, by name; `README.md` carries `{{dir}}`, `{{label}}`, `{{port}}`. */
  files: Record<string, string>;
  /** The bundler's scripts (`prebuild`, `compile`, `bundle`, `finish`, `build`, `measure`); the half keeps its dev scripts. */
  scripts: Record<string, string>;
  /** The bundler's own packages at the table's pins; the half keeps `@benches/kit`, `typescript` and the Angular packages. */
  devDependencies: Record<string, string>;
  /** Names the half keeps although they sit at its root (`tsconfig.json` on Angular). */
  keep: string[];
};

export const PREBUILD = 'arena build --src src --src design && arena audit --src src --src design --strict=audit && arena usage --src src --src design';

export const COMPILE = 'ngc -p tsconfig.app.json --outDir .ngc --rootDir . --sourceMap false';

export const MEASURE = 'bun run prebuild && bun measure.ts';

export const TSCONFIG_APP = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {},
  "include": ["src/**/*.ts"]
}
`;

/** The entry of an Angular half for a bundler that takes a JS file: what `Main.tsx` is to a React half. */
export const ENTRY = `import './.ngc/src/main.js';
import './src/styles.css';
`;

export const gitignore = (layer: Layer, compile: boolean): string => `node_modules
dist
${layer === 'angular' ? '.angular\n' : ''}${layer === 'angular' ? 'src/*.generated.css\nsrc/arena.icons.generated.ts\n' : 'src/arena.generated.css\nsrc/plugin.generated.css\nsrc/arena.package.generated.css\nsrc/arena.icons.generated.js\nsrc/arena.icons.generated.d.ts\n'}src/icons-*.svg
${compile ? '.ngc\n' : ''}bundlers-result.json
`;

/** `finish.mjs`: the sprite, an Angular half's `public/`, and, for a bundler that writes no page, the page linking what it wrote. */
export function finish(layer: Layer, page: boolean): string {
  const angular = layer === 'angular';
  const lines = [
    `// What the bundler does not move: the sprite${angular ? " and the app's own statics (`public/`)" : ''}${page ? ', and the page, which it does not write' : ''}.`,
    `import { cpSync, ${angular ? 'existsSync, ' : ''}readdirSync${page ? ', readFileSync, writeFileSync' : ''} } from 'node:fs';`,
    '',
    "for (const name of readdirSync('src')) {",
    '  if (/^icons-.*\\.svg$/.test(name)) cpSync(`src/${name}`, `dist/${name}`);',
    '}',
  ];
  if (angular) lines.push("if (existsSync('public')) cpSync('public', 'dist', { recursive: true });");
  if (page) {
    lines.push(
      '',
      "const files = readdirSync('dist');",
      'const script = files.find((name) => /^(main|entry)-.*\\.js$/.test(name));',
      "if (!script) throw new Error('no main-*.js or entry-*.js in dist');",
      "const links = files.filter((name) => name.endsWith('.css')).map((name) => `<link rel=\"stylesheet\" href=\"./${name}\">\\n`).join('');",
      'const scripts = `<script type="module" src="./${script}"></script>`;',
      "let html = readFileSync('src/index.html', 'utf8');",
    );
    if (layer === 'react') {
      lines.push(
        'const tag = /<script\\s+type="module"\\s+src="[^"]*"\\s*><\\/script>/;',
        "if (!tag.test(html)) throw new Error('src/index.html has no module script to point at the entry');",
        'html = html.replace(tag, () => scripts);',
      );
    } else {
      lines.push(
        'const base = /<base\\s+href="[^"]*"\\s*\\/?>/;',
        "html = base.test(html) ? html.replace(base, () => '<base href=\"./\" />') : html.replace('<head>', () => '<head>\\n    <base href=\"./\" />');",
      );
    }
    lines.push(
      "html = html.replace('</head>', () => `${links}${scripts}\\n  </head>`);",
      "writeFileSync('dist/index.html', html);",
    );
  }
  return `${lines.join('\n')}\n`;
}

export const readme = (layer: Layer, what: string): string => `# {{dir}}

The ${layer === 'react' ? 'React' : 'Angular'} half of the {{label}} bench, built with ${what}. It is an adopter of its bundler with an install of its own: \`package.json\` declares the bundler at an exact version, \`bun.lock\` holds it, and the Arena package comes from \`../vendor/\` until the registry carries the version.

\`\`\`bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, ${layer === 'angular' ? 'ngc, ' : ''}the bundler, then the sprite${layer === 'angular' ? ', public/' : ''} and the page into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
${layer === 'react' ? 'bun run dev            # the dev server on http://localhost:{{port}}' : 'bun run start          # ng serve on http://localhost:{{port}}, the Angular CLI\'s own dev flow'}
\`\`\`

\`measure.ts\` is this half's part of the measuring: the page's snippets verbatim, the variants as rewrites of the config, and the page's rows. A snippet the config does not hold throws, naming it. The shared machinery is [\`../bench-kit\`](../bench-kit), a \`file:\` dependency: after changing it, \`bun install\` in this half copies it again. The scratch copies the measuring builds sit at \`../.run-{{dir}}-*\` and are removed when it ends.
`;
