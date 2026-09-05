import { getGameColors } from '../../utils/colors.js';
import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playCoin, playHit, playBlip } from '../../utils/audio.js';

export const orbitGame = {
  running: false,
  score: 0,
  best: 0,
  time: 20,
  target: { x: 0, y: 0, r: 20 },
  timer: null
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let timeEl = null;
let statusEl = null;
let colors = getGameColors();

export function spawnOrbitTarget() {
  const width = canvas?.width || 480;
  const height = canvas?.height || 320;
  const r = 16 + Math.random() * 12;
  orbitGame.target.r = r;
  orbitGame.target.x = r + Math.random() * (width - r * 2);
  orbitGame.target.y = r + Math.random() * (height - r * 2);
}

export function drawOrbit() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = colors.cyanDim;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(orbitGame.target.x, orbitGame.target.y, orbitGame.target.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = colors.pink;
  ctx.beginPath();
  ctx.arc(orbitGame.target.x, orbitGame.target.y, orbitGame.target.r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

export function startOrbit() {
  if (orbitGame.running) return;
  orbitGame.running = true;
  orbitGame.score = 0;
  orbitGame.time = 20;
  playBlip();
  if (scoreEl) scoreEl.textContent = '0';
  if (timeEl) timeEl.textContent = String(orbitGame.time);
  if (statusEl) statusEl.textContent = 'Go!';
  spawnOrbitTarget();
  clearInterval(orbitGame.timer);
  orbitGame.timer = setInterval(() => {
    orbitGame.time -= 1;
    if (timeEl) timeEl.textContent = String(orbitGame.time);
    drawOrbit();
    if (orbitGame.time <= 0) {
      orbitGame.running = false;
      clearInterval(orbitGame.timer);
      orbitGame.timer = null;
      playHit();
      if (statusEl) statusEl.textContent = 'Time! Press Reset.';
    }
  }, 1000);
  drawOrbit();
}

export function pauseOrbit() {
  orbitGame.running = false;
  if (orbitGame.timer) {
    clearInterval(orbitGame.timer);
    orbitGame.timer = null;
  }
}

export function resetOrbit() {
  pauseOrbit();
  orbitGame.score = 0;
  orbitGame.time = 20;
  orbitGame.best = getBestScore('orbit', 0);
  if (scoreEl) scoreEl.textContent = '0';
  if (bestEl) bestEl.textContent = String(orbitGame.best);
  if (timeEl) timeEl.textContent = '20';
  if (statusEl) statusEl.textContent = 'Click the glowing orb before time runs out.';
  spawnOrbitTarget();
  drawOrbit();
}

export function handleOrbitTap(clientX, clientY) {
  if (!orbitGame.running || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width ? canvas.width / rect.width : 1;
  const scaleY = rect.height ? canvas.height / rect.height : 1;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  const dx = x - orbitGame.target.x;
  const dy = y - orbitGame.target.y;
  if (Math.hypot(dx, dy) <= orbitGame.target.r) {
    orbitGame.score += 1;
    playCoin();
    if (scoreEl) scoreEl.textContent = String(orbitGame.score);
    if (orbitGame.score > orbitGame.best) {
      orbitGame.best = orbitGame.score;
      saveBestScore('orbit', orbitGame.best);
      if (bestEl) bestEl.textContent = String(orbitGame.best);
    }
    spawnOrbitTarget();
    drawOrbit();
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Orbit Tap</div>
        <div class="game-meta">
          <div>Score<strong id="orbitScore">0</strong></div>
          <div>Best<strong id="orbitBest">0</strong></div>
          <div>Time<strong><span id="orbitTime">20</span>s</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="orbitCanvas" width="480" height="320" aria-label="Orbit tap game canvas" style="touch-action: manipulation; cursor: crosshair;"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="orbitStart">Start</button>
          <button class="control-btn" id="orbitReset">Reset</button>
          <div class="hint" id="orbitStatus" aria-live="polite">Click or tap the glowing orb before time runs out.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#orbitCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#orbitScore');
  bestEl = root.querySelector('#orbitBest');
  timeEl = root.querySelector('#orbitTime');
  statusEl = root.querySelector('#orbitStatus');
  const startBtn = root.querySelector('#orbitStart');
  const resetBtn = root.querySelector('#orbitReset');
  colors = getGameColors();

  function onPointerDown(e) {
    handleOrbitTap(e.clientX, e.clientY);
  }

  canvas?.addEventListener('pointerdown', onPointerDown);
  startBtn?.addEventListener('click', startOrbit);
  resetBtn?.addEventListener('click', resetOrbit);

  resetOrbit();

  return {
    destroy() {
      pauseOrbit();
      canvas?.removeEventListener('pointerdown', onPointerDown);
      startBtn?.removeEventListener('click', startOrbit);
      resetBtn?.removeEventListener('click', resetOrbit);
      canvas = null;
      ctx = null;
      scoreEl = null;
      bestEl = null;
      timeEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
