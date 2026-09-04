import { getGameColors } from '../../utils/colors.js';

export const snakeGame = {
  running: false,
  score: 0,
  best: 0,
  size: 18,
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  snake: [{ x: 9, y: 9 }],
  food: { x: 5, y: 5 },
  timer: null
};

let canvas = null;
let ctx = null;
let scoreEl = null;
let bestEl = null;
let statusEl = null;
let colors = getGameColors();

export function placeFood() {
  let x, y;
  do {
    x = Math.floor(Math.random() * snakeGame.size);
    y = Math.floor(Math.random() * snakeGame.size);
  } while (snakeGame.snake.some((s) => s.x === x && s.y === y));
  snakeGame.food = { x, y };
}

export function resetSnake() {
  snakeGame.running = false;
  clearInterval(snakeGame.timer);
  snakeGame.timer = null;
  snakeGame.score = 0;
  snakeGame.dir = { x: 1, y: 0 };
  snakeGame.nextDir = { x: 1, y: 0 };
  snakeGame.snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }];
  placeFood();
  if (scoreEl) scoreEl.textContent = String(snakeGame.score);
  if (statusEl) statusEl.textContent = 'Use arrow keys to move. Avoid walls.';
  drawSnake();
}

export function drawSnake() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = canvas.width / snakeGame.size;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.cyan;
  ctx.fillRect(snakeGame.food.x * cell, snakeGame.food.y * cell, cell, cell);

  ctx.fillStyle = colors.text;
  snakeGame.snake.forEach((s, i) => {
    ctx.fillRect(s.x * cell, s.y * cell, cell - 1, cell - 1);
    if (i === 0) {
      ctx.fillStyle = colors.gold;
      ctx.fillRect(s.x * cell, s.y * cell, cell - 1, cell - 1);
      ctx.fillStyle = colors.text;
    }
  });
}

export function tickSnake() {
  snakeGame.dir = snakeGame.nextDir;
  const head = { x: snakeGame.snake[0].x + snakeGame.dir.x, y: snakeGame.snake[0].y + snakeGame.dir.y };
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= snakeGame.size ||
    head.y >= snakeGame.size ||
    snakeGame.snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y)
  ) {
    if (statusEl) statusEl.textContent = 'Game Over. Press Reset.';
    snakeGame.running = false;
    clearInterval(snakeGame.timer);
    snakeGame.timer = null;
    return;
  }
  snakeGame.snake.unshift(head);
  if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
    snakeGame.score += 10;
    if (scoreEl) scoreEl.textContent = String(snakeGame.score);
    if (snakeGame.score > snakeGame.best) {
      snakeGame.best = snakeGame.score;
      if (bestEl) bestEl.textContent = String(snakeGame.best);
    }
    placeFood();
  } else {
    snakeGame.snake.pop();
  }
  drawSnake();
}

export function startSnake() {
  if (snakeGame.running) return;
  snakeGame.running = true;
  if (statusEl) statusEl.textContent = 'Playing...';
  clearInterval(snakeGame.timer);
  snakeGame.timer = setInterval(tickSnake, 130);
}

export function pauseSnake() {
  snakeGame.running = false;
  clearInterval(snakeGame.timer);
  snakeGame.timer = null;
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Snake</div>
        <div class="game-meta">
          <div>Score<strong id="snakeScore">0</strong></div>
          <div>Best<strong id="snakeBest">0</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <canvas id="snakeCanvas" width="440" height="440" aria-label="Snake game canvas"></canvas>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="snakeStart">Start</button>
          <button class="control-btn" id="snakeReset">Reset</button>
          <div class="hint" id="snakeStatus" aria-live="polite">Use arrow keys to move. Avoid walls.</div>
        </div>
      </div>
    </div>
  `;

  canvas = root.querySelector('#snakeCanvas');
  ctx = canvas?.getContext('2d');
  scoreEl = root.querySelector('#snakeScore');
  bestEl = root.querySelector('#snakeBest');
  statusEl = root.querySelector('#snakeStatus');
  const startBtn = root.querySelector('#snakeStart');
  const resetBtn = root.querySelector('#snakeReset');
  colors = getGameColors();

  function onKeyDown(e) {
    const key = e.key;
    const dir = snakeGame.nextDir;
    const handled =
      (key === 'ArrowUp' && dir.y !== 1 && (snakeGame.nextDir = { x: 0, y: -1 })) ||
      (key === 'ArrowDown' && dir.y !== -1 && (snakeGame.nextDir = { x: 0, y: 1 })) ||
      (key === 'ArrowLeft' && dir.x !== 1 && (snakeGame.nextDir = { x: -1, y: 0 })) ||
      (key === 'ArrowRight' && dir.x !== -1 && (snakeGame.nextDir = { x: 1, y: 0 }));
    if (handled) e.preventDefault();
  }

  startBtn?.addEventListener('click', startSnake);
  resetBtn?.addEventListener('click', resetSnake);
  window.addEventListener('keydown', onKeyDown);

  resetSnake();

  return {
    destroy() {
      pauseSnake();
      startBtn?.removeEventListener('click', startSnake);
      resetBtn?.removeEventListener('click', resetSnake);
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
