# Portfolio retro

Laren Mark D’Cruz’s minimalist portfolio: C++-inspired navigation, near-black terminal styling, Source Code Pro typography, and five accent palettes. Matrix green is the default.

## Run locally

No build step or package installation is needed. From this folder, run:

```sh
./start.sh
```

Open http://127.0.0.1:8000. Keep that terminal open. Stop the server with Ctrl+C. Use `./start.sh 8001` for another port; `./start.sh --help` lists usage.

## Edit in Codex on your computer

1. Clone this repository:

   ```sh
   git clone https://github.com/LarenMarkDcruz/Portfolio.git
   cd Portfolio
   ```

2. In the ChatGPT/Codex desktop app, add a local project and select the cloned `Portfolio-retro` folder. Choose the Local environment for work on these files.
3. Start a chat in that project. For example: “Read AGENTS.md and the portfolio files. Start the local preview and help me add a project.”

## Files

- `dist/index.html`: portfolio content, tabs, and contact information.
- `dist/style.css`: layout, responsive styles, glow, and color palettes.
- `dist/app.js`: tab navigation, display preferences, and filters.
- `dist/terminal.js`: website terminal commands, history, completion, and custom colors.
- `dist/resume.txt`: downloadable résumé.
- `dist/SourceCodePro-*`: locally hosted fonts. Their license is in `FONT-LICENSE.txt`.

## Free hosting with GitHub Pages

The workflow in `.github/workflows/deploy_pages.yml` publishes only `dist/`. GitHub Pages is free for public repositories.

1. Open https://github.com/LarenMarkDcruz/Portfolio/settings/pages.
2. Under **Build and deployment**, choose **GitHub Actions** as the source. Enable repository Actions if GitHub asks.
3. Open **Actions → Publish portfolio → Run workflow**, choose `main`, and run it.
4. After the workflow succeeds, open https://larenmarkdcruz.github.io/Portfolio/. Settings → Pages shows the confirmed address.

Future updates: edit files in `dist/`, preview locally, commit, and push to `main`. The workflow automatically publishes changes to `dist/`. A failed deployment appears under Actions; the workflow must succeed before changes go live.

```text
Edit → Preview → Commit + push → GitHub Actions → Public website
```

This publishes the GitHub copy separately from the existing Sites publication. No deployment credentials belong in this repository.

## Display brightness

