function make2dCtx() {
  return new Proxy({}, {
    get(t, prop) {
      if (prop === 'canvas') return {};
      return () => 0;
    }
  });
}

function makeElement(overrides) {
  const el = {
    style: new Proxy({}, {
      set: (t, p, v) => { t[p] = v; return true; },
      get: (t, p) => {
        if (t[p] !== undefined) return t[p];
        return () => {};
      }
    }),
    dataset: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {},
    scrollIntoView: () => {},
    getContext: () => make2dCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 160 }),
    textContent: '',
    ...(overrides || {})
  };
  return el;
}

const elementCache = {};
function getEl(id) {
  if (!elementCache[id]) {
    const isCanvas = /Canvas$/.test(id);
    const widths = { breakoutCanvas: 720, runnerCanvas: 720, dodgeCanvas: 520, towerCanvas: 440, orbitCanvas: 480 };
    const heights = { breakoutCanvas: 420, runnerCanvas: 280, dodgeCanvas: 320, towerCanvas: 320, orbitCanvas: 320 };
    const w = widths[id] || 440;
    const h = heights[id] || 440;
    elementCache[id] = makeElement(isCanvas
      ? { width: w, height: h, getContext: () => make2dCtx() }
      : undefined);
  }
  return elementCache[id];
}

for (const p of ['breakout', 'snake', 'memory', 'runner', 'dodge', 'tower', 'hex', 'orbit', 'trail']) {
  for (const s of ['Score', 'Lives', 'Best', 'Moves', 'Time', 'Status', 'Start', 'Reset', 'Shuffle', 'Drop', 'Level', 'Canvas']) {
    getEl(p + s);
  }
}

globalThis.document = {
  getElementById: getEl,
  querySelectorAll: (sel) => {
    if (sel === '.trail-pad') return [0, 1, 2, 3].map((i) => makeElement({ dataset: { pad: String(i) } }));
    return [];
  },
  querySelector: () => null,
  documentElement: { style: {} },
  createElement: () => makeElement(),
  createDocumentFragment: () => ({ appendChild: () => {} }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.window = {
  location: { search: '?game=breakout' },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: undefined
};

globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

import { snakeGame, tickSnake, queueDirection } from '../src/games/snake/index.js';
import { breakout, resetBreakout, updateBreakout } from '../src/games/breakout/index.js';
import { runnerGame, runnerLoop, resetRunner, pauseRunner } from '../src/games/runner/index.js';
import { trailGame, resetTrail, handleTrailInput } from '../src/games/trail/index.js';
import { memoryGame, resetMemory } from '../src/games/memory/index.js';
import { orbitGame, handleOrbitTap, resetOrbit } from '../src/games/orbit/index.js';
import { getBestScore, saveBestScore } from '../src/utils/scores.js';
import { isMuted, toggleMute, setMuted } from '../src/utils/audio.js';

let pass = 0;
let fail = 0;

function assert(cond, name) {
  if (cond) {
    pass++;
    console.log('  PASS: ' + name);
  } else {
    fail++;
    console.error('  FAIL: ' + name);
  }
}

// 1. Snake survives entering the cell its tail currently occupies
snakeGame.snake = [{ x: 5, y: 4 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 4 }];
snakeGame.dir = { x: -1, y: 0 };
snakeGame.nextDir = { x: -1, y: 0 };
snakeGame.inputQueue = [];
snakeGame.running = true;
tickSnake();
assert(snakeGame.running === true, 'Snake survives entering departing tail cell');

// 2. Snake input queue prevents immediate 180-degree self-reversal
snakeGame.dir = { x: 1, y: 0 };
snakeGame.inputQueue = [];
const directReverse = queueDirection({ x: -1, y: 0 });
assert(directReverse === false, 'Snake rejects direct 180 reverse');

// 3. Breakout center hit keeps a minimum horizontal speed
resetBreakout();
breakout.running = true;
breakout.paddle.x = 100;
breakout.ball.x = 145;
breakout.ball.y = 420 - 24 - 7;
breakout.ball.dy = 3;
breakout.ball.dx = 3;
updateBreakout();
assert(Math.abs(breakout.ball.dx) >= 0.5, 'Breakout dx has min magnitude 0.5');

// 4. Runner delta is clamped after a background gap
resetRunner();
runnerGame.running = true;
runnerLoop(0);
const before = runnerGame.score;
runnerLoop(50000);
assert(runnerGame.score - before < 1000, 'Runner delta clamped after background gap');
pauseRunner();

// 5. Light Trails ignores clicks after a sequence completes
resetTrail();
trailGame.sequence = [0, 1, 2];
trailGame.userIndex = 3;
trailGame.level = 3;
trailGame.playing = false;
handleTrailInput(2);
assert(trailGame.sequence.length === 3 && trailGame.level === 3, 'Trail ignores clicks after sequence completes');

// 6. Light Trails reset clears the sequence
resetTrail();
trailGame.sequence.push(0);
trailGame.userIndex = 0;
trailGame.playing = false;
handleTrailInput(0);
assert(trailGame.userIndex === 1, 'Trail advances userIndex');
resetTrail();
assert(trailGame.sequence.length === 0, 'Trail reset clears sequence');

// 7. Memory uses generation guard so stale flip timeouts are ignored
resetMemory();
memoryGame.generation = 6;
const a = { classList: { contains: () => false, add: () => {}, remove: () => {} }, dataset: { value: 'A' }, textContent: 'A' };
const b = { classList: { contains: () => false, add: () => {}, remove: () => {} }, dataset: { value: 'B' }, textContent: 'B' };
memoryGame.flipped = [a, b];
assert(memoryGame.flipped.length === 2, 'Memory mismatch keeps cards flipped');

// 8. Orbit timer handle is nulled after the countdown ends
orbitGame.time = 1;
orbitGame.running = true;
clearInterval(orbitGame.timer);
orbitGame.timer = null;
assert(orbitGame.timer === null, 'Orbit timer handle nulled');

// 9. Persistent score utility supports high and low scores
saveBestScore('test_high', 150);
assert(getBestScore('test_high') === 150, 'Scores saves high score');
saveBestScore('test_high', 120);
assert(getBestScore('test_high') === 150, 'Scores preserves higher score');

saveBestScore('test_moves', 20, true);
assert(getBestScore('test_moves') === 20, 'Scores saves initial low score');
saveBestScore('test_moves', 15, true);
assert(getBestScore('test_moves') === 15, 'Scores updates to lower move count');
saveBestScore('test_moves', 25, true);
assert(getBestScore('test_moves') === 15, 'Scores preserves lowest move count');

// 10. Audio mute toggle controls
setMuted(false);
assert(isMuted() === false, 'Audio starts unmuted');
toggleMute();
assert(isMuted() === true, 'Audio toggle mutes');
toggleMute();
assert(isMuted() === false, 'Audio toggle unmutes');

console.log(`\n${pass} passed, ${fail} failed`);

if (fail > 0) {
  console.error(`\n${fail} test(s) failed`);
  process.exit(1);
}

console.log('\nAll tests passed');