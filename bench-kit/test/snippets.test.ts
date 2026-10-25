import { describe, expect, test } from 'bun:test';
import { occurrences, removeSnippet, replaceSnippet, requireSnippet } from '../src/snippets.ts';

const CONFIG = `export default {
  plugins: [
    emptyCss(),
    other(),
  ],
  output: {
    dir: 'dist',
    manualChunks: (id) => (id.includes('/x/') ? 'arena' : undefined),
    entryFileNames: '[name]-[hash].js',
  },
};
`;

const OUTPUT = `manualChunks: (id) => (id.includes('/x/') ? 'arena' : undefined),
entryFileNames: '[name]-[hash].js',`;

describe('a snippet is found by its lines, whatever the indentation', () => {
  test('the page writes it at its own indentation and the config holds it deeper', () => {
    expect(occurrences(CONFIG, OUTPUT)).toBe(1);
    expect(occurrences(CONFIG, 'emptyCss(),')).toBe(1);
  });

  test('a snippet whose lines are not consecutive in the config is absent', () => {
    expect(occurrences(CONFIG, "manualChunks: (id) => (id.includes('/x/') ? 'arena' : undefined),\ndir: 'dist',")).toBe(0);
  });
});

describe('removeSnippet and replaceSnippet', () => {
  test('remove the whole lines and nothing else', () => {
    expect(removeSnippet(CONFIG, 'output', OUTPUT)).toBe(CONFIG.replace(/ {4}manualChunks[^\n]*\n {4}entryFileNames[^\n]*\n/, ''));
    expect(removeSnippet(CONFIG, 'empty-css', 'emptyCss(),')).not.toContain('emptyCss');
  });

  test('replace puts the replacement where the lines were', () => {
    expect(replaceSnippet(CONFIG, 'empty-css', 'emptyCss(),', '    mine(),\n')).toContain('    mine(),\n    other(),');
  });

  test('a snippet the config does not hold throws, naming it', () => {
    expect(() => removeSnippet(CONFIG, 'groups', 'codeSplitting: {}')).toThrow("snippet 'groups' is in the config 0 times, not once");
    expect(() => requireSnippet(`${CONFIG}${CONFIG}`, 'twice', 'emptyCss(),', 'rollup.config.mjs')).toThrow("snippet 'twice' is in rollup.config.mjs 2 times, not once");
  });
});
