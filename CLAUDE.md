# CLAUDE.md

Nathan Hong's portfolio, served by GitHub Pages at https://snoopryees.github.io/. Static files only: no build step, no package manager, no framework.

## Layout

- `index.html` + `style.css`: the portfolio, a single page. `index.html` links `tokens.css` (every colour, font, spacing step, type size, radius, duration and easing as a `:root` custom property) and `base.css` (shared element defaults) before `style.css`. No colour or `font-family` literal goes past `tokens.css`; spacing uses the `--space-*` steps. The Hallmark stamp at the top of `style.css` records the design decisions and any waivers. The small inline script at the bottom of `index.html` handles scroll-in reveals, in-view video playback and the copy-email button. Every piece of content must stay visible when JS is off, so reveal styles apply only under `html.js`.
- `assets/projects/`: project screenshots and clips shown in the cards. Always give images `width`/`height` so the layout doesn't shift while they load.
- `play/<game>/`: self-contained, browser-playable builds of older projects. Each page copies the site tokens into its own inline `:root`, so a palette change has to be repeated in `play/*/index.html`.
  - `play/recoil-ascent/`: Java/LibGDX game compiled to JS with TeaVM. `app.js` is generated output, so don't hand-edit it.
  - `play/dungeon-crawler/`: the Python game running on Pyodide; `webport.py` adapts the terminal I/O for the browser.
- `COMP4537/`: BCIT coursework (labs, hackathon). It isn't linked from the portfolio; leave it alone unless asked.

## Conventions

- Motion: ease-out (`--ease-out`) for entrances, no bounce, exits shorter than entrances, everything inside `prefers-reduced-motion: no-preference`. One hero settle and one scroll reveal (`.reveal` cards); nothing else animates in.
- The accent (`--color-accent`, sakura pink) is for fills and highlights only; it is too faint on cream for text or small marks. Use `--color-accent-ink` (deep rose) for links, bullets and small accent marks. On the ink bands (`#play`, `#contact`, the footer) the sakura accent is legible and carries links and the focus ring.
- Check that new text/background pairs reach 4.5:1 contrast.

## Cache busting

GitHub Pages serves files with `max-age=600`, so after changing `style.css`, `tokens.css` or `base.css` bump the `?v=` number on all three stylesheet `<link>`s in `index.html`, or returning visitors can get the new HTML with the old stylesheet for up to 10 minutes.

## Preview

Open `index.html` directly, or run `python -m http.server` from the repo root (the game pages need a server to load their assets).

## Commits

Don't add a `Co-Authored-By` trailer to commit messages.
