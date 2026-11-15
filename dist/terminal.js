import { createPortfolioFiles, createTerminalSandbox } from './terminal_sandbox.js?v=20261115-loops';
import { ColorCommandSyntaxError, parseColorPreferences } from './terminal_colors.js?v=20261115-loops';

const SECTION_NAMES = ['home', 'skills', 'resume', 'work', 'beyond'];
const COMMAND_NAMES = ['help', '/help', 'ls', 'pwd', 'cd', 'open', 'theme', 'mode', 'color', '/color', 'bg', 'background', 'fg', 'foreground', 'accent', 'font', 'reset', 'history', 'whoami', 'clear', 'cat', 'echo', 'printf', 'mkdir', 'touch', 'cp', 'mv', 'rm', 'find', 'grep', 'sort', 'uniq', 'head', 'tail', 'wc', 'sed', 'awk', 'jq', 'date', 'env', 'which', 'bash'];
const MAXIMUM_HISTORY_ENTRIES = 100;
const COLOR_STORAGE_KEY = 'portfolio-terminal-colors';

const CUSTOM_STYLE_PROPERTIES = Object.freeze({
  bg: ['--bg'],
  fg: ['--text', '--muted'],
  accent: ['--green', '--phosphor', '--bright', '--dim'],
  font: ['--site-font'],
});
const FONT_CHOICES = Object.freeze({
  source: "'Source Code Pro', monospace",
  courier: "'Courier New', monospace",
  system: 'system-ui, sans-serif',
  monospace: 'monospace',
  serif: 'serif',
});

/** Validate a browser-supported literal color or font family. @param {object} preference @returns {boolean} */
function isAppearanceValueValid({ key, value }) {
  if (typeof value !== 'string' || /var\(|currentcolor|inherit|unset|initial|revert/i.test(value)) return false;
  return CSS.supports(key === 'font' ? 'font-family' : 'color', value);
}

/** Apply validated custom colors and font choices. @param {object} preferences @returns {void} */
function applyCustomAppearance(preferences) {
  for (const [key, value] of Object.entries(preferences)) {
    for (const property of CUSTOM_STYLE_PROPERTIES[key]) document.body.style.setProperty(property, value);
    if (key === 'accent') document.body.style.setProperty('--glow', `color-mix(in srgb, ${value} 45%, transparent)`);
  }
}

/** Remember the font while keeping color customizations scoped to this visit. @param {object} preferences @returns {void} */
function saveCustomAppearance(preferences) {
  const rememberedPreferences = Object.fromEntries(Object.entries(preferences).filter(([key]) => key === 'font'));
  try { localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(rememberedPreferences)); }
  catch (storageError) { console.warn('Terminal appearance could not be saved', { storageError }); }
}

/** Restore the supported font without overriding the initial Matrix palette. @returns {object} */
function restoreCustomAppearance() {
  try {
    const savedPreferences = JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY) || '{}');
    const preferences = Object.fromEntries(Object.entries(savedPreferences).filter(([key, value]) => key === 'font' && isAppearanceValueValid({ key, value })));
    applyCustomAppearance(preferences);
    return preferences;
  } catch (storageError) {
    console.warn('Terminal appearance could not be restored', { storageError });
    return {};
  }
}

/** Reset custom appearance to the selected palette and bundled font. @param {object} state @returns {void} */
function resetCustomAppearance(state) {
  state.preferences = {};
  for (const properties of Object.values(CUSTOM_STYLE_PROPERTIES)) {
    for (const property of properties) document.body.style.removeProperty(property);
  }
  document.body.style.removeProperty('--glow');
  saveCustomAppearance(state.preferences);
}

