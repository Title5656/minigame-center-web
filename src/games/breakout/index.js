import { getGameColors } from '../../utils/colors.js';
import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playCoin, playHit, playBlip, playWin } from '../../utils/audio.js';

export const breakout = {
  running: false,
  score: 0,
  best: 0,
  lives: 3,
  ball: { x: 280, y: 220, dx: 3, dy: -3, r: 7 },
  paddle: { w: 90, h: 10, x: 235, speed: 6 },
  bricks: [],
  rows: 4,
  cols: 8,
  brickW: 60,
  brickH: 16,
  brickGap: 10,
  raf: 0,
  lastTime: 0,
  keys: { left: false, right: false }
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let livesEl = null;
let statusEl = null;
let colors = getGameColors();

export function resetBreakout() {
  const width = canvas?.width || 720;
  const height = canvas?.height || 420;

  breakout.running = false;
  breakout.score = 0;
  breakout.best = getBestScore('breakout', 0);
  breakout.lives = 3;
  breakout.ball = { x: width / 2, y: height - 80, dx: 3, dy: -3, r: 7 };
  breakout.paddle.x = (width - breakout.paddle.w) / 2;
  breakout.bricks = [];

  const offsetX = (width - (breakout.cols * breakout.brickW + (breakout.cols - 1) * breakout.brickGap)) / 2;
  const offsetY = 40;
  for (let r = 0; r < breakout.rows; r++) {
    for (let c = 0; c < breakout.cols; c++) {
      breakout.bricks.push({
        x: offsetX + c * (breakout.brickW + breakout.brickGap),
        y: offsetY + r * (breakout.brickH + breakout.brickGap),
        active: true
      });
    }
  }

  if (scoreEl) scoreEl.textContent = String(breakout.score);
  if (bestEl) bestEl.textContent = String(breakout.best);
  if (livesEl) livesEl.textContent = String(breakout.lives);
  if (statusEl) statusEl.textContent = 'Press Start. Controls: ← → / A D or Drag Mouse/Touch.';
  drawBreakout();
}

export function drawBreakout() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  breakout.bricks.forEach((brick) => {
    if (!brick.active) return;
    ctx.fillStyle = colors.goldDim;
    ctx.fillRect(brick.x, brick.y, breakout.brickW, breakout.brickH);
    ctx.strokeStyle = colors.cyanDim;
    ctx.strokeRect(brick.x, brick.y, breakout.brickW, breakout.brickH);
  });

  ctx.fillStyle = colors.text;
  ctx.fillRect(breakout.paddle.x, canvas.height - 24, breakout.paddle.w, breakout.paddle.h);

  ctx.beginPath();
  ctx.fillStyle = colors.gold;
  ctx.arc(breakout.ball.x, breakout.ball.y, breakout.ball.r, 0, Math.PI * 2);
  ctx.fill();
}

export function updateBreakout(scale = 1) {
  if (!breakout.running) return;
  const width = canvas?.width || 720;
  const height = canvas?.height || 420;

  if (breakout.keys.left) breakout.paddle.x = Math.max(0, breakout.paddle.x - breakout.paddle.speed * scale);
  if (breakout.keys.right) breakout.paddle.x = Math.min(width - breakout.paddle.w, breakout.paddle.x + breakout.paddle.speed * scale);

  breakout.ball.x += breakout.ball.dx * scale;
  breakout.ball.y += breakout.ball.dy * scale;

  if (breakout.ball.x + breakout.ball.r > width || breakout.ball.x - breakout.ball.r < 0) {
    breakout.ball.dx *= -1;
  }
  if (breakout.ball.y - breakout.ball.r < 0) {
    breakout.ball.dy *= -1;
  }

  const paddleY = height - 24;
  if (
    breakout.ball.y + breakout.ball.r >= paddleY &&
    breakout.ball.x >= breakout.paddle.x &&
    breakout.ball.x <= breakout.paddle.x + breakout.paddle.w
  ) {
    breakout.ball.dy = -Math.abs(breakout.ball.dy);
    const hitPos = (breakout.ball.x - breakout.paddle.x) / breakout.paddle.w - 0.5;
    breakout.ball.dx = hitPos * 6;
    if (Math.abs(breakout.ball.dx) < 0.5) breakout.ball.dx = breakout.ball.dx >= 0 ? 0.5 : -0.5;
    playBlip();
  }

  if (breakout.ball.y - breakout.ball.r > height) {
    breakout.lives -= 1;
    playHit();
    if (livesEl) livesEl.textContent = String(breakout.lives);
    if (breakout.lives <= 0) {
      breakout.running = false;
      if (statusEl) statusEl.textContent = 'Game Over. Press Reset.';
      return;
    }
    breakout.ball = { x: width / 2, y: height - 80, dx: 3, dy: -3, r: 7 };
    breakout.paddle.x = (width - breakout.paddle.w) / 2;
  }

  breakout.bricks.forEach((brick) => {
    if (!brick.active) return;
    if (
      breakout.ball.x > brick.x &&
      breakout.ball.x < brick.x + breakout.brickW &&
      breakout.ball.y - breakout.ball.r < brick.y + breakout.brickH &&
      breakout.ball.y + breakout.ball.r > brick.y
    ) {
      brick.active = false;
      breakout.ball.dy *= -1;
      breakout.score += 10;
      playCoin();
      if (scoreEl) scoreEl.textContent = String(breakout.score);
      if (breakout.score > breakout.best) {
        breakout.best = breakout.score;
        saveBestScore('breakout', breakout.best);
        if (bestEl) bestEl.textContent = String(breakout.best);
      }
    }
  });

  if (breakout.bricks.length > 0 && breakout.bricks.every((b) => !b.active)) {
    breakout.running = false;
    playWin();
    if (statusEl) statusEl.textContent = 'You cleared the board! Press Reset.';
  }
}

