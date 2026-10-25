import { describe, expect, test } from 'bun:test';
import { checkSnippets, configOf } from '../src/runner.ts';
import type { Part } from '../src/runner.ts';
import { requireSnippet } from '../src/snippets.ts';
import type { Layer } from '../src/types.ts';
import { REFERENCE as BUN, SNIPPETS as BUN_SNIPPETS, bunPart } from '../parts/bun.ts';
import { REFERENCE as ESBUILD, SNIPPETS as ESBUILD_SNIPPETS, esbuildPart } from '../parts/esbuild.ts';

/** The parts of the bundlers no half carries in rotation 0: a rotation installs one into the half it assigns, with its reference config. */
const PARTS = [
  { name: 'bun', make: bunPart, reference: BUN, snippets: BUN_SNIPPETS },
  { name: 'esbuild', make: esbuildPart, reference: ESBUILD, snippets: ESBUILD_SNIPPETS },
] as const;

const LAYERS: Layer[] = ['react', 'angular'];

describe.each(PARTS)('the $name part', ({ name, make, reference, snippets }) => {
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

    test('a snippet the config lacks is a throw naming it', () => {
      for (const [key, snippet] of Object.entries(part.snippets)) {
        expect(() => requireSnippet('', key, snippet, file)).toThrow(`snippet '${key}'`);
      }
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