const COMMAND_HELP_LINES = Object.freeze([
    'EXPLORE THE WEBSITE',
    'ls / ls ..             list virtual files / section directories',
    'cd skills / open work  visit a section (filenames also work)',
    'cd home                return to the main page',
    'cd ..                  move up one virtual directory',
    'pwd                    show the sandbox working directory',
    'open github            open my GitHub profile',
    'open linkedin          open my LinkedIn profile',
    'open resume            open the Google Docs résumé',
    'open youtube           listen to my songs on YouTube',
    'cd beyond              hobbies and contact (alias: cd contact)',
    'Work: filter projects and select a filename for its notes.',
    'Résumé: expand earlier experience or view the linked document.',
    'Tabs and theme pickers also work with mouse or keyboard.',
    '',
    'CUSTOMIZE YOUR VIEW — colors apply during this visit',
    'theme <name>           {themes}',
    'mode <name>            dark, navy, light (warm paper)',
    'bg midnightblue        background; alias: background',
    'fg #eeeeee             text color; alias: foreground',
    'accent hotpink         links, headings, and glow',
    '/color fg hotpink      any supported CSS text color',
    '/color bg #0f0f23      any supported CSS background color',
    '/color #eeeeee #000    foreground and background together',
    '/color --fg "rgb(240, 240, 240)" --bg "midnightblue"',
    'Colors: CSS names, hex, rgb(), hsl(), oklch(), etc.',
    'font source            restore Source Code Pro',
    'font courier           Courier New (if installed)',
    'font system            system interface font',
    'font monospace         browser monospace; serif also works',
    'font Georgia           any locally available font family',
    'reset                  restore palette colors and font',
    'Theme/mode changes also reset custom styles.',
    'Reload restores Matrix green; font and mode are remembered.',
    '',
    'TERMINAL',
    '/help or help          show this guide',
    'history                list commands from this session',
    'whoami                 show your sandbox identity',
    'clear                  clear the output',
    '↑↓ history · Tab complete · Shift+Tab leave input',
    'Ctrl+L clear · Ctrl+C stop a running command',
    '',
    'BASH PLAYGROUND — virtual files, reset on reload',
    'cd ~/playground        enter the scratch directory',
    'echo hello > note.txt  write a virtual file',
    'cat note.txt           read it back',
    'printf "Go\\nPython\\nGo\\n" | sort | uniq -c',
    'for n in 1 2 3; do echo "launch $n"; done',
    'Variables, pipes, redirects, globbing, loops, and scripts.',
    'Try grep, sed, awk, jq, find, head, tail, wc, cp, mv, rm.',
    'ls /usr/bin            list the available shell commands',
    'This is a browser Bash interpreter, not a full Linux VM.',
    'No host files, network, installed programs, Python, or sudo.',
    'Commands have time, memory, and output limits. Ctrl+C resets the sandbox.',
  ]);

/** Build the terminal command reference. @param {string[]} themes @returns {string} */
function describeCommands(themes) {
  return COMMAND_HELP_LINES.join('\n').replace('{themes}', themes.join(', '));
}

/** Change a picker through the same path as a pointer interaction. @param {object} selection @returns {string} */
function changeDisplaySelection({ selector, value, choices }) {
  if (!choices.includes(value)) return `Choose one: ${choices.join(', ')}.`;
  const picker = document.querySelector(selector);
  picker.value = value;
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  return `Selected ${value}.`;
}

