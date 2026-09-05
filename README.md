# 🕹️ Mini Game Center

> A neon-lit retro arcade hub featuring nine playable HTML5 games. Built for quick sessions, sharp reflexes, and pixel-perfect fun.

[![Deploy to GitHub Pages](https://github.com/Title5656/minigame-center-web/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Title5656/minigame-center-web/actions/workflows/deploy-pages.yml)
[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://title5656.github.io/minigame-center-web/)
[![Vite](https://img.shields.io/badge/bundler-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/ES_Modules-Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌐 Live Demo

Play the games directly in your browser without any installation:  
👉 **[https://title5656.github.io/minigame-center-web/](https://title5656.github.io/minigame-center-web/)**

---

## 📖 Table of Contents

- [Features](#-features)
- [Games Showcase & Controls](#-games-showcase--controls)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Local Development](#local-development)
- [Available Scripts](#-available-scripts)
- [Adding a New Game](#-adding-a-new-game)
- [Deployment](#-deployment)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License](#-license)

---

## ✨ Features

- **🎮 9 Playable Mini-Games:** Spanning arcade classics, fast-paced reflex challenges, memory puzzles, and precision stacking.
- **🎨 Neon-Retro Aesthetics:** Custom CRT scanlines, neon glows, responsive pixel grids, and dynamic transitions built with pure CSS.
- **⚡ Lightweight & Fast:** Built entirely with **Vanilla JavaScript (ES Modules)** and **HTML5 Canvas**—zero heavyweight frontend frameworks.
- **📦 Multi-Page Architecture:** Vite multi-page configuration with dynamic game module loaders to ensure minimal initial bundle size.
- **📱 Responsive & Accessible:** Fully responsive arcade shell optimized for desktop keyboard controls and mobile/touch inputs.
- **🤖 Automated CI/CD:** GitHub Actions pipeline running linter, unit test suites, and production builds with automatic deployment to GitHub Pages.

---

## 🎮 Games Showcase & Controls

| Game | Category | Description | Controls |
|------|----------|-------------|----------|
| **Breakout** | Classic Arcade | Bounce the ball, destroy brick formations, and avoid losing your life. | <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> |
| **Snake** | Retro Classic | Eat glowing food pellets to grow longer without running into walls or your tail. | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> |
| **Memory Match** | Puzzle | Flip cards to test your spatial memory and discover matching symbol pairs. | Click / Tap cards |
| **Pixel Runner** | Endless Runner | Leap over obstacles at increasing speeds to survive as long as possible. | <kbd>Space</kbd> or Click |
| **Astro Dodge** | Action / Reflex | Pilot your starship and weave through a barrage of incoming asteroid fields. | <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> |
| **Tower Drop** | Timing / Precision | Drop swinging blocks precisely on top of each other to stack the tallest tower. | <kbd>Space</kbd> or `Drop` button |
| **Hex Slide** | Sliding Puzzle | Reorder sliding number tiles into the correct sequential numerical order. | Arrow keys or Click |
| **Orbit Tap** | Quick Reflex | Track the orbital target and tap the glowing orb before the countdown expires. | Click / Tap orb |
| **Light Trails** | Sequence Memory | Memorize and repeat an expanding sequence of flashing lights and tones. | Repeat sequence |

---

## 🛠️ Tech Stack

- **Core:** Vanilla JavaScript (ES6+ Modules), HTML5 Canvas, Semantic HTML5
- **Styling:** Pure CSS (CSS Variables, Design Tokens, Flexbox/Grid, CRT Effects)
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)
- **Code Quality:** [ESLint](https://eslint.org/)
- **Testing:** Custom zero-dependency Node.js unit and regression test suite
- **CI/CD & Hosting:** GitHub Actions + GitHub Pages

---

## 📂 Project Architecture

```
minigame-center-web/
├── index.html            # Arcade homepage & game roster
├── play.html             # Dedicated game arena player shell
├── 404.html              # Custom 404 error page
├── vite.config.js        # Multi-page setup and repository base path
├── package.json          # Project metadata, scripts, and dependencies
├── public/
│   └── .nojekyll         # Disables Jekyll processing on GitHub Pages
├── src/
│   ├── main.js           # Homepage controller & card grid generator
│   ├── play.js           # Play shell dynamic game module loader
│   ├── data/
│   │   └── games.js      # Central game registry (single source of truth)
│   ├── ui/
│   │   ├── transition.js # Pixel-wipe screen transition controller
│   │   ├── game-card.js  # Homepage game card component
│   │   └── game-nav.js   # In-game switcher dropdown & navigation
│   ├── utils/
│   │   └── colors.js     # CSS token resolver with safe fallbacks
│   ├── games/            # Self-contained game modules
│   │   ├── breakout/     # Breakout game logic & rendering
│   │   ├── snake/        # Snake game logic & grid movement
│   │   ├── memory/       # Memory Match card grid & flip logic
│   │   ├── runner/       # Pixel Runner engine & collision detection
│   │   ├── dodge/        # Astro Dodge physics & asteroid spawner
│   │   ├── tower/        # Tower Drop pendulum & stacking logic
│   │   ├── hex/          # Hex Slide tile puzzle solver
│   │   ├── orbit/        # Orbit Tap timer & circular animation
│   │   └── trail/        # Light Trails sequence generator
│   └── styles/
│       ├── index.css     # Master stylesheet
│       ├── variables.css # Neon theme tokens & color variables
│       ├── base.css      # Reset, CRT scanlines, and pixel backgrounds
│       ├── layout.css    # Header, hero, arcade grid, and viewport layout
│       ├── components.css# Buttons, cards, pixel borders, and badges
│       └── games.css     # Game canvas, board wrappers, and scoreboards
├── tests/
│   └── run-tests.js      # Unit and regression test suite
└── .github/
    └── workflows/
        └── deploy-pages.yml # CI/CD: lint -> test -> build -> deploy dist/
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed:
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Title5656/minigame-center-web.git
   cd minigame-center-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development

Start the local Vite development server:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173/minigame-center-web/
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles and bundles production-ready static assets into `dist/`. |
| `npm run preview` | Serves the production build locally to test behavior before deploying. |
| `npm test` | Runs the automated unit and regression test suite. |
| `npm run lint` | Analyzes code in `src/` for errors and style violations using ESLint. |
| `npm run lint:fix` | Automatically fixes autofixable ESLint errors. |
| `npm run check` | Runs linting, tests, and build check in sequence (`lint && test && build`). |

---

## 🧩 Adding a New Game

The project uses a modular plugin-like structure. Adding a new game requires just four simple steps:

### 1. Create the Game Module
Create a new folder `src/games/<slug>/` with an `index.js` file exposing a `mount` function:
```javascript
// src/games/<slug>/index.js
export function mount(root) {
  // 1. Render DOM structure / canvas inside 'root'
  root.innerHTML = `
    <div class="arcade-screen">
      <canvas id="myCanvas" width="480" height="320"></canvas>
    </div>
  `;

  // 2. Initialize game loop and event listeners
  // ...

  // 3. Return a teardown/cleanup handler
  return {
    destroy() {
      // Clean up intervals, requestAnimationFrame loops, and listeners
    }
  };
}
```

### 2. Register in Central Registry
Add metadata for the game to `src/data/games.js`:
```javascript
{
  slug: '<slug>',
  name: 'Game Name',
  description: 'Short gameplay description.',
  controls: 'Controls summary'
}
```

### 3. Register Dynamic Loader
Add the game loader to `gameLoaders` inside `src/play.js`:
```javascript
'<slug>': () => import('./games/<slug>/index.js')
```

### 4. (Optional) Add Regression Tests
Add game logic validation in `tests/run-tests.js` to ensure stability across builds.

Once added, the game automatically shows up on the homepage roster, navigation bar, and switcher dropdown!

---

## 🚢 Deployment

Deployment is completely automated with **GitHub Actions** and **GitHub Pages**.

### CI/CD Workflow
Every push to the `main` branch triggers [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml):
1. Checks out the repository and installs dependencies (`npm ci`).
2. Runs the validation pipeline (`npm run check`: lint + test + build).
3. Packages the static output from `dist/`.
4. Deploys the latest build directly to **GitHub Pages**.

### First-Time Repository Setup
If deploying from a new fork or repo, ensure GitHub Pages is enabled:
1. Go to repository **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Re-run the deployment workflow under the **Actions** tab or push a new commit to `main`.

---

## 🧪 Testing & Quality Assurance

Run the test suite locally:
```bash
npm run check
```
This runs:
- **ESLint:** Enforces clean, modern ES module standards.
- **Node Test Runner:** Validates canvas collision boundaries, time clamping, game loops, and edge cases.
- **Vite Build Verification:** Verifies multi-page asset resolution and tree-shaking.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).