# CLAUDE.md

Nathan Hong's portfolio, served by GitHub Pages at https://snoopryees.github.io/. Static files only: no build step, no package manager, no framework.

## Layout

- `index.html` + `style.css`: the portfolio, a single page. The design tokens (colours, fonts, easing) are the `:root` custom properties at the top of `style.css`. The small inline script at the bottom of `index.html` handles scroll-in reveals, in-view video playback and the copy-email button. Every piece of content must stay visible when JS is off, so reveal styles apply only under `html.js`.
- `assets/projects/`: project screenshots and clips shown in the cards. Always give images `width`/`height` so the layout doesn't shift while they load.
- `play/<game>/`: self-contained, browser-playable builds of older projects. Each page copies the site tokens into its own inline `:root`, so a palette change has to be repeated in `play/*/index.html`.
  - `play/recoil-ascent/`: Java/LibGDX game compiled to JS with TeaVM. `app.js` is generated output, so don't hand-edit it.
  - `play/dungeon-crawler/`: the Python game running on Pyodide; `webport.py` adapts the terminal I/O for the browser.
- `COMP4537/`: BCIT coursework (labs, hackathon). It isn't linked from the portfolio; leave it alone unless asked.

## Conventions

- Motion: ease-out (`--ease-out`) for entrances, no bounce, exits shorter than entrances, everything inside `prefers-reduced-motion: no-preference`.
- The accent (`--accent`, orchid) is too light for body text on cream. Use `--accent-ink` for links and small text, and `--accent` for fills, large display type and decoration.
- Check that new text/background pairs reach 4.5:1 contrast.

## Preview

Open `index.html` directly, or run `python -m http.server` from the repo root (the game pages need a server to load their assets).

## Commits

Don't add a `Co-Authored-By` trailer to commit messages.
