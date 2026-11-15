# Browser terminal dependency

`just_bash.js` bundles **just-bash 3.6.0** (Apache-2.0) and its browser dependencies. The upstream license is in `JUST_BASH_LICENSE`. Dependency license notices remain at the end of the bundle.

Source: https://github.com/vercel-labs/just-bash

The bundle uses `fflate` instead of Node's `zlib` for browser-compatible gzip operations. `diff`, `sprintf-js`, and `turndown` are bundled locally. No CDN or backend is required.

To reproduce from the repository root:

```sh
npm ci --prefix tools/terminal_sandbox --ignore-scripts
npm run build --prefix tools/terminal_sandbox
```

Normal website editing and deployment do not require either command. The generated bundle is tracked in `dist/` and loaded only when someone runs a shell command.
