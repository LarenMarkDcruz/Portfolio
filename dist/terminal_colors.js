/** Report an invalid color-command shape before any styles change. */
export class ColorCommandSyntaxError extends Error {
  /** Describe valid foreground and background arguments. @param {string} message */
  constructor(message) { super(message); this.name = 'ColorCommandSyntaxError'; }
}

/** Parse CSS colors without confusing hex values with shell comments. @param {string} input @returns {object} */
export function parseColorPreferences(input) {
  const keyMatch = input.match(/^(fg|foreground|bg|background|accent)\s+(.+)$/i);
  const aliases = { fg: 'fg', foreground: 'fg', bg: 'bg', background: 'bg', accent: 'accent' };
  if (keyMatch) return { [aliases[keyMatch[1].toLowerCase()]]: keyMatch[2].replace(/^(["'])(.*)\1$/, '$2') };
  const tokens = [...input.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(match => match[1] ?? match[2] ?? match[3]);
  if (tokens.length === 2 && !tokens[0].startsWith('--')) return { fg: tokens[0], bg: tokens[1] };
  const preferences = {};
  for (let index = 0; index < tokens.length; index += 2) {
    const key = aliases[tokens[index].replace(/^--/, '').toLowerCase()];
    if (!key || !tokens[index + 1]) throw new ColorCommandSyntaxError('Try /color --fg "#eeeeee" --bg "#0f0f23".');
    preferences[key] = tokens[index + 1];
  }
  if (!Object.keys(preferences).length) throw new ColorCommandSyntaxError('Try /color fg hotpink, /color bg #0f0f23, or /color #eeeeee #000000.');
  return preferences;
}
