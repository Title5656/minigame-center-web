import { getBestScore, saveBestScore } from '../../utils/scores.js';
import { playTone, playHit, playWin } from '../../utils/audio.js';

export const trailGame = {
  sequence: [],
  userIndex: 0,
  playing: false,
  level: 0,
  best: 0,
  timeout: null
};

let pads = [];
let levelEl = null;
let bestEl = null;
let statusEl = null;

const padFrequencies = [261.63, 329.63, 392.0, 523.25];

export function flashTrailPad(index) {
  const pad = pads[index] || (typeof document !== 'undefined' ? document.querySelector(`.trail-pad[data-pad="${index}"]`) : null);
  if (padFrequencies[index]) {
    playTone(padFrequencies[index], 'sine', 0.22, 0.1);
  }
  if (!pad) return;
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), 250);
}

export function playTrailSequence() {
  trailGame.playing = true;
  if (statusEl) statusEl.textContent = 'Watch the sequence';
  let i = 0;
  const step = () => {
    if (i >= trailGame.sequence.length) {
      trailGame.playing = false;
      if (statusEl) statusEl.textContent = 'Your turn';
      return;
    }
    flashTrailPad(trailGame.sequence[i]);
    i += 1;
    trailGame.timeout = setTimeout(step, 520);
  };
  step();
}

export function addTrailStep() {
  trailGame.sequence.push(Math.floor(Math.random() * 4));
  trailGame.userIndex = 0;
  trailGame.level = trailGame.sequence.length;
  if (levelEl) levelEl.textContent = String(trailGame.level);
  playTrailSequence();
}

export function startTrail() {
  trailGame.sequence = [];
  trailGame.userIndex = 0;
  trailGame.level = 0;
  if (levelEl) levelEl.textContent = '0';
  if (statusEl) statusEl.textContent = 'Get ready...';
  addTrailStep();
}

export function pauseTrail() {
  trailGame.playing = false;
  if (trailGame.timeout) {
    clearTimeout(trailGame.timeout);
    trailGame.timeout = null;
  }
}

export function resetTrail() {
  pauseTrail();
  trailGame.sequence = [];
  trailGame.userIndex = 0;
  trailGame.level = 0;
  trailGame.best = getBestScore('trail', 0);
  if (levelEl) levelEl.textContent = '0';
  if (bestEl) bestEl.textContent = String(trailGame.best);
  if (statusEl) statusEl.textContent = 'Repeat the light sequence.';
}

export function handleTrailInput(index) {
  if (trailGame.playing || trailGame.sequence.length === 0) return;
  if (trailGame.userIndex >= trailGame.sequence.length) return;
  flashTrailPad(index);
  if (trailGame.sequence[trailGame.userIndex] !== index) {
    playHit();
    if (statusEl) statusEl.textContent = 'Missed! Press Start.';
    if (trailGame.level > trailGame.best) {
      trailGame.best = trailGame.level;
      saveBestScore('trail', trailGame.best);
      if (bestEl) bestEl.textContent = String(trailGame.best);
    }
    trailGame.sequence = [];
    trailGame.userIndex = 0;
    trailGame.level = 0;
    if (levelEl) levelEl.textContent = '0';
    return;
  }
  trailGame.userIndex += 1;
  if (trailGame.userIndex === trailGame.sequence.length) {
    if (trailGame.level > trailGame.best) {
      trailGame.best = trailGame.level;
      saveBestScore('trail', trailGame.best);
      if (bestEl) bestEl.textContent = String(trailGame.best);
    }
    if (trailGame.level % 5 === 0) {
      playWin();
    }
    trailGame.timeout = setTimeout(addTrailStep, 400);
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Light Trails</div>
        <div class="game-meta">
          <div>Level<strong id="trailLevel">0</strong></div>
          <div>Best<strong id="trailBest">0</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <div class="trail-grid" id="trailGrid" aria-label="Light trails grid">
            <button class="trail-pad" type="button" data-pad="0">I</button>
            <button class="trail-pad" type="button" data-pad="1">II</button>
            <button class="trail-pad" type="button" data-pad="2">III</button>
            <button class="trail-pad" type="button" data-pad="3">IV</button>
          </div>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="trailStart">Start</button>
          <button class="control-btn" id="trailReset">Reset</button>
          <div class="hint" id="trailStatus" aria-live="polite">Repeat the light sequence.</div>
        </div>
      </div>
    </div>
  `;

  pads = [...root.querySelectorAll('.trail-pad')];
  levelEl = root.querySelector('#trailLevel');
  bestEl = root.querySelector('#trailBest');
  statusEl = root.querySelector('#trailStatus');
  const startBtn = root.querySelector('#trailStart');
  const resetBtn = root.querySelector('#trailReset');

  const padListeners = pads.map((pad) => {
    const handler = () => handleTrailInput(Number(pad.dataset.pad));
    pad.addEventListener('click', handler);
    return { pad, handler };
  });

  startBtn?.addEventListener('click', startTrail);
  resetBtn?.addEventListener('click', resetTrail);

  resetTrail();

  return {
    destroy() {
      pauseTrail();
      padListeners.forEach(({ pad, handler }) => {
        pad.removeEventListener('click', handler);
      });
      startBtn?.removeEventListener('click', startTrail);
      resetBtn?.removeEventListener('click', resetTrail);
      pads = [];
      levelEl = null;
      bestEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
