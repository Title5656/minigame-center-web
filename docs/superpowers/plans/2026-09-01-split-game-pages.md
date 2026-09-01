# Split Arcade into Separate Game Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-page 9-tab arcade hub into a game menu (`index.html`) plus one reusable game page (`play.html?game=<slug>`) with Home and Change Game navigation.

**Architecture:** `index.html` becomes a grid of game cards that link to `play.html?game=<slug>`. `play.html` reads the `?game` query param, renders only the matching game panel, and provides Home (→ `index.html`) and a Change Game dropdown. JS splits into `js/menu.js` (menu page) and `js/games.js` (game page: URL loader + existing game logic). The block-transition effect runs on game-page load.

**Tech Stack:** Vanilla JS (ES6+), HTML5 canvas, static CSS, Node-based regression tests, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-01-split-game-pages-design.md`

## Global Constraints

- Zero runtime dependencies; static files served as-is to GitHub Pages.
- Keep all 9 games and their `.reset()/start()/pause()` functions and state objects intact so `tests/run-tests.js` (which runs `js/games.js` headlessly) keeps passing.
- CSP in both HTML files: `default-src 'self'; ... script-src 'self'` (no inline scripts).
- Match existing style: `'use strict';`, 2-space indent, single quotes, `const`/arrow functions, no comments.
- `npm run lint`, `npm test`, `npm run check` must pass.
- Commit per task.

---

### Task 1: Add game-card and game-nav CSS

**Files:**
- Modify: `css/style.css` (append new sections near existing `.roster`/`.control-btn` styles)

**Interfaces:**
- Produces: classes `.game-card`, `.game-card-grid`, `.game-nav`, `.game-nav select`, `.game-nav a`, `.not-found` used by later tasks.

- [ ] **Step 1: Append the new styles**

```css
/* Game menu cards */
.game-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.2rem}
.game-card{
  display:block;border:1px solid var(--border);background:var(--surface-2);
  padding:1.4rem;color:var(--text);cursor:pointer;text-decoration:none;
  transition:all 0.2s ease;font-family:'Press Start 2P','DM Sans',sans-serif;
}
.game-card:hover,.game-card:focus-visible{
  border-color:var(--accent);background:var(--accent-soft);
  box-shadow:0 0 18px rgba(247,201,85,0.3);outline:none;
}
.game-card .gc-name{font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;display:block;margin-bottom:0.6rem}
.game-card .gc-desc{font-size:0.55rem;color:var(--muted);font-family:'DM Sans',sans-serif;letter-spacing:0}

/* Game page nav bar */
.game-nav{
  display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;
  margin-bottom:1.6rem;
}
.game-nav .back-link{
  font-family:'Press Start 2P','DM Sans',sans-serif;font-size:0.6rem;letter-spacing:0.15em;
  text-transform:uppercase;color:var(--text);border:1px solid var(--border);
  background:var(--surface-2);padding:0.7rem 1rem;cursor:pointer;transition:all 0.2s ease;
}
.game-nav .back-link:hover,.game-nav .back-link:focus-visible{border-color:var(--accent);background:var(--accent-soft)}
.game-nav .switch-wrap{display:flex;align-items:center;gap:0.6rem;color:var(--muted);font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;font-family:'Press Start 2P','DM Sans',sans-serif}
.game-nav select{
  font-family:'Press Start 2P','DM Sans',sans-serif;font-size:0.55rem;letter-spacing:0.12em;
  background:var(--surface-2);color:var(--text);border:1px solid var(--border);padding:0.55rem 0.6rem;cursor:pointer;
}

/* Game not found */
.not-found{text-align:center;padding:3rem 0;color:var(--muted)}
.not-found .back-link{font-family:'Press Start 2P','DM Sans',sans-serif;font-size:0.6rem;color:var(--accent)}
```

- [ ] **Step 2: Lint CSS (verify no syntax errors by loading the file in a browser is optional; here just confirm no ESLint involvement)**

Run: `npm run lint`
Expected: passes (CSS isn't linted, but confirm JS lint untouched).

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add game card and game nav styles"
```

---

### Task 2: Create `js/menu.js`

**Files:**
- Create: `js/menu.js`

**Interfaces:**
- Consumes: block-transition DOM (`#blockTransition`) and `.game-card` anchors from `index.html` (created in Task 4).
- Produces: on-card-click block transition that then navigates to `play.html?game=<slug>`; home/section nav transitions. Guarded (no-ops) if the menu elements are absent.

- [ ] **Step 1: Write the file**

