import { getGameColors } from '../../utils/colors.js';
import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playHit, playBlip } from '../../utils/audio.js';

export const dodgeGame = {
  running: false,
  score: 0,
  best: 0,
  ship: { x: 190, y: 290, w: 28, h: 16, speed: 5 },
  asteroids: [],
  spawnTimer: 0,
  raf: 0,
  lastTime: 0,
  keys: { left: false, right: false }
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let statusEl = null;
let colors = getGameColors();

export function resetDodge() {
  const width = canvas?.width || 520;
  const height = canvas?.height || 320;
  dodgeGame.running = false;
  dodgeGame.score = 0;
  dodgeGame.best = getBestScore('dodge', 0);
  dodgeGame.ship.x = (width - dodgeGame.ship.w) / 2;
  dodgeGame.ship.y = height - 30;
  dodgeGame.asteroids = [];
  dodgeGame.spawnTimer = 0;
  if (scoreEl) scoreEl.textContent = '0';
  if (bestEl) bestEl.textContent = String(dodgeGame.best);
  if (statusEl) statusEl.textContent = 'Move with ← → / A D or Drag with Mouse/Touch.';
  drawDodge();
}

export function spawnAsteroid() {
  const width = canvas?.width || 520;
  const size = 10 + Math.random() * 10;
  dodgeGame.asteroids.push({
    x: Math.random() * (width - size),
    y: -size,
    r: size / 2,
    speed: 1.6 + Math.random() * 1.6
  });
}

export function drawDodge() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.text;
  ctx.fillRect(dodgeGame.ship.x, dodgeGame.ship.y, dodgeGame.ship.w, dodgeGame.ship.h);

  ctx.fillStyle = colors.gold;
  dodgeGame.asteroids.forEach((ast) => {
    ctx.beginPath();
    ctx.arc(ast.x + ast.r, ast.y + ast.r, ast.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function updateDodge(delta) {
  const width = canvas?.width || 520;
  const height = canvas?.height || 320;
  const scale = delta / (1000 / 60);

  dodgeGame.score += delta * 0.02;
  const newScore = String(Math.floor(dodgeGame.score));
  if (scoreEl && scoreEl.textContent !== newScore) scoreEl.textContent = newScore;
  if (dodgeGame.score > dodgeGame.best) {
    dodgeGame.best = Math.floor(dodgeGame.score);
    saveBestScore('dodge', dodgeGame.best);
    const bestStr = String(dodgeGame.best);
    if (bestEl && bestEl.textContent !== bestStr) bestEl.textContent = bestStr;
  }

  if (dodgeGame.keys.left) dodgeGame.ship.x = Math.max(0, dodgeGame.ship.x - dodgeGame.ship.speed * scale);
  if (dodgeGame.keys.right) dodgeGame.ship.x = Math.min(width - dodgeGame.ship.w, dodgeGame.ship.x + dodgeGame.ship.speed * scale);

  dodgeGame.spawnTimer += delta;
  if (dodgeGame.spawnTimer > 750) {
    spawnAsteroid();
    dodgeGame.spawnTimer = 0;
  }

  dodgeGame.asteroids.forEach((ast) => {
    ast.y += ast.speed * scale;
  });
  dodgeGame.asteroids = dodgeGame.asteroids.filter((ast) => ast.y < height + 20);

  for (const ast of dodgeGame.asteroids) {
    const hit =
      dodgeGame.ship.x < ast.x + ast.r * 2 &&
      dodgeGame.ship.x + dodgeGame.ship.w > ast.x &&
      dodgeGame.ship.y < ast.y + ast.r * 2 &&
      dodgeGame.ship.y + dodgeGame.ship.h > ast.y;
    if (hit) {
      dodgeGame.running = false;
      playHit();
      if (statusEl) statusEl.textContent = 'Impact! Press Reset.';
      return;
    }
  }
}

export function dodgeLoop(timestamp) {
  if (!dodgeGame.running) return;
  if (!dodgeGame.lastTime) dodgeGame.lastTime = timestamp;
  const delta = Math.min(timestamp - dodgeGame.lastTime, 100);
  dodgeGame.lastTime = timestamp;
  updateDodge(delta);
  drawDodge();
  if (dodgeGame.running) {
    dodgeGame.raf = requestAnimationFrame(dodgeLoop);
  }
}

export function startDodge() {
  if (dodgeGame.running) return;
  dodgeGame.running = true;
  dodgeGame.lastTime = 0;
  playBlip();
  if (statusEl) statusEl.textContent = 'Playing...';
  dodgeLoop(performance.now());
}

export function pauseDodge() {
  dodgeGame.running = false;
  if (dodgeGame.raf) {
    cancelAnimationFrame(dodgeGame.raf);
    dodgeGame.raf = 0;
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Astro Dodge</div>
        <div class="game-meta">
          <div>Score<strong id="dodgeScore">0</strong></div>
          <div>Best<strong id="dodgeBest">0</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="dodgeCanvas" width="520" height="320" aria-label="Astro dodge game canvas" style="touch-action: none; cursor: ew-resize;"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="dodgeStart">Start</button>
          <button class="control-btn" id="dodgeReset">Reset</button>
          <div class="hint" id="dodgeStatus" aria-live="polite">Move with ← → / A D or drag across the screen.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#dodgeCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#dodgeScore');
  bestEl = root.querySelector('#dodgeBest');
  statusEl = root.querySelector('#dodgeStatus');
  const startBtn = root.querySelector('#dodgeStart');
  const resetBtn = root.querySelector('#dodgeReset');
  colors = getGameColors();

  function onKeyDown(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      dodgeGame.keys.left = true;
      e.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      dodgeGame.keys.right = true;
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      dodgeGame.keys.left = false;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      dodgeGame.keys.right = false;
    }
  }

  function onPointerMove(e) {
    if (!canvas || !dodgeGame.running) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const x = (e.clientX - rect.left) * scaleX;
    dodgeGame.ship.x = Math.max(0, Math.min(canvas.width - dodgeGame.ship.w, x - dodgeGame.ship.w / 2));
  }

  startBtn?.addEventListener('click', startDodge);
  resetBtn?.addEventListener('click', resetDodge);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas?.addEventListener('pointermove', onPointerMove);
  canvas?.addEventListener('pointerdown', onPointerMove);

  resetDodge();

  return {
    destroy() {
      pauseDodge();
      startBtn?.removeEventListener('click', startDodge);
      resetBtn?.removeEventListener('click', resetDodge);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas?.removeEventListener('pointermove', onPointerMove);
      canvas?.removeEventListener('pointerdown', onPointerMove);
      canvas = null;
      ctx = null;
      scoreEl = null;
      bestEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