The site offers black, midnight navy (#0f0f23), and warm-paper terminal modes, with a separate five-color accent picker. Matrix green returns on every page load. Other palettes apply during the current visit; the display mode is remembered locally. A full-width solid canvas, medium-weight headings, and larger body text keep the retro layout readable. Dark mode uses a black background and Display P3 accents on compatible screens. P3 improves the available colors; it is not HDR.

An experimental CSS HDR enhancement brightens the name, role, and brand only when the browser supports Rec. 2100 linear colors and reports a high dynamic range display. Other browsers use normal colors. Actual HDR output depends on the browser, operating system, display, and its settings; local browser checks cannot verify physical luminance.

## Résumé link

The résumé link sits below the coffee illustration, without a shimmer or bright white glow. `open resume` opens the same Google Doc. The footer has been removed. To make the document accessible to visitors, set its General access to **Anyone with the link → Viewer**.

## Website terminal

The command line docks at the bottom behind one subtle top divider. On desktop it occupies 25% of the viewport, with a 180px minimum and 320px maximum. The page reserves that space so content remains reachable. Terminal history scrolls independently while the input stays visible. Mobile starts with a compact prompt; expand it to read history, or submit a command to expand automatically. The collapse button keeps the prompt available. Enter `/help` or `help` for website navigation, appearance controls, and sandbox examples. A locally bundled just-bash interpreter runs Bash syntax in a worker with an in-memory filesystem.

| Purpose | Commands |
| --- | --- |
| Navigation | `ls`, `pwd`, `cd skills`, `cd ..`, `open work`, `open github`, `open linkedin`, `open resume` |
| Appearance | `theme cyan`, `mode light`, `mode navy`, `bg #101018`, `fg #eeeeee`, `accent hotpink`, `font courier`, `reset` |
| Color pairs | `/color #eeeeee #0f0f23`, `/color --fg "rgb(240, 230, 220)" --bg midnightblue` |
| Virtual files | `mkdir demo`, `echo hello > note.txt`, `cat note.txt`, `grep hello note.txt`, `cp`, `mv`, `rm` |
| Bash syntax | Pipes, redirects, variables, globbing, loops, scripts, `sed`, `awk`, `jq`, `sort`, `uniq` |
| Terminal | `/help`, `history`, `whoami`, `clear` |

`cd resume` opens the résumé section; `open resume` opens the Google Doc in a new tab. Popup blockers may require using the page link instead. Arrow keys recall session history. Tab completes commands and supported website arguments; Shift+Tab leaves the field. Ctrl+L clears output. Ctrl+C stops a running worker and resets the virtual filesystem, or clears unfinished input when idle.

Output scrolls in a bounded area. The `visit:~/main.cpp $` prompt follows the active tab filename and shows scratch-directory paths while exploring the sandbox. Click unused terminal space to type; an underscore marks the empty prompt. Keyboard focus uses an underline instead of a dotted rectangle. Foreground, background, and accents accept browser-supported CSS colors. `/color` validates every supplied color before changing anything. Visitors can choose any colors, including low-contrast combinations; `reset` restores the palette. The `font` command selects bundled Source Code Pro, browser families, or locally installed fonts. Choosing a palette or display mode resets custom colors. Custom colors, virtual files, and history last for the current visit. Fonts persist locally; reload restores Matrix green.

The sandbox supports the interpreter's command set, not every installed Linux program. `ls /usr/bin` lists available commands. It cannot access host files, run native programs, use Python/Node, or make network requests. Variables, virtual files, and the current directory persist across commands; shell functions and arrays remain scoped to an individual submitted script. Limits cap execution time, output, filesystem size, and loop iterations. A five-second worker deadline keeps the page responsive. Dependencies and a reproducible bundle tool live in `dist/vendor/` and `tools/terminal_sandbox/`; normal edits need no build step.

A brief section entrance and hover glows respect reduced-motion preferences. No photo is required for this text-first portfolio.

## Looping ASCII illustrations

Skills shows a grinning cat drawn with Unicode Braille dots. The portrait blinks and sits at up to 320px wide, aligned left below the skills list. Résumé and Work use a 144-column × 64-row grid for the steaming coffee cup and rotating rocket. The earlier cat and fish and the looping ocean breakers are preserved in `archive/ascii_vignettes/`.

Each animation loops continuously, pauses when hidden or offscreen, and includes a keyboard-accessible pause button. Reduced-motion preferences show a still frame. They target 30 frames per second, independently of Beyond's existing Classic fusion renderer. The character grid and font scale together on mobile so no artwork edge gets clipped.

## Random C++ motto

`dist/focus_lines.js` contains 25 short C++ declarations. Every page load selects one at random and renders syntax-colored text. The motto stays still while reading. It works on the local server and static hosting without an API or backend. A refresh may select the same motto again.

## Abstract ASCII sculpture

Beyond code always opens Classic fusion with a random seed and starting pose. Two hollow, warped loops rotate independently and exchange sizes while apart. As they approach, their orientation and proportions align into one rotating, rounded or oval loop. A central tunnel is carved after fusion so overlapping surfaces cannot fill the opening; it naturally appears narrower when viewed edge-on. Each motion cycle chooses varying joined and separated hold durations, with smooth transitions between them. Random reset generates another Classic fusion composition; pause freezes the current state. The style dropdown is removed.

The sixteen alternative families are archived in `archive/ascii_style_library/` and are not loaded by the live website. See `SCULPTURE_STYLES.md` for the catalogue and restoration notes, also referenced by Codex and Claude project instructions.

The character grid now uses 136 columns on desktop and 112 on narrow mobile windows, up from 104. Chunkier ASCII glyphs use a coherent material grain attached to the rotating bodies. Seven lighting layers combine a key light, subtle fill, reflective highlights, inner-wall occlusion, and soft contact shadows. Ray marching computes the fused surface and its lighting. Pause freezes the current state; the contrast exponent remains 225%, with no intensity slider.

The renderer targets up to 120 frames per second through requestAnimationFrame; actual FPS depends on the display refresh rate, browser scheduling, and rendering cost. Motion gradually varies between 1.96875× and 2.625× using a seed-specific rhythm. The artwork uses a fixed camera and character scale inside a full-width landscape rectangle above the caption and controls. Growing shapes crop at the edges instead of triggering automatic zoom or recentering. Only resizing the rectangle changes the character grid; its height adapts to desktop space and mobile width without distorting the shapes. Desktop contact links sit directly below it; mobile shows contact links before the hobbies. The animation pauses offscreen and respects reduced-motion preferences. No external services or dependencies are required. Run the geometry and rendering checks with:

```sh
node --test tests/*.test.mjs
```

## Random three-sentence introduction

`dist/intro_sentences.js` contains 30 wordings in three pools: software engineering, the current Cisco/Splunk role, and Victoria, BC. Every load independently picks one sentence from each pool, producing 1,000 possible combinations. The factual details stay consistent. The existing sequential typing animation reveals the selected text, with the underscore at its end.
