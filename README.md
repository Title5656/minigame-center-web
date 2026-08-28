# Mini Game Center

A neon-lit arcade hub featuring nine playable HTML5 games. Built for quick sessions, sharp reflexes, and pixel fun.

## Games

| Game | Controls |
|------|----------|
| Breakout | ← → / A D to move |
| Snake | Arrow keys |
| Memory Match | Click cards |
| Pixel Runner | Space to jump |
| Astro Dodge | ← → / A D to move |
| Tower Drop | Drop button or Space |
| Hex Slide | Arrow keys or taps |
| Orbit Tap | Click the orb |
| Light Trails | Repeat the sequence |

## Development

```bash
npm install      # install dev dependencies
npm run check    # lint + test (run before committing)
npm run lint     # ESLint only
npm test         # run the bug-fix unit tests
npm run lint:fix # auto-fix lint issues
```

## Structure

```
index.html            # Static HTML page (all markup)
css/style.css         # All styles (extracted from inline)
js/games.js           # All game logic (extracted from inline)
tests/run-tests.js    # Node-based bug-fix regression tests
.github/workflows/    # GitHub Pages deploy with lint+test gate
```

## Deployment

Pushes to `main` deploy to GitHub Pages automatically. The workflow runs `npm run check` (lint + tests) before the deploy step, and only stages `index.html`, `css/`, `js/`, and `.nojekyll` into the Pages artifact.

## License

MIT — see [LICENSE](LICENSE).