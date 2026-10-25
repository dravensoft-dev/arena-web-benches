import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { linkPartial } from '../../../bench-kit/src/angular-link.ts';

/** The `file:` URL of this module, for a config written into a half that imports its linker hooks from here. */
export const HOOKS_URL = pathToFileURL(import.meta.filename).href;

/** Where a file the linker may touch lives: any package of `node_modules`, and only `.js`/`.mjs`/`.cjs` of it. */
const LINKED = /[\\/]node_modules[\\/].*\.[cm]?js$/;

/** An esbuild or `Bun.build` plugin: its `onLoad` returns a linked module, and nothing for a file that carries no declaration. */
export function buildLinker(from: string) {
  return {
    name: 'bench-angular-linker',
    setup(build: { onLoad(options: { filter: RegExp }, callback: (args: { path: string }) => { contents: string; loader: 'js' } | undefined): void }) {
      build.onLoad({ filter: LINKED }, (args) => {
        const linked = linkPartial(readFileSync(args.path, 'utf8'), args.path, from);
        return linked === null ? undefined : { contents: linked, loader: 'js' };
      });
    },
  };
}
