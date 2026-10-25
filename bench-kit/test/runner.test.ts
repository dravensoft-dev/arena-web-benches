import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixture } from './fixture.ts';
import { configOf, pinProblem, runMeasure, spec } from '../src/runner.ts';
import type { Part } from '../src/runner.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

const part = (variants: Part['variants']): Part => ({ bundler: 'rollup', pin: 'rollup', config: 'x.config.mjs', snippets: {}, variants, observations: [], compile: true });

/** An Angular half whose scripts only copy files, and count the `compile` runs in `<root>/compiles.log`. */
function half(declared = '1.0.0') {
  const holder = fixture('angular');
  made.push(holder.root);
  const fs = "require('fs')";
  const manifest = {
    name: holder.dir,
    devDependencies: { rollup: declared },
    scripts: {
      compile: `node -e "${fs}.appendFileSync('${holder.root}/compiles.log','x\\n'); ${fs}.mkdirSync('.ngc/src',{recursive:true}); ${fs}.writeFileSync('.ngc/src/main.js', ${fs}.readFileSync('src/main.ts','utf8'))"`,
      bundle: `node -e "${fs}.mkdirSync('dist',{recursive:true}); ${fs}.writeFileSync('dist/main.js', ${fs}.readFileSync('.ngc/src/main.js','utf8'))"`,
      finish: `node -e "${fs}.writeFileSync('dist/icons-abc.svg','<svg/>')"`,
    },
  };
  writeFileSync(join(holder.root, holder.dir, 'package.json'), JSON.stringify(manifest));
  return { ...holder, abs: join(holder.root, holder.dir) };
}

describe('spec', () => {
  test('names the mutation a run takes and the variant its config is', () => {
    expect(spec('plain')).toEqual({ mutation: 'none', variant: 'plain' });
    expect(spec('app-text')).toEqual({ mutation: 'app-text', variant: 'recipe' });
    expect(spec('plain:app-text')).toEqual({ mutation: 'app-text', variant: 'plain' });
    expect(spec('js-recipe:app-text')).toEqual({ mutation: 'app-text', variant: 'js-recipe' });
    expect(spec('css-import')).toEqual({ mutation: 'none', variant: 'css-import' });
  });
});

describe('configOf', () => {
  test('the recipe is the config as committed, a variant is the part\'s rewrite, and one the part lacks is a throw naming it', () => {
    const p = part({ plain: (text) => `${text}!` });
    expect(configOf(p, 'recipe', 'c')).toBe('c');
    expect(configOf(p, 'plain', 'c')).toBe('c!');
    expect(() => configOf(p, 'js-recipe', 'c')).toThrow("the rollup part carries no variant 'js-recipe'");
  });
});

describe('pinProblem', () => {
  test('is null when the install holds what the half declares, and says both otherwise', () => {
    const { abs } = half();
    expect(pinProblem(abs, 'rollup')).toBeNull();
    expect(pinProblem(half('2.0.0').abs, 'rollup')).toBe('rollup: declared 2.0.0, installed 1.0.0');
    expect(pinProblem(abs, 'webpack')).toBe('webpack: declared nothing, installed nothing');
  });
});

describe('runMeasure', () => {
  test('runs ngc once per distinct source: the app text is the one source that differs', async () => {
    const { abs, root } = half();
    const result = await runMeasure(abs, part({ plain: (text) => text }));
    expect(result.figures).not.toBeNull();
    expect(readFileSync(join(root, 'compiles.log'), 'utf8')).toBe('x\nx\n');
    expect(existsSync(join(abs, 'bundlers-result.json'))).toBe(true);
    expect(Bun.spawnSync(['ls', '-A', root]).stdout.toString().split('\n').filter((name) => name.startsWith('.run-'))).toEqual([]);
  });

  test('a variant the part lacks fails that run only: the result is written, with the figures null and the run named', async () => {
    const { abs } = half();
    const result = await runMeasure(abs, part({}));
    expect(result.figures).toBeNull();
    expect(result.figuresError).toContain("run 'plain' did not build");
    expect(result.figuresError).toContain("the rollup part carries no variant 'plain'");
    expect(JSON.parse(readFileSync(join(abs, 'bundlers-result.json'), 'utf8')).figuresError).toBe(result.figuresError);
  });
});
