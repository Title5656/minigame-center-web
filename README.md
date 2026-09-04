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
npm run dev      # start Vite local development server
npm run build    # bundle production build to dist/
npm run preview  # preview production build locally
npm run lint     # run ESLint on src/
npm run lint:fix # auto-fix lint issues
npm test         # run unit & regression tests
npm run check    # lint + test + build (run before committing)
```

## Structure

```
minigame-center-web/
├── index.html            # Homepage HTML shell
├── play.html             # Game play HTML shell
├── 404.html              # Custom 404 page
├── vite.config.js        # Vite configuration (multi-page + base path)
├── package.json          # Project metadata, scripts, and dependencies
├── public/
│   └── .nojekyll         # GitHub Pages Jekyll bypass flag
├── src/
│   ├── main.js           # Homepage entry script
│   ├── play.js           # Play shell dynamic game loader
│   ├── data/
│   │   └── games.js      # Central game registry (single source of truth)
│   ├── ui/
│   │   ├── transition.js # Block/pixel transition controller
│   │   ├── game-card.js  # Reusable homepage game card generator
│   │   └── game-nav.js   # Reusable play navigation & game switcher
│   ├── utils/
│   │   └── colors.js     # CSS token resolution utility with fallbacks
│   ├── games/
│   │   ├── breakout/     # Breakout game module
│   │   ├── snake/        # Snake game module
│   │   ├── memory/       # Memory Match game module
│   │   ├── runner/       # Pixel Runner game module
│   │   ├── dodge/        # Astro Dodge game module
│   │   ├── tower/        # Tower Drop game module
│   │   ├── hex/          # Hex Slide game module
│   │   ├── orbit/        # Orbit Tap game module
│   │   └── trail/        # Light Trails game module
│   └── styles/
│       ├── index.css     # Stylesheet entry point
│       ├── variables.css # Theme tokens & color definitions
│       ├── base.css      # Resets, typography, and pixel sprite backgrounds
│       ├── layout.css    # Header, hero, arcade shell, containers
│       ├── components.css# Buttons, cards, transitions, pixel decorations
│       └── games.css     # Game boards, canvas, and puzzle grids
├── tests/
│   └── run-tests.js      # Unit and regression test suite
└── .github/
    └── workflows/
        └── deploy-pages.yml # CI pipeline: lint + test + build -> deploy dist/
```

## Adding a New Game

Adding a new game to the arcade hub requires only four simple steps:

1. **Create the game module**:
   Create `src/games/<slug>/index.js` exporting standard lifecycle functions:
   ```javascript
   export function mount(root) {
     // 1. Render markup into root
     // 2. Query canvas/controls
     // 3. Attach event listeners
     return {
       destroy() {
         // Clean up timers, RAF loops, and event listeners
       }
     };
   }
   ```
2. **Register in the central registry**:
   Add the game metadata to `src/data/games.js`:
   ```javascript
   {
     slug: '<slug>',
     name: 'Game Name',
     description: 'Brief description of gameplay.',
     controls: 'Controls summary'
   }
   ```
3. **Register loader in `src/play.js`**:
   Add the dynamic import to `gameLoaders` in `src/play.js`:
   ```javascript
   '<slug>': () => import('./games/<slug>/index.js')
   ```
4. **Add tests (optional)**:
   Add any pure-logic regression assertions in `tests/run-tests.js`.

The game will automatically appear on the homepage grid, in the lineup roster, and in the game switcher dropdown.

## Deployment

Pushes to `main` deploy to GitHub Pages automatically. The workflow runs `npm run check` (`npm run lint && npm test && npm run build`) and uploads the generated `dist/` directory to GitHub Pages.

### First-time setup (one-time)

GitHub will not let the workflow's automatic `GITHUB_TOKEN` enable a Pages site. Enable it once with either option:

**Option A (recommended):** Settings → Pages → Build and deployment → Source → **GitHub Actions**.

**Option B:** Add a fine-grained Personal Access Token as the repo secret `PAGES_PAT`:
1. Create a token with **Repository access** = this repo, and permission **Pages: Read and write**.
2. Settings → Secrets and variables → Actions → **New repository secret** → name `PAGES_PAT`, paste the token.
3. Re-run the workflow.

After either option, subsequent pushes deploy automatically with no further setup.

## License

MIT — see [LICENSE](LICENSE).