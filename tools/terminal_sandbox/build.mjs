import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const TOOL_DIRECTORY = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIRECTORY = fileURLToPath(new URL('../../dist/vendor/', import.meta.url));

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL('node_modules/just-bash/dist/bundle/browser.js', import.meta.url))],
  outfile: `${OUTPUT_DIRECTORY}just_bash.js`,
  bundle: true,
  platform: 'browser',
  format: 'esm',
  minify: true,
  legalComments: 'eof',
  alias: { 'node:zlib': `${TOOL_DIRECTORY}compression.mjs` },
});
await copyFile(`${TOOL_DIRECTORY}node_modules/just-bash/LICENSE`, `${OUTPUT_DIRECTORY}JUST_BASH_LICENSE`);
