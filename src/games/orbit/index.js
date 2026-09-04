import { getGameColors } from '../../utils/colors.js';

export const orbitGame = {
  running: false,
  score: 0,
  time: 20,
  target: { x: 0, y: 0, r: 20 },
  timer: null
};

let canvas = null;
let ctx = null;
let scoreEl = null;
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
  if (scoreEl) scoreEl.textContent = '0';
  if (timeEl) timeEl.textContent = '20';
  if (statusEl) statusEl.textContent = 'Click the glowing orb before time runs out.';
  spawnOrbitTarget();
  drawOrbit();
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Orbit Tap</div>
        <div class="game-meta">
          <div>Score<strong id="orbitScore">0</strong></div>
          <div>Time<strong><span id="orbitTime">20</span>s</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="orbitCanvas" width="480" height="320" aria-label="Orbit tap game canvas"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="orbitStart">Start</button>
          <button class="control-btn" id="orbitReset">Reset</button>
          <div class="hint" id="orbitStatus" aria-live="polite">Click the glowing orb before time runs out.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#orbitCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#orbitScore');
  timeEl = root.querySelector('#orbitTime');
  statusEl = root.querySelector('#orbitStatus');
  const startBtn = root.querySelector('#orbitStart');
  const resetBtn = root.querySelector('#orbitReset');
  colors = getGameColors();

  function onCanvasClick(e) {
    if (!orbitGame.running || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - orbitGame.target.x;
    const dy = y - orbitGame.target.y;
    if (Math.hypot(dx, dy) <= orbitGame.target.r) {
      orbitGame.score += 1;
      if (scoreEl) scoreEl.textContent = String(orbitGame.score);
      spawnOrbitTarget();
      drawOrbit();
    }
  }

  canvas?.addEventListener('click', onCanvasClick);
  startBtn?.addEventListener('click', startOrbit);
  resetBtn?.addEventListener('click', resetOrbit);

  resetOrbit();

  return {
    destroy() {
      pauseOrbit();
      canvas?.removeEventListener('click', onCanvasClick);
      startBtn?.removeEventListener('click', startOrbit);
      resetBtn?.removeEventListener('click', resetOrbit);
      canvas = null;
      ctx = null;
      scoreEl = null;
      timeEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
