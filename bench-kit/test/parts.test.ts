import { describe, expect, test } from 'bun:test';
import { checkSnippets, configOf } from '../src/runner.ts';
import type { Part } from '../src/runner.ts';
import { requireSnippet } from '../src/snippets.ts';
import type { Layer } from '../src/types.ts';
import { REFERENCE as BUN, SNIPPETS as BUN_SNIPPETS, bunPart, template as bunTemplate } from '../parts/bun.ts';
import { REFERENCE as ESBUILD, SNIPPETS as ESBUILD_SNIPPETS, esbuildPart, template as esbuildTemplate } from '../parts/esbuild.ts';
import { readFileSync } from 'node:fs';

/** The parts of the bundlers no half carries in rotation 0: a rotation installs one into the half it assigns, with its reference config. */
const PARTS = [
  { name: 'bun', make: bunPart, reference: BUN, snippets: BUN_SNIPPETS, template: bunTemplate },
  { name: 'esbuild', make: esbuildPart, reference: ESBUILD, snippets: ESBUILD_SNIPPETS, template: esbuildTemplate },
] as const;

const LAYERS: Layer[] = ['react', 'angular'];

const PINS = (JSON.parse(readFileSync(new URL('../../bundlers.json', import.meta.url), 'utf8')) as { pins: Record<string, string> }).pins;

describe.each(PARTS)('the $name part', ({ name, make, reference, snippets, template }) => {
  describe.each(LAYERS)('on %s', (layer) => {
    const part: Part = make(layer);
    const { file, text } = reference[layer];

    test('names the config file its reference is, and holds every snippet in it exactly once', () => {
      expect(part.bundler).toBe(name);
      expect(part.config).toBe(file);
      expect(part.snippets).toEqual(snippets[layer]);
      expect(() => checkSnippets(part, text)).not.toThrow();
    });

    test('rewrites the reference for each variant that is not the recipe, or leaves it as the page has no config for it', () => {
      for (const variant of Object.keys(part.variants) as (keyof Part['variants'])[]) {
        const rewritten = configOf(part, variant, text);
        const identity = variant === 'plain' || variant === 'twice';
        expect(rewritten === text, `${name} ${layer} ${variant}`).toBe(identity);
      }
    });

    test('a snippet the config lacks is a throw naming it: the reference with that snippet\'s line out', () => {
      for (const [key, snippet] of Object.entries(part.snippets)) {
        const without = text.split('\n').filter((line) => line.trim() !== snippet).join('\n');
        expect(without).not.toBe(text);
        expect(() => checkSnippets(part, without)).toThrow(`snippet '${key}' is in ${file} 0 times`);
      }
    });

    test('its template carries the config, the scripts, the devDependencies at the pins, the measure.ts of the part, a README and a .gitignore', () => {
      const made = template(layer, PINS);
      expect(made.files[file === 'package.json' ? 'finish.mjs' : file]).toBeString();
      if (file !== 'package.json') expect(made.files[file]).toBe(text);
      for (const need of ['measure.ts', 'README.md', '.gitignore', 'finish.mjs']) expect(made.files[need], need).toBeString();
      expect(made.files['README.md']).toContain('{{dir}}');
      expect(made.scripts['bundle']).toBeString();
      expect(made.scripts['build']).toBe(layer === 'angular' ? 'bun run compile && bun run bundle && bun run finish' : 'bun run bundle && bun run finish');
      if (name === 'bun' && layer === 'react') expect(made.scripts['bundle']).toBe('bun build ./src/index.html --outdir dist --minify');
      if (name === 'esbuild') expect(made.devDependencies['esbuild']).toBe(PINS['esbuild']);
      if (layer === 'angular') {
        expect(made.devDependencies['@babel/core']).toBe(PINS['@babel/core']);
        expect(made.files['entry.js']).toContain('./.ngc/src/main.js');
        expect(made.scripts['compile']).toContain('ngc -p tsconfig.app.json');
      }
      const measure = made.files['measure.ts']!;
      expect(measure).toContain(`bundler: '${name}'`);
      for (const o of part.observations.filter((one) => one.layers.includes(layer))) expect(measure, o.id).toContain(o.id.endsWith('.sprite-not-copied') ? `noSprite_('${name}'` : `'${o.id}'`);
      // the config the part rewrites is the one in the template, with every snippet of the part in it exactly once
      if (file !== 'package.json') expect(() => checkSnippets(part, made.files[file]!)).not.toThrow();
      for (const [key, snippet] of Object.entries(part.snippets)) expect(measure, key).toContain(JSON.stringify(snippet).slice(1, -1));
    });

    test('carries the rows of its page that apply to the layer, each with the runs it reads', () => {
      const rows = part.observations.filter((o) => o.layers.includes(layer));
      expect(rows.map((o) => o.id)).toEqual(name === 'bun'
        ? ['bun.no-js-apart', 'bun.one-css', 'bun.outdir-kept', 'bun.sprite-not-copied']
        : ['esbuild.no-js-apart', 'esbuild.one-css', ...(layer === 'angular' ? ['esbuild.ng-dev-mode'] : [])]);
      for (const o of rows) for (const need of o.needs) expect(need === 'recipe' || need in part.variants, `${o.id} needs ${need}`).toBe(true);
    });

    test('its reference is syntax a runtime reads', () => {
      if (file.endsWith('.json')) JSON.parse(text);
      else new Bun.Transpiler({ loader: 'js' }).transformSync(text);
    });
  });
});

describe('the Angular reference of esbuild', () => {
  test('without the define line, the config is the same but for it', () => {
    const part = esbuildPart('angular');
    const without = configOf(part, 'no-define', ESBUILD.angular.text);
    expect(without).not.toContain('ngDevMode');
    expect(ESBUILD.angular.text.split('\n').length - without.split('\n').length).toBe(1);
  });
});

describe('the Angular parts run ngc first, the React ones do not', () => {
  test.each([bunPart, esbuildPart])('%p', (make) => {
    expect(make('angular').compile).toBe(true);
    expect(make('react').compile).toBeUndefined();
  });
});
