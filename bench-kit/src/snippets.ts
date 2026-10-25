/* The page's recipe as text: a variant of a half's config is that config with a snippet of the page removed or
 * swapped, found by its lines (each trimmed, so a snippet is found at whatever indentation the config gives it).
 * A snippet the config does not hold throws with its name, so a half and its page cannot drift apart silently. */

const escape = (line: string): string => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches the snippet's lines, one after another, with the indentation of the first line and the line break after the last. */
function pattern(snippet: string): RegExp {
  const lines = snippet.split('\n').map((line) => line.trim()).filter((line) => line !== '');
  if (lines.length === 0) throw new Error('an empty snippet matches everything');
  return new RegExp(`^[ \\t]*${lines.map(escape).join('[ \\t]*\\r?\\n[ \\t]*')}[ \\t]*(?:\\r?\\n|$)`, 'gm');
}

/** How many times the snippet is in `text`. */
export const occurrences = (text: string, snippet: string): number => [...text.matchAll(pattern(snippet))].length;

/** A throw naming `name` unless the snippet is in `text` exactly once. */
export function requireSnippet(text: string, name: string, snippet: string, where = 'the config'): void {
  const found = occurrences(text, snippet);
  if (found !== 1) throw new Error(`snippet '${name}' is in ${where} ${found} times, not once:\n${snippet}`);
}

/** `text` without the snippet's lines. */
export function removeSnippet(text: string, name: string, snippet: string): string {
  requireSnippet(text, name, snippet);
  return text.replace(pattern(snippet), '');
}

/** `text` with the snippet's lines replaced by `replacement` (written as given, its own indentation and line break). */
export function replaceSnippet(text: string, name: string, snippet: string, replacement: string): string {
  requireSnippet(text, name, snippet);
  return text.replace(pattern(snippet), () => replacement);
}
