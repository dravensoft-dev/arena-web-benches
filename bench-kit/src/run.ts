import { spawnSync } from 'node:child_process';

/** Runs `<command> <args>` in `cwd`; the log is the command line and both streams, `ok` is exit code 0. */
export function exec(cwd: string, command: string, args: string[], env: Record<string, string> = {}): { ok: boolean; log: string } {
  const done = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...env } });
  const text = `${done.stdout ?? ''}${done.stderr ?? ''}${done.error ? `\n${done.error.message}` : ''}`;
  const log = `$ ${command} ${args.join(' ')}\n${text.replace(/\x1b\[[0-9;]*m/g, '')}`;
  return { ok: done.status === 0, log };
}

/** Runs the script `name` of the package at `cwd` with Bun. */
export const script = (cwd: string, name: string): { ok: boolean; log: string } => exec(cwd, 'bun', ['run', name]);