```javascript
'use strict';

const blockTransition = document.getElementById('blockTransition');
const blockRows = 8;
const blockCols = 12;
let pixelBusy = false;

function buildBlockTransition(){
  if(!blockTransition) return;
  blockTransition.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let r=0;r<blockRows;r++){
    for(let c=0;c<blockCols;c++){
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      const delay = ((blockRows - 1 - r) * 0.004) + (c * 0.012);
      cell.style.setProperty('--delay', `${delay.toFixed(3)}s`);
      cell.style.setProperty('--hue', `${(c * 22 + r * 13) % 360}`);
      frag.appendChild(cell);
    }
  }
  blockTransition.appendChild(frag);
}

function runBlockTransition(onMid){
  if(!blockTransition || pixelBusy){
    if(onMid) onMid();
    return;
  }
  pixelBusy = true;
  blockTransition.classList.remove('is-exit');
  blockTransition.classList.add('is-active');
  setTimeout(()=>{
    if(onMid) onMid();
    blockTransition.classList.remove('is-active');
    blockTransition.classList.add('is-exit');
    setTimeout(()=>{
      blockTransition.classList.remove('is-exit');
      pixelBusy = false;
    },400);
  },550 + ((blockCols - 1) * 0.012 + (blockRows - 1) * 0.004) * 1000);
}

buildBlockTransition();

document.querySelectorAll('.game-card').forEach(card=>{
  card.addEventListener('click', e=>{
    const href = card.getAttribute('href');
    if(!href) return;
    e.preventDefault();
    runBlockTransition(()=>{ window.location.href = href; });
  });
});

document.querySelectorAll('nav a').forEach(a=>{
  a.addEventListener('click', e=>{
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')){
      e.preventDefault();
      runBlockTransition(()=>{
        document.querySelector(href)?.scrollIntoView({behavior:'smooth'});
      });
    }
  });
});
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add js/menu.js
git commit -m "feat: add game menu script with block transition navigation"
```

---

### Task 3: Refactor `js/games.js` for the game page

**Files:**
- Modify: `js/games.js` (top block: remove tab logic; add URL loader + nav wiring + on-load transition; keep all game implementations below unchanged)

**Interfaces:**
- Consumes: `play.html` DOM (game panels, `#blockTransition`, `#gameNavSelect`, `#backHome`) and `?game=` query param.
- Produces: `activeGame` (slug), panel activation, Home/Change Game behavior, game list `GAME_SLUGS`. The game functions/state (`breakout`, `snakeGame`, etc.) remain unchanged for tests.

- [ ] **Step 1: Replace the top-of-file orchestration (lines 3–123 region)**

Remove the tab/panel/listener code that references `tabButtons`, `gamePanels` tab switching, `.tab-btn`, `role="tablist"`, and the `nav a` smooth-scroll block. Replace with:

```javascript
'use strict';

const blockTransition = document.getElementById('blockTransition');
const blockRows = 8;
const blockCols = 12;
let pixelBusy = false;
let activeGame = 'breakout';

const GAME_SLUGS = ['breakout','snake','memory','runner','dodge','tower','hex','orbit','trail'];

function buildBlockTransition(){
  if(!blockTransition) return;
  blockTransition.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let r=0;r<blockRows;r++){
    for(let c=0;c<blockCols;c++){
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      const delay = ((blockRows - 1 - r) * 0.004) + (c * 0.012);
      cell.style.setProperty('--delay', `${delay.toFixed(3)}s`);
      cell.style.setProperty('--hue', `${(c * 22 + r * 13) % 360}`);
      frag.appendChild(cell);
    }
  }
  blockTransition.appendChild(frag);
}

function runBlockTransition(onMid){
  if(!blockTransition || pixelBusy){
    if(onMid) onMid();
    return;
  }
  pixelBusy = true;
  blockTransition.classList.remove('is-exit');
  blockTransition.classList.add('is-active');
  setTimeout(()=>{
    if(onMid) onMid();
    blockTransition.classList.remove('is-active');
    blockTransition.classList.add('is-exit');
    setTimeout(()=>{
      blockTransition.classList.remove('is-exit');
      pixelBusy = false;
    },400);
  },550 + ((blockCols - 1) * 0.012 + (blockRows - 1) * 0.004) * 1000);
}

buildBlockTransition();

function pauseAllGames(){
  pauseBreakout(); pauseSnake(); pauseRunner();
  pauseDodge(); pauseTower(); pauseOrbit();
  pauseTrail(); pauseMemory(); pauseHex();
}

function showGameNow(game){
  activeGame = game;
  document.querySelectorAll('.game-panel').forEach(panel=>{
    const active = panel.dataset.game === game;
    panel.classList.toggle('is-active', active);
  });
}

const params = new URLSearchParams(window.location.search);
const requestedGame = params.get('game');
const game = GAME_SLUGS.includes(requestedGame) ? requestedGame : null;

if(game){
  const navSelect = document.getElementById('gameNavSelect');
  const backHome = document.getElementById('backHome');
  GAME_SLUGS.forEach(slug=>{
    if(navSelect){
      const opt = document.createElement('option');
      opt.value = slug;
      opt.textContent = slug.charAt(0).toUpperCase() + slug.slice(1);
      if(slug === game) opt.selected = true;
      navSelect.appendChild(opt);
    }
  });
  if(navSelect){
    navSelect.addEventListener('change', ()=>{
      runBlockTransition(()=>{ window.location.href = `play.html?game=${navSelect.value}`; });
    });
  }
  if(backHome){
    backHome.addEventListener('click', e=>{
      e.preventDefault();
      runBlockTransition(()=>{ window.location.href = 'index.html'; });
    });
  }
  showGameNow(game);
  runBlockTransition(()=>{
    const panel = document.querySelector(`.game-panel.is-active`);
    if(panel) panel.classList.add('is-ready');
  });
}else{
  document.querySelectorAll('.game-panel').forEach(p=>p.classList.remove('is-active'));
  const navEl = document.getElementById('gameNav');
  if(navEl) navEl.style.display = 'none';
  const title = document.querySelector('.game-title');
  if(title) title.textContent = 'Game Not Found';
  const shell = document.querySelector('.arcade-shell');
  if(shell) shell.classList.add('not-found');
}
```