/** Resolve section filenames and paths to the site's routes. @param {string} destination @returns {string} */
function resolveSection(destination) {
  const normalized = destination.replace(/^~?\//, '').replace(/\/$/, '').replace(/\.(cpp|hpp|md)$/, '');
  if (['', '~', '..', 'main'].includes(normalized)) return 'home';
  if (normalized === 'contact') return 'beyond';
  return normalized === 'projects' ? 'work' : normalized;
}

/** Navigate within the site or open a supplied profile. @param {object} request @returns {string} */
function openDestination({ command, destination, navigate }) {
  const externalLinks = { github: '#home a[href*="github.com"]', linkedin: '#home a[href*="linkedin.com"]', resume: '#resume a[href*="docs.google.com"]', youtube: '#beyond a[href*="youtube.com"]' };
  if (command === 'open' && externalLinks[destination]) {
    const link = document.querySelector(externalLinks[destination]);
    const openedWindow = window.open(link.href, '_blank');
    if (!openedWindow) return 'Your browser blocked the new tab. Use the matching link on the page.';
    openedWindow.opener = null;
    return `Opened ${destination} in a new tab.`;
  }
  const section = resolveSection(destination);
  if (!SECTION_NAMES.includes(section)) return `Section not found: ${destination}. Try ls.`;
  navigate(section);
  return `Opening /${section}.`;
}

/** Change a custom font or color using browser CSS validation. @param {object} request @returns {string} */
function changeCustomAppearance({ command, value, state }) {
  const resolvedValue = command === 'font' ? FONT_CHOICES[value.toLowerCase()] || value : value;
  if (!isAppearanceValueValid({ key: command, value: resolvedValue })) return `Invalid ${command}. Try ${command === 'font' ? 'font source' : `${command} hotpink or ${command} #aabbcc`}.`;
  state.preferences = { ...state.preferences, [command]: resolvedValue };
  applyCustomAppearance(state.preferences);
  saveCustomAppearance(state.preferences);
  return `${command} set to ${value}. Type reset to restore defaults. Fonts depend on what your device has installed.`;
}

/** Apply foreground/background colors together only after all values validate. @param {object} request @returns {string} */
function changeTerminalColors({ value, state }) {
  if (value === 'reset') { resetCustomAppearance(state); return 'Colors and font restored.'; }
  try {
    const preferences = parseColorPreferences(value);
    for (const [key, color] of Object.entries(preferences)) {
      if (!isAppearanceValueValid({ key, value: color })) return `Invalid ${key} color: ${color}. Use a CSS name, hex, rgb(), or hsl().`;
    }
    state.preferences = { ...state.preferences, ...preferences };
    applyCustomAppearance(state.preferences);
    saveCustomAppearance(state.preferences);
    return Object.entries(preferences).map(([key, color]) => `${key} = ${color}`).join('\n');
  } catch (error) {
    if (error instanceof ColorCommandSyntaxError) return error.message;
    throw error;
  }
}

/** Execute navigation and display commands. @param {object} request @returns {string} */
function executeCommand({ line, state, dependencies }) {
  const [rawCommand, ...argumentsList] = line.split(/\s+/);
  const normalizedCommand = rawCommand.toLowerCase();
  const command = { background: 'bg', foreground: 'fg' }[normalizedCommand] || normalizedCommand;
  const value = argumentsList.join(' ');
  if (['help', '/help'].includes(command)) return describeCommands(dependencies.themes);
  if (command === 'history') return state.history.map((entry, index) => `${index + 1}  ${entry}`).join('\n');
  if (['color', '/color'].includes(command)) return changeTerminalColors({ value, state });
  if (['bg', 'fg', 'accent', 'font'].includes(command)) return changeCustomAppearance({ command, value, state });
  if (command === 'reset') { resetCustomAppearance(state); return 'Custom colors and font reset.'; }
  if (['theme', 'mode'].includes(command)) return changeDisplaySelection({ selector: command === 'theme' ? '#theme' : '#appearance', value, choices: command === 'theme' ? dependencies.themes : ['dark', 'navy', 'light'] });
  if (command === 'open' || (command === 'cd' && !['', '..', '~'].includes(value) && SECTION_NAMES.includes(resolveSection(value)) && !/[;&|<>]/.test(value))) return openDestination({ command, destination: value, navigate: dependencies.navigate });
  if (SECTION_NAMES.includes(command)) return openDestination({ command: 'cd', destination: command, navigate: dependencies.navigate });
  return null;
}

/** Complete known commands and their supported arguments. @param {object} context @returns {void} */
function completeInput({ input, output, themes }) {
  const words = input.value.toLowerCase().split(/\s+/);
  const argumentChoices = { cd: [...SECTION_NAMES, '~/playground'], open: [...SECTION_NAMES, 'github', 'linkedin', 'youtube'], theme: themes, mode: ['dark', 'navy', 'light'], font: Object.keys(FONT_CHOICES), color: ['fg', 'bg', 'accent', 'reset'], '/color': ['fg', 'bg', 'accent', 'reset'] };
  const choices = words.length === 1 ? COMMAND_NAMES : argumentChoices[words[0]] || [];
  const matches = choices.filter(choice => choice.startsWith(words.at(-1)));
  if (matches.length === 1) { words[words.length - 1] = matches[0]; input.value = words.join(' '); }
  if (matches.length > 1) appendOutput({ output, line: input.value, message: matches.join('  ') });
}

/** Append plain text output and keep the scrollback bounded. @param {object} entry @returns {void} */
function appendOutput({ output, line, message }) {
  const entry = document.createElement('p');
  entry.textContent = `$ ${line}\n${message}`;
  output.append(entry);
  while (output.children.length > MAXIMUM_HISTORY_ENTRIES) output.firstElementChild.remove();
  output.scrollTop = ['help', '/help'].includes(line.toLowerCase()) ? entry.offsetTop : output.scrollHeight;
  return entry;
}

/** Add command history and familiar keyboard shortcuts. @param {object} context @returns {void} */
function bindTerminalKeyboard(context) {
  const { input, output, state } = context;
  input.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) { event.preventDefault(); completeInput(context); return; }
    if (event.ctrlKey && ['l', 'c'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      if (event.key.toLowerCase() === 'l') output.replaceChildren();
      else { input.value = ''; if (state.isRunning) state.sandbox.cancel(); }
      return;
    }
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (state.historyIndex === state.history.length) state.draft = input.value;
    state.historyIndex = Math.max(0, Math.min(state.history.length, state.historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = state.history[state.historyIndex] ?? state.draft;
  });
}

/** Focus the prompt when visitors click unused terminal space. @param {HTMLInputElement} input @returns {void} */
function bindTerminalClickFocus(input) {
  document.querySelector('.terminal-content').addEventListener('click', event => {
    if (event.target.closest('a, button, input') || !window.getSelection().isCollapsed) return;
    input.focus({ preventScroll: true });
  });
}

/** Initialize the website terminal with replaceable routing dependencies. @param {object} dependencies @returns {void} */
export function initializeTerminal(dependencies) {
  const output = document.querySelector('#terminal-output');
  const input = document.querySelector('#terminal-input');
  const section = document.querySelector('#current-path').textContent;
  const sandbox = createTerminalSandbox({ files: createPortfolioFiles(document), section });
  const state = { history: [], historyIndex: 0, draft: '', preferences: restoreCustomAppearance(), sandbox, isRunning: false };
  bindTerminalKeyboard({ input, output, state, themes: dependencies.themes });
  bindTerminalClickFocus(input);
  for (const selector of ['#theme', '#appearance']) document.querySelector(selector).addEventListener('change', () => resetCustomAppearance(state));
  document.addEventListener('portfolio:sectionchange', event => sandbox.setSection(event.detail.section));
  bindTerminalSubmission({ input, output, state, dependencies });
}

/** Execute one submitted command while keeping cancellation and page navigation responsive. @param {object} context @returns {void} */
function bindTerminalSubmission({ input, output, state, dependencies }) {
  document.querySelector('#terminal-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (state.isRunning) return;
    const line = input.value.trim();
    input.value = '';
    if (!line) return;
    state.history.push(line);
    if (state.history.length > MAXIMUM_HISTORY_ENTRIES) state.history.shift();
    state.historyIndex = state.history.length;
    state.draft = '';
    if (line.toLowerCase() === 'clear') { output.replaceChildren(); return; }
    const response = executeCommand({ line, state, dependencies });
    if (response !== null) appendOutput({ output, line, message: response });
    else await executeSandboxSubmission({ line, input, output, state, dependencies });
    input.focus({ preventScroll: true });
  });
}

/** Display shell output while leaving Ctrl+C available during execution. @param {object} submission @returns {Promise<void>} */
async function executeSandboxSubmission({ line, output, state, dependencies }) {
  const entry = appendOutput({ output, line, message: 'running…' });
  state.isRunning = true;
  output.setAttribute('aria-busy', 'true');
  try {
    const result = await state.sandbox.execute(line);
    entry.textContent = `$ ${line}\n${result.stdout}${result.stderr}`;
    updateSandboxLocation({ result, dependencies });
  } catch (error) {
    entry.textContent = `$ ${line}\n${error.message}`;
  } finally {
    state.isRunning = false;
    output.setAttribute('aria-busy', 'false');
    output.scrollTop = output.scrollHeight;
  }
}

/** Mirror directory changes into website tabs without treating scratch directories as routes. @param {object} context @returns {void} */
function updateSandboxLocation({ result, dependencies }) {
  const directory = result.directory || '/home/visitor';
  const section = directory.replace('/home/visitor/', '');
  if (SECTION_NAMES.includes(section)) {
    if (document.querySelector('#current-path').textContent !== section) dependencies.navigate(section);
    return;
  }
  document.querySelector('#terminal-location').textContent = directory.replace('/home/visitor', '~');
}
