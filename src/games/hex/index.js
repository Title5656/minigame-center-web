import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playBlip, playWin, playTone } from '../../utils/audio.js';

export const hexGame = {
  tiles: [],
  empty: 15,
  moves: 0,
  best: 0,
  seconds: 0,
  timer: null,
  active: false
};

let gridEl = null;
let movesEl = null;
let bestEl = null;
let timeEl = null;
let statusEl = null;

export function renderHex() {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  hexGame.tiles.forEach((value, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `hex-tile${value === 0 ? ' empty' : ''}`;
    btn.textContent = value === 0 ? '' : String(value);
    btn.addEventListener('click', () => tryMoveHex(index));
    gridEl.appendChild(btn);
  });
}

export function getHexNeighbors(index) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  const neighbors = [];
  if (row > 0) neighbors.push(index - 4);
  if (row < 3) neighbors.push(index + 4);
  if (col > 0) neighbors.push(index - 1);
  if (col < 3) neighbors.push(index + 1);
  return neighbors;
}

export function startHexTimer() {
  if (hexGame.timer) return;
  hexGame.timer = setInterval(() => {
    hexGame.seconds += 1;
    if (timeEl) timeEl.textContent = String(hexGame.seconds);
  }, 1000);
}

export function pauseHex() {
  if (hexGame.timer) {
    clearInterval(hexGame.timer);
    hexGame.timer = null;
  }
  hexGame.active = false;
}

export function swapHex(index) {
  [hexGame.tiles[index], hexGame.tiles[hexGame.empty]] = [hexGame.tiles[hexGame.empty], hexGame.tiles[index]];
  hexGame.empty = index;
}

export function tryMoveHex(index) {
  if (!getHexNeighbors(hexGame.empty).includes(index)) return;
  if (!hexGame.active) {
    hexGame.active = true;
    startHexTimer();
  }
  swapHex(index);
  hexGame.moves += 1;
  playBlip();
  if (movesEl) movesEl.textContent = String(hexGame.moves);
  renderHex();
  checkHexSolved();
}

export function moveHexByKey(key) {
  const row = Math.floor(hexGame.empty / 4);
  const col = hexGame.empty % 4;
  let target = null;
  if ((key === 'ArrowUp' || key === 'w' || key === 'W') && row < 3) target = hexGame.empty + 4;
  if ((key === 'ArrowDown' || key === 's' || key === 'S') && row > 0) target = hexGame.empty - 4;
  if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && col < 3) target = hexGame.empty + 1;
  if ((key === 'ArrowRight' || key === 'd' || key === 'D') && col > 0) target = hexGame.empty - 1;
  if (target !== null) tryMoveHex(target);
}

export function checkHexSolved() {
  for (let i = 0; i < 15; i++) {
    if (hexGame.tiles[i] !== i + 1) return;
  }
  if (hexGame.tiles[15] !== 0) return;
  pauseHex();
  playWin();
  const best = saveBestScore('hex_moves', hexGame.moves, true);
  hexGame.best = best;
  if (bestEl) bestEl.textContent = String(best);
  if (statusEl) statusEl.textContent = `Solved in ${hexGame.moves} moves · ${hexGame.seconds}s`;
}

export function shuffleHex() {
  hexGame.tiles = [...Array(15).keys()].map((i) => i + 1).concat(0);
  hexGame.empty = 15;
  for (let i = 0; i < 200; i++) {
    const neighbors = getHexNeighbors(hexGame.empty);
    const choice = neighbors[Math.floor(Math.random() * neighbors.length)];
    swapHex(choice);
  }
  hexGame.moves = 0;
  hexGame.seconds = 0;
  hexGame.active = false;
  hexGame.best = getBestScore('hex_moves', 0);
  pauseHex();
  playTone(400, 'square', 0.08, 0.05);
  if (movesEl) movesEl.textContent = '0';
  if (bestEl) bestEl.textContent = hexGame.best > 0 ? String(hexGame.best) : '-';
  if (timeEl) timeEl.textContent = '0';
  if (statusEl) statusEl.textContent = 'Slide tiles with arrow keys, WASD, or taps.';
  renderHex();
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Hex Slide</div>
        <div class="game-meta">
          <div>Moves<strong id="hexMoves">0</strong></div>
          <div>Best<strong id="hexBest">-</strong></div>
          <div>Time<strong><span id="hexTime">0</span>s</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <div class="hex-grid" id="hexGrid" aria-label="Hex slide puzzle grid"></div>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="hexShuffle">Shuffle</button>
          <button class="control-btn" id="hexReset">Reset</button>
          <div class="hint" id="hexStatus" aria-live="polite">Slide tiles with arrow keys, WASD, or taps.</div>
        </div>
      </div>
    </div>
  `;

  gridEl = root.querySelector('#hexGrid');
  movesEl = root.querySelector('#hexMoves');
  bestEl = root.querySelector('#hexBest');
  timeEl = root.querySelector('#hexTime');
  statusEl = root.querySelector('#hexStatus');
  const shuffleBtn = root.querySelector('#hexShuffle');
  const resetBtn = root.querySelector('#hexReset');

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
      moveHexByKey(e.key);
      e.preventDefault();
    }
  }

  shuffleBtn?.addEventListener('click', shuffleHex);
  resetBtn?.addEventListener('click', shuffleHex);
  window.addEventListener('keydown', onKeyDown);

  shuffleHex();

  return {
    destroy() {
      pauseHex();
      shuffleBtn?.removeEventListener('click', shuffleHex);
      resetBtn?.removeEventListener('click', shuffleHex);
      window.removeEventListener('keydown', onKeyDown);
      gridEl = null;
      movesEl = null;
      bestEl = null;
      timeEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
