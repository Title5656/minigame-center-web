import { getGameColors } from '../../utils/colors.js';
import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playJump, playHit, playBlip } from '../../utils/audio.js';

export const runnerGame = {
  running: false,
  score: 0,
  best: 0,
  speed: 3.2,
  gravity: 0.5,
  jump: -9,
  ground: 280 - 28,
  player: { x: 60, y: 0, w: 24, h: 28, vy: 0 },
  obstacles: [],
  spawnTimer: 0,
  raf: 0,
  lastTime: 0
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let statusEl = null;
let colors = getGameColors();

export function resetRunner() {
  const height = canvas?.height || 280;
  runnerGame.ground = height - 28;
  runnerGame.running = false;
  runnerGame.score = 0;
  runnerGame.best = getBestScore('runner', 0);
  runnerGame.player.y = runnerGame.ground - runnerGame.player.h;
  runnerGame.player.vy = 0;
  runnerGame.obstacles = [];
  runnerGame.spawnTimer = 0;
  if (scoreEl) scoreEl.textContent = '0';
  if (bestEl) bestEl.textContent = String(runnerGame.best);
  if (statusEl) statusEl.textContent = 'Press Start. Space, ↑ or Click to jump.';
  drawRunner();
}

export function spawnRunnerObstacle() {
  const width = 18 + Math.random() * 16;
  const height = 18 + Math.random() * 22;
  const canvasWidth = canvas?.width || 720;
  runnerGame.obstacles.push({
    x: canvasWidth + 20,
    y: runnerGame.ground - height,
    w: width,
    h: height
  });
}

export function drawRunner() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.cyanDim;
  ctx.fillRect(0, runnerGame.ground, canvas.width, 2);
  ctx.fillStyle = colors.text;
  ctx.fillRect(runnerGame.player.x, runnerGame.player.y, runnerGame.player.w, runnerGame.player.h);
  ctx.fillStyle = colors.pink;
  runnerGame.obstacles.forEach((obs) => {
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
  });
}

export function updateRunner(delta) {
  runnerGame.score += delta * 0.02;
  const newScore = String(Math.floor(runnerGame.score));
  if (scoreEl && scoreEl.textContent !== newScore) scoreEl.textContent = newScore;
  if (runnerGame.score > runnerGame.best) {
    runnerGame.best = Math.floor(runnerGame.score);
    saveBestScore('runner', runnerGame.best);
    const bestStr = String(runnerGame.best);
    if (bestEl && bestEl.textContent !== bestStr) bestEl.textContent = bestStr;
  }

  runnerGame.spawnTimer += delta;
  if (runnerGame.spawnTimer > 1100) {
    spawnRunnerObstacle();
    runnerGame.spawnTimer = 0;
  }

  runnerGame.player.vy += runnerGame.gravity;
  runnerGame.player.y += runnerGame.player.vy;
  if (runnerGame.player.y > runnerGame.ground - runnerGame.player.h) {
    runnerGame.player.y = runnerGame.ground - runnerGame.player.h;
    runnerGame.player.vy = 0;
  }

  runnerGame.obstacles.forEach((obs) => {
    obs.x -= runnerGame.speed;
  });
  runnerGame.obstacles = runnerGame.obstacles.filter((obs) => obs.x + obs.w > 0);

  const p = runnerGame.player;
  for (const obs of runnerGame.obstacles) {
    if (
      p.x < obs.x + obs.w &&
      p.x + p.w > obs.x &&
      p.y < obs.y + obs.h &&
      p.y + p.h > obs.y
    ) {
      runnerGame.running = false;
      playHit();
      if (statusEl) statusEl.textContent = 'Game Over. Press Reset.';
      return;
    }
  }
}

export function runnerLoop(timestamp) {
  if (!runnerGame.running) return;
  if (!runnerGame.lastTime) runnerGame.lastTime = timestamp;
  const delta = Math.min(timestamp - runnerGame.lastTime, 100);
  runnerGame.lastTime = timestamp;
  updateRunner(delta);
  drawRunner();
  if (runnerGame.running) {
    runnerGame.raf = requestAnimationFrame(runnerLoop);
  }
}

export function startRunner() {
  if (runnerGame.running) return;
  runnerGame.running = true;
  runnerGame.lastTime = 0;
  playBlip();
  if (statusEl) statusEl.textContent = 'Playing...';
  runnerLoop(performance.now());
}

export function pauseRunner() {
  runnerGame.running = false;
  if (runnerGame.raf) {
    cancelAnimationFrame(runnerGame.raf);
    runnerGame.raf = 0;
  }
}

export function runnerJump() {
  if (!runnerGame.running) return;
  if (runnerGame.player.y >= runnerGame.ground - runnerGame.player.h - 1) {
    runnerGame.player.vy = runnerGame.jump;
    playJump();
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Pixel Runner</div>
        <div class="game-meta">
          <div>Score<strong id="runnerScore">0</strong></div>
          <div>Best<strong id="runnerBest">0</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="runnerCanvas" width="720" height="280" aria-label="Pixel runner game canvas" style="touch-action: manipulation; cursor: pointer;"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="runnerStart">Start</button>
          <button class="control-btn" id="runnerReset">Reset</button>
          <div class="hint" id="runnerStatus" aria-live="polite">Press Start. Space, ↑ or click to jump.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#runnerCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#runnerScore');
  bestEl = root.querySelector('#runnerBest');
  statusEl = root.querySelector('#runnerStatus');
  const startBtn = root.querySelector('#runnerStart');
  const resetBtn = root.querySelector('#runnerReset');
  colors = getGameColors();

  function onKeyDown(e) {
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      runnerJump();
      e.preventDefault();
    }
  }

  function onPointerDown() {
    runnerJump();
  }

  startBtn?.addEventListener('click', startRunner);
  resetBtn?.addEventListener('click', resetRunner);
  window.addEventListener('keydown', onKeyDown);
  canvas?.addEventListener('pointerdown', onPointerDown);

  resetRunner();

  return {
    destroy() {
      pauseRunner();
      startBtn?.removeEventListener('click', startRunner);
      resetBtn?.removeEventListener('click', resetRunner);
      window.removeEventListener('keydown', onKeyDown);
      canvas?.removeEventListener('pointerdown', onPointerDown);
      canvas = null;
      ctx = null;
      scoreEl = null;
      bestEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
