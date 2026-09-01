# Split Arcade into Separate Game Pages

**Date:** 2026-09-01
**Status:** Design

## Problem

The site currently embeds all 9 games as tabs inside a single `index.html` page, toggled by JS. The user wants each game on its **own page**: clicking a game navigates to that game's page, with navigation back to the home page and between games.

## Goal

- Pressing "Play" on a game in the menu takes the player to that game's dedicated page.
- Each game page supports returning to the home page and switching to another game.
- Preserve the existing neon/pixel theme, the block-transition effect, all 9 games, and the game logic/tests.

## Architecture

Two page types share one CSS file and the game logic:

| Page | Path | Purpose |
|------|------|---------|
| Home / menu | `index.html` | Hero + grid of 9 game cards. Links to `play.html?game=<slug>`. |
| Game page | `play.html` | Reads `?game=<slug>` and renders exactly one game panel, with Home + Change Game navigation. |

### URL flow

```
index.html  --(click card)-->  play.html?game=breakout
play.html   --(Change Game)--> play.html?game=snake
play.html   --(Home)---------> index.html
```

The block transition plays automatically on page load of `play.html`, then reveals the game.

## File / JS structure

- `js/games.js` — keeps all 9 game implementations, global input routing, and a loader that:
  - reads `?game=` from the URL,
  - shows only the matching game panel,
  - wires Home and Change Game controls,
  - pauses all games on unload/switching.
- `js/menu.js` (new) — handles the `index.html` menu: optional block transition on card click and section navigation. Guarded so it does nothing when the menu is absent.
- `css/style.css` — shared; adds styles for `.game-card` (menu grid), `.game-nav` (Home / Change Game bar), reuses existing game/panel styles.
- `index.html` — menu page. Removed the 9-tab arcade section and all game DOM.
- `play.html` — contains the shared page shell + all 9 game panels (moved from old index.html) + nav bar.

## Game slugs

`breakout, snake, memory, runner, dodge, tower, hex, orbit, trail`

## Error handling

- Unknown or missing `?game` on `play.html` → show a friendly "Game not found" panel with a Home link (no crash).

## Testing

- `tests/run-tests.js` continues to run `games.js` headlessly; game-state assertions must still pass.
- `npm run lint`, `npm test`, `npm run check` (CI gate) must pass.
- Manual: load `play.html?game=<each slug>`, verify the right game renders and Home / Change Game work.

## Out of scope

- No score persistence (scores already reset on refresh).
- No new games.
