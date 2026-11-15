import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Bash } from '../dist/vendor/just_bash.js';
import { createSandboxSession } from '../dist/sandbox_session.js';
import { parseColorPreferences, ColorCommandSyntaxError } from '../dist/terminal_colors.js';

test('should preserve virtual files, variables, and directories between commands', async () => {
  const session = createSandboxSession({ Bash, files: {} });
  await session.execute('mkdir demo; cd demo; favorite=Go; echo "$favorite" > note.txt');
  const result = await session.execute('echo "$favorite"; cat note.txt; pwd');
  assert.equal(result.stdout, 'Go\nGo\n/home/visitor/demo\n');
  assert.equal(result.exitCode, 0);
});

test('should execute pipelines, loops, JSON filters, and Bash scripts in memory', async () => {
  const session = createSandboxSession({ Bash, files: {} });
  const pipeline = await session.execute('printf "Go\\nPython\\nGo\\n" | sort | uniq -c');
  assert.match(pipeline.stdout, /2 Go/);
  const loop = await session.execute('for n in 1 2 3; do echo "$n"; done');
  assert.equal(loop.stdout, '1\n2\n3\n');
  const json = await session.execute('echo \'{"language":"Go"}\' | jq -r .language');
  assert.equal(json.stdout, 'Go\n');
  assert.match((await session.execute('ls /usr/bin')).stdout, /grep\n/);
  await session.execute('echo "echo launch" > launch.sh');
  assert.equal((await session.execute('bash launch.sh')).stdout, 'launch\n');
});

test('should report shell errors and stop runaway loops while remaining usable', async () => {
  const session = createSandboxSession({ Bash, files: {} });
  assert.notEqual((await session.execute('cat missing.txt')).exitCode, 0);
  const endless = await session.execute('while true; do :; done');
  assert.notEqual(endless.exitCode, 0);
  assert.equal((await session.execute('echo recovered')).stdout, 'recovered\n');
});

test('should parse foreground and background colors atomically with quoted CSS functions', () => {
  assert.deepEqual(parseColorPreferences('--fg "rgb(240, 230, 220)" --bg "#0f0f23"'), { fg: 'rgb(240, 230, 220)', bg: '#0f0f23' });
  assert.deepEqual(parseColorPreferences('fg hsl(120, 80%, 60%)'), { fg: 'hsl(120, 80%, 60%)' });
  assert.deepEqual(parseColorPreferences('#fff black'), { fg: '#fff', bg: 'black' });
  assert.throws(() => parseColorPreferences('--fg'), ColorCommandSyntaxError);
});