Note: `pauseAllGames` is called on `beforeunload` (see Step 2) so no game keeps its interval/timer running between navigations.

- [ ] **Step 2: Add beforeunload pause and keep game logic intact below**

After the replaced top block, add:

```javascript
window.addEventListener('beforeunload', ()=>{ pauseAllGames(); });
```

Ensure the 9 game implementations (Breakout through Light Trails) remain exactly as-is below this top block. The earlier performance edits (Orbit without rAF, guarded DOM writes, DocumentFragment in `buildBlockTransition`) remain.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: passes. Watch for unused `gamePanels`/`tabButtons` references being removed cleanly.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass. The test harness loads `js/games.js`; it now calls `window.location.search` and `document.querySelectorAll`, and adds a `window.addEventListener`. The harness's mocked `document`/`window` must support these — update `tests/run-tests.js` in Task 5 if needed.

- [ ] **Step 5: Commit**

```bash
git add js/games.js
git commit -m "refactor: load single game from URL with Home/Change nav on play page"
```

---

### Task 4: Rewrite `index.html` as the game menu, create `play.html`

**Files:**
- Modify: `index.html` (remove 9-tab arcade section + all game DOM; add `.game-card-grid`; add block transition div + script tags)
- Create: `play.html` (page shell + all 9 game panels moved from index + nav bar + block transition)

**Interfaces:**
- Consumes: `js/menu.js` (index), `js/games.js` (play), CSS classes from Task 1.
- Produces: `play.html` panels with `data-game` slug matching GAME_SLUGS, `#gameNav`, `#gameNavSelect`, `#backHome`, `#blockTransition`.

- [ ] **Step 1: Rewrite `index.html`**

Replace the entire file with a menu page:
- Keep `<head>` (fonts, CSP, stylesheet). Add `<script src="js/menu.js" defer></script>` before `</body>` (note: CSP `script-src 'self'` allows it).
- Keep header nav, hero, and stats.
- Add block transition div: `<div id="blockTransition" aria-hidden="true"></div>`.
- Replace the old `#arcade` section with a menu grid of 9 `.game-card` anchors:

```html
<section id="games">
  <div class="section-title">Choose A Game</div>
  <p class="section-sub">Pick a game to start. Each game opens on its own page.</p>
  <div class="game-card-grid">
    <a class="game-card" href="play.html?game=breakout"><span class="gc-name">Breakout</span><span class="gc-desc">Bounce the ball, clear all bricks.</span></a>
    <a class="game-card" href="play.html?game=snake"><span class="gc-name">Snake</span><span class="gc-desc">Grow by eating food, avoid walls.</span></a>
    <a class="game-card" href="play.html?game=memory"><span class="gc-name">Memory Match</span><span class="gc-desc">Flip cards to find matching pairs.</span></a>
    <a class="game-card" href="play.html?game=runner"><span class="gc-name">Pixel Runner</span><span class="gc-desc">Jump the obstacles, keep running.</span></a>
    <a class="game-card" href="play.html?game=dodge"><span class="gc-name">Astro Dodge</span><span class="gc-desc">Dodge incoming asteroids.</span></a>
    <a class="game-card" href="play.html?game=tower"><span class="gc-name">Tower Drop</span><span class="gc-desc">Stack the blocks neatly.</span></a>
    <a class="game-card" href="play.html?game=hex"><span class="gc-name">Hex Slide</span><span class="gc-desc">Slide tiles to solve the puzzle.</span></a>
    <a class="game-card" href="play.html?game=orbit"><span class="gc-name">Orbit Tap</span><span class="gc-desc">Tap the orb before time runs out.</span></a>
    <a class="game-card" href="play.html?game=trail"><span class="gc-name">Light Trails</span><span class="gc-desc">Repeat the light sequence.</span></a>
  </div>
</section>
```

