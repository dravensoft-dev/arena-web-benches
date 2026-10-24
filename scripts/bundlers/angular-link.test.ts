import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { linkPartial } from './angular-link.ts';

// Read-only: the installed package of a half, and that half's own `@angular/compiler-cli`.
const half = 'angular-calendly';
const fesm = `${half}/node_modules/@dravensoft/arena-angular/fesm2022/dravensoft-arena-angular.mjs`;

test('linkPartial links the installed Arena Angular package and returns null for a plain module', () => {
  const source = readFileSync(fesm, 'utf8');
  expect(source).toContain('ɵɵngDeclare');
  const linked = linkPartial(source, fesm, half);
  expect(linked).toBeString();
  expect(linked).not.toContain('ɵɵngDeclare');
  expect(linked).toContain('ɵɵdefineComponent');
  expect(linkPartial('export const answer = 42;\n', `${half}/node_modules/plain/index.mjs`, half)).toBeNull();
});
