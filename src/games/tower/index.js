import { getGameColors } from '../../utils/colors.js';

export const towerGame = {
  running: false,
  score: 0,
  best: 0,
  blockH: 16,
  stack: [],
  current: { x: 0, y: 0, w: 120, dir: 1, speed: 2.4 },
  raf: 0,
  lastTime: 0
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let statusEl = null;
let colors = getGameColors();

export function resetTower() {
  const width = canvas?.width || 440;
  const height = canvas?.height || 320;
  towerGame.running = false;
  towerGame.score = 0;
  towerGame.stack = [
    {
      x: (width - 140) / 2,
      y: height - 26,
      w: 140
    }
  ];
  towerGame.current = {
    x: 0,
    y: towerGame.stack[0].y - towerGame.blockH - 6,
    w: 140,
    dir: 1,
    speed: 2.4
  };
  if (scoreEl) scoreEl.textContent = '0';
  if (statusEl) statusEl.textContent = 'Press Drop or Space to stack the blocks.';
  drawTower();
}

export function drawTower() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.goldDim;
  towerGame.stack.forEach((block) => {
    ctx.fillRect(block.x, block.y, block.w, towerGame.blockH);
  });
  ctx.fillStyle = colors.cyan;
  ctx.fillRect(towerGame.current.x, towerGame.current.y, towerGame.current.w, towerGame.blockH);
}

export function updateTower(scale = 1) {
  if (!towerGame.running) return;
  const width = canvas?.width || 440;
  towerGame.current.x += towerGame.current.dir * towerGame.current.speed * scale;
  if (towerGame.current.x <= 0 || towerGame.current.x + towerGame.current.w >= width) {
    towerGame.current.dir *= -1;
  }
}

export function towerLoop(timestamp) {
  if (!towerGame.lastTime) towerGame.lastTime = timestamp;
  const delta = Math.min(timestamp - towerGame.lastTime, 100);
  towerGame.lastTime = timestamp;
  updateTower(delta / (1000 / 60));
  drawTower();
  if (towerGame.running) {
    towerGame.raf = requestAnimationFrame(towerLoop);
  }
}

export function dropTower() {
  if (!towerGame.running) return;
  const last = towerGame.stack[towerGame.stack.length - 1];
  const left = Math.max(towerGame.current.x, last.x);
  const right = Math.min(towerGame.current.x + towerGame.current.w, last.x + last.w);
  const overlap = right - left;
  if (overlap <= 4) {
    towerGame.running = false;
    if (statusEl) statusEl.textContent = 'Missed! Press Reset.';
    return;
  }
  towerGame.stack.push({ x: left, y: towerGame.current.y, w: overlap });
  towerGame.score += 1;
  if (scoreEl) scoreEl.textContent = String(towerGame.score);
  if (towerGame.score > towerGame.best) {
    towerGame.best = towerGame.score;
    if (bestEl) bestEl.textContent = String(towerGame.best);
  }
  towerGame.current = {
    x: 0,
    y: towerGame.current.y - towerGame.blockH - 6,
    w: overlap,
    dir: 1,
    speed: towerGame.current.speed + 0.08
  };
  if (towerGame.current.y < 20) {
    towerGame.running = false;
    if (statusEl) statusEl.textContent = 'Perfect stack! Press Reset.';
  }
}

export function startTower() {
  if (towerGame.running) return;
  towerGame.running = true;
  towerGame.lastTime = 0;
  if (statusEl) statusEl.textContent = 'Playing...';
  towerLoop(performance.now());
}

export function pauseTower() {
  towerGame.running = false;
  if (towerGame.raf) {
    cancelAnimationFrame(towerGame.raf);
    towerGame.raf = 0;
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Tower Drop</div>
        <div class="game-meta">
          <div>Stacks<strong id="towerScore">0</strong></div>
          <div>Best<strong id="towerBest">0</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="towerCanvas" width="440" height="320" aria-label="Tower drop game canvas"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="towerStart">Start</button>
          <button class="control-btn" id="towerDrop">Drop</button>
          <button class="control-btn" id="towerReset">Reset</button>
          <div class="hint" id="towerStatus" aria-live="polite">Press Drop or Space to stack the blocks.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#towerCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#towerScore');
  bestEl = root.querySelector('#towerBest');
  statusEl = root.querySelector('#towerStatus');
  const startBtn = root.querySelector('#towerStart');
  const dropBtn = root.querySelector('#towerDrop');
  const resetBtn = root.querySelector('#towerReset');
  colors = getGameColors();

  function onKeyDown(e) {
    if (e.code === 'Space') {
      dropTower();
      e.preventDefault();
    }
  }

  startBtn?.addEventListener('click', startTower);
  dropBtn?.addEventListener('click', dropTower);
  resetBtn?.addEventListener('click', resetTower);
  window.addEventListener('keydown', onKeyDown);

  resetTower();

  return {
    destroy() {
      pauseTower();
      startBtn?.removeEventListener('click', startTower);
      dropBtn?.removeEventListener('click', dropTower);
      resetBtn?.removeEventListener('click', resetTower);
      window.removeEventListener('keydown', onKeyDown);
      canvas = null;
      ctx = null;
      scoreEl = null;
      bestEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
