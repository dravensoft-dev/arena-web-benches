import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** The benches root a half or its scratch sits directly under. */
export const rootOf = (dir: string): string => dirname(resolve(dir));

/** The `file:` URL of this module, for a config written into a half that imports its plugins from here. */
export const COMMON_URL = pathToFileURL(resolve(import.meta.filename)).href;

/** Runs `node <args>` in `cwd`; the log is the command line and both streams, `ok` is exit code 0. */
export function node(cwd: string, args: string[], env: Record<string, string> = {}): { ok: boolean; log: string } {
  const run = spawnSync('node', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...env } });
  const text = `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? `\n${run.error.message}` : ''}`;
  const log = `$ node ${args.join(' ')}\n${text.replace(/\x1b\[[0-9;]*m/g, '')}`;
  return { ok: run.status === 0, log };
}

/** A rollup-family plugin: every `.css` module is an empty one, so the caller links the sheets from the page. */
export function emptyCss() {
  return {
    name: 'bench-empty-css',
    // The id ends in `.js`, not `.css`: a bundler that reads a module's extension (rolldown) would refuse it before `load`.
    async resolveId(this: { resolve(source: string, importer?: string, options?: object): Promise<{ id: string } | null> }, source: string, importer?: string, options?: object) {
      if (!source.split('?')[0]!.endsWith('.css') || source.startsWith('\0')) return null;
      const found = await this.resolve(source, importer, { ...options, skipSelf: true });
      return found ? `\0bench-empty-css:${found.id}.js` : null;
    },
    load(id: string) {
      return id.startsWith('\0bench-empty-css:') ? { code: 'export default "";', map: null } : null;
    },
  };
}

/**
 * A rollup-family plugin that emits `index.html` from `src/index.html` of the half, its module script pointing at the
 * entry chunk (`./<file>`), the `<base href>` and the rest of the page untouched.
 */
export function htmlPage(dir: string, entryName: string) {
  const script = /<script\s+type="module"\s+src="[^"]*"\s*><\/script>/;
  return {
    name: 'bench-html-page',
    generateBundle(this: { emitFile(file: object): void }, _options: unknown, bundle: Record<string, { type: string; isEntry?: boolean; name?: string; fileName: string }>) {
      const entry = Object.values(bundle).find((chunk) => chunk.type === 'chunk' && chunk.isEntry && chunk.name === entryName);
      if (!entry) throw new Error(`no entry chunk named ${entryName}`);
      const html = readFileSync(join(dir, 'src', 'index.html'), 'utf8');
      if (!script.test(html)) throw new Error('src/index.html has no module script to point at the entry chunk');
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: html.replace(script, () => `<script type="module" src="./${entry.fileName}"></script>`),
      });
    },
  };
}
