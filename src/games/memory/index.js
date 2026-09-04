export const memoryGame = {
  values: [],
  flipped: [],
  matched: 0,
  moves: 0,
  timer: null,
  seconds: 0,
  active: false,
  generation: 0
};

let gridEl = null;
let movesEl = null;
let timeEl = null;
let statusEl = null;

export function buildMemory() {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  const base = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  memoryGame.values = [...base, ...base].sort(() => Math.random() - 0.5);
  memoryGame.values.forEach((value) => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.type = 'button';
    btn.dataset.value = value;
    btn.textContent = '?';
    btn.addEventListener('click', () => flipCard(btn));
    gridEl.appendChild(btn);
  });
}

export function startMemoryTimer() {
  if (memoryGame.timer) return;
  memoryGame.timer = setInterval(() => {
    memoryGame.seconds += 1;
    if (timeEl) timeEl.textContent = String(memoryGame.seconds);
  }, 1000);
}

export function resetMemory() {
  memoryGame.flipped = [];
  memoryGame.matched = 0;
  memoryGame.moves = 0;
  memoryGame.seconds = 0;
  memoryGame.active = false;
  memoryGame.generation = (memoryGame.generation || 0) + 1;
  clearInterval(memoryGame.timer);
  memoryGame.timer = null;
  if (movesEl) movesEl.textContent = '0';
  if (timeEl) timeEl.textContent = '0';
  if (statusEl) statusEl.textContent = 'Match all pairs with fewer moves.';
  buildMemory();
}

export function pauseMemory() {
  if (memoryGame.timer) {
    clearInterval(memoryGame.timer);
    memoryGame.timer = null;
  }
  memoryGame.active = false;
}

export function flipCard(card) {
  if (card.classList.contains('is-matched') || card.classList.contains('is-flipped')) return;
  if (memoryGame.flipped.length === 2) return;
  if (!memoryGame.active) {
    memoryGame.active = true;
    startMemoryTimer();
  }
  card.classList.add('is-flipped');
  card.textContent = card.dataset.value;
  memoryGame.flipped.push(card);
  if (memoryGame.flipped.length === 2) {
    memoryGame.moves += 1;
    if (movesEl) movesEl.textContent = String(memoryGame.moves);
    const [a, b] = memoryGame.flipped;
    if (a.dataset.value === b.dataset.value) {
      a.classList.add('is-matched');
      b.classList.add('is-matched');
      memoryGame.flipped = [];
      memoryGame.matched += 2;
      if (memoryGame.matched === memoryGame.values.length) {
        clearInterval(memoryGame.timer);
        memoryGame.timer = null;
        if (statusEl) statusEl.textContent = `Completed in ${memoryGame.moves} moves · ${memoryGame.seconds}s`;
      }
    } else {
      const generation = memoryGame.generation;
      setTimeout(() => {
        if (memoryGame.generation !== generation) return;
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        a.textContent = '?';
        b.textContent = '?';
        memoryGame.flipped = [];
      }, 600);
    }
  }
}

export function mount(root) {
  root.innerHTML = `
    <div class="game-panel is-active">
      <div class="game-header">
        <div class="game-title">Memory Match</div>
        <div class="game-meta">
          <div>Moves<strong id="memoryMoves">0</strong></div>
          <div>Time<strong><span id="memoryTime">0</span>s</strong></div>
        </div>
      </div>
      <div class="game-area">
        <div class="game-board">
          <div class="memory-grid" id="memoryGrid" aria-label="Memory match grid"></div>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="memoryShuffle">Shuffle</button>
          <button class="control-btn" id="memoryReset">Reset</button>
          <div class="hint" id="memoryStatus" aria-live="polite">Match all pairs with fewer moves.</div>
        </div>
      </div>
    </div>
  `;

  gridEl = root.querySelector('#memoryGrid');
  movesEl = root.querySelector('#memoryMoves');
  timeEl = root.querySelector('#memoryTime');
  statusEl = root.querySelector('#memoryStatus');
  const shuffleBtn = root.querySelector('#memoryShuffle');
  const resetBtn = root.querySelector('#memoryReset');

  shuffleBtn?.addEventListener('click', resetMemory);
  resetBtn?.addEventListener('click', resetMemory);

  resetMemory();

  return {
    destroy() {
      pauseMemory();
      shuffleBtn?.removeEventListener('click', resetMemory);
      resetBtn?.removeEventListener('click', resetMemory);
      gridEl = null;
      movesEl = null;
      timeEl = null;
      statusEl = null;
      root.innerHTML = '';
    }
  };
}
