/* Needs the kit's own install (`bun install` in bench-kit): the linker is `@angular/compiler-cli`'s. */

import { expect, test } from 'bun:test';
import { dirname } from 'node:path';
import { linkPartial } from '../src/angular-link.ts';

const kit = dirname(import.meta.dir);

const PARTIAL = `import * as i0 from '@angular/core';
export class Greeter {}
Greeter.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: '12.0.0', version: '22.1.4', ngImport: i0, type: Greeter, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
`;

test('linkPartial links a partially compiled module and returns null for a plain one', () => {
  expect(PARTIAL).toContain('ɵɵngDeclare');
  const linked = linkPartial(PARTIAL, `${kit}/node_modules/lib/index.mjs`, kit);
  expect(linked).toBeString();
  expect(linked).not.toContain('ɵɵngDeclare');
  expect(linked).toContain('Greeter_Factory');
  expect(linkPartial('export const answer = 42;\n', `${kit}/node_modules/plain/index.mjs`, kit)).toBeNull();
});