export function breakoutLoop(timestamp) {
  if (!breakout.lastTime) breakout.lastTime = timestamp;
  const delta = Math.min(timestamp - breakout.lastTime, 100);
  breakout.lastTime = timestamp;
  updateBreakout(delta / (1000 / 60));
  drawBreakout();
  if (breakout.running) {
    breakout.raf = requestAnimationFrame(breakoutLoop);
  }
}

export function startBreakout() {
  if (breakout.running) return;
  breakout.running = true;
  breakout.lastTime = 0;
  playBlip();
  if (statusEl) statusEl.textContent = 'Playing...';
  breakoutLoop(performance.now());
}

export function pauseBreakout() {
  breakout.running = false;
  if (breakout.raf) {
    cancelAnimationFrame(breakout.raf);
    breakout.raf = 0;
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Breakout</div>
        <div class="game-meta">
          <div>Score<strong id="breakoutScore">0</strong></div>
          <div>Best<strong id="breakoutBest">0</strong></div>
          <div>Lives<strong id="breakoutLives">3</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="breakoutCanvas" width="720" height="420" aria-label="Breakout game canvas" style="touch-action: none; cursor: ew-resize;"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="breakoutStart">Start</button>
          <button class="control-btn" id="breakoutReset">Reset</button>
          <div class="hint" id="breakoutStatus" aria-live="polite">Press Start to play. Controls: ← → / A D or drag paddle.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#breakoutCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#breakoutScore');
  bestEl = root.querySelector('#breakoutBest');
  livesEl = root.querySelector('#breakoutLives');
  statusEl = root.querySelector('#breakoutStatus');
  const startBtn = root.querySelector('#breakoutStart');
  const resetBtn = root.querySelector('#breakoutReset');
  colors = getGameColors();

  function onKeyDown(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      breakout.keys.left = true;
      e.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      breakout.keys.right = true;
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      breakout.keys.left = false;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      breakout.keys.right = false;
    }
  }

  function onPointerMove(e) {
    if (!canvas || !breakout.running) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const x = (e.clientX - rect.left) * scaleX;
    breakout.paddle.x = Math.max(0, Math.min(canvas.width - breakout.paddle.w, x - breakout.paddle.w / 2));
  }

  startBtn?.addEventListener('click', startBreakout);
  resetBtn?.addEventListener('click', resetBreakout);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas?.addEventListener('pointermove', onPointerMove);
  canvas?.addEventListener('pointerdown', onPointerMove);

  resetBreakout();

  return {
    destroy() {
      pauseBreakout();
      startBtn?.removeEventListener('click', startBreakout);
      resetBtn?.removeEventListener('click', resetBreakout);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas?.removeEventListener('pointermove', onPointerMove);
      canvas?.removeEventListener('pointerdown', onPointerMove);
      canvas = null;
      ctx = null;
      scoreEl = null;
      bestEl = null;
      livesEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