- Keep the Lineup and How It Works sections (update copy to mention separate pages).

- [ ] **Step 2: Create `play.html`**

Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head> (same head as index: fonts, CSP, stylesheet) </head>
<body>
  <a href="index.html" class="skip-link">Back to home</a>
  <div class="bg-pixels" aria-hidden="true"> (same 5 sprites ) </div>
  <div id="blockTransition" aria-hidden="true"></div>
  <header>
    <div class="container nav">
      <div class="logo">ARCADE</div>
      <nav class="nav-links" aria-label="Site navigation">
        <a href="index.html">Home</a>
        <a href="index.html#games">All Games</a>
      </nav>
    </div>
  </header>
  <main class="container">
    <section>
      <div class="game-nav" id="gameNav">
        <button class="back-link" id="backHome" type="button">← Home</button>
        <div class="switch-wrap"><span>Switch Game</span><select id="gameNavSelect" aria-label="Switch game"></select></div>
      </div>
      <div class="arcade-shell">
        (the 9 game-panel sections, each `<div class="game-panel" data-game="slug">`, copied verbatim from the original index.html)
      </div>
    </section>
  </main>
  <footer class="container">Arcade Mini Game Center · Pixel Arcade Theme</footer>
  <script src="js/games.js"></script>
</body>
</html>
```

Copy the 9 game-panel markup exactly from the current `index.html` (Breakout ... Light Trails), including all canvas elements and control IDs.

- [ ] **Step 3: Lint (JS not changed here; verify HTML loads)**

Run: `npm run lint && npm test`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add index.html play.html
git commit -m "feat: split arcade into game menu and per-game page"
```

---

### Task 5: Update test harness and CI for new structure

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `.github/workflows/deploy-pages.yml` (stage `play.html`)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: new `js/games.js` top block (uses `window.location`, `document.querySelectorAll`, `window.addEventListener`).
- Produces: test-mock support for `window.location.search`, `window.addEventListener`, `document.querySelectorAll`, `URLSearchParams`; CI deploys `play.html`.

- [ ] **Step 1: Extend the vm context in `tests/run-tests.js`**

In the `context` object (around line 71-98), add:
- `window: { location: { search: '?game=breakout' }, addEventListener: () => {} }`
- `location: { search: '?game=breakout' }`
- Make `document.querySelectorAll` also return the tab/panel collections for `.game-panel` (already handled), and return a small array for `#gameNav` lookups is not needed since code uses `getElementById`.
- Add `URLSearchParams` by injecting a minimal polyfill or pointing to a stub that `.get('game')` returns the passed value. Simplest: add `URLSearchParams: class { constructor(s){} get(k){ return k==='game' ? 'breakout' : null; } }` to the context.

Ensure `document.getElementById` returns elements for the new IDs used at top (`gameNavSelect`, `backHome`, `gameNav`) — the existing `getEl` auto-creates any id via `makeElement`, and `makeElement` already provides `addEventListener`, so those calls resolve.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npm test`
Expected: `8 passed, 0 failed` and `All tests passed`.

- [ ] **Step 3: Update deploy workflow to stage `play.html`**

In `.github/workflows/deploy-pages.yml`, find the artifact-staging step and add `play.html` alongside `index.html`.

- [ ] **Step 4: Update `.gitignore`**

No change required (no build artifacts), but confirm `play.html` is not ignored.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: lint + tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/run-tests.js .github/workflows/deploy-pages.yml
git commit -m "test: support game-page loader and deploy play.html"
```

---

### Task 6: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Serve locally**

Run: `python3 -m http.server 8000` in the repo root.

- [ ] **Step 2: Verify menu -> game**

Open `http://localhost:8000/`. Click a game card → transition plays → lands on `play.html?game=<slug>` showing only that game's panel.

- [ ] **Step 3: Verify Home and Change Game**

On a game page: click "← Home" → returns to `index.html`. Use "Switch Game" dropdown → navigates to another game.

- [ ] **Step 4: Verify unknown game**

Open `http://localhost:8000/play.html?game=nope` → shows "Game Not Found" / `.not-found` panel, no crash.

- [ ] **Step 5: Verify each game functions**

For each of the 9 slugs, confirm the canvas/DOM renders and Start/Reset work.

- [ ] **Step 6: Verify block transition on load**

Reload a game page → transition plays once, then game revealed.
