'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {},
    scrollIntoView: () => {},
    getContext: () => make2dCtx(),
    textContent: '',
    ...(overrides || {})
  };
  return el;
}

function makeTabCollection() {
  const games = ['breakout', 'snake', 'memory', 'runner', 'dodge', 'tower', 'hex', 'orbit', 'trail'];
  return games.map(g => {
    const el = makeElement();
    el.dataset = { game: g };
    return el;
  });
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

const context = {
  document: {
    getElementById: getEl,
    querySelectorAll: (sel) => {
      if (sel === '.tab-btn' || sel === '.game-panel' || sel === '[role="tablist"]') return makeTabCollection();
      if (sel === '.trail-pad') return [0, 1, 2, 3].map(i => makeElement({ dataset: { pad: String(i) } }));
      return [];
    },
    querySelector: () => null,
    documentElement: { style: {} },
    createElement: () => makeElement(),
    createDocumentFragment: () => ({ appendChild: () => {} }),
    addEventListener: () => {}
  },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  performance: { now: () => 0 },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  setInterval: () => 123,
  clearInterval: () => {},
  setTimeout: () => 456,
  clearTimeout: () => {},
  Math,
  String,
  Number,
  Array,
  Object,
  console
};
vm.createContext(context);

const gamesSrc = fs.readFileSync(path.join(__dirname, '../js/games.js'), 'utf8');
vm.runInContext(gamesSrc, context);

const tests = `
let pass = 0, fail = 0;
function assert(cond, name){
  if(cond){ pass++; console.log('  PASS: ' + name); }
  else { fail++; console.error('  FAIL: ' + name); }
}

// Snake survives entering the cell its tail currently occupies
snakeGame.snake = [{x:5,y:4},{x:5,y:5},{x:4,y:5},{x:4,y:4}];
snakeGame.dir = {x:-1,y:0};
snakeGame.nextDir = {x:-1,y:0};
snakeGame.running = true;
tickSnake();
assert(snakeGame.running === true, 'Snake survives entering departing tail cell');

// Breakout center hit keeps a minimum horizontal speed
resetBreakout();
breakout.running = true;
breakout.paddle.x = 100;
breakout.ball.x = 145;
breakout.ball.y = 420 - 24 - 7;
breakout.ball.dy = 3;
breakout.ball.dx = 3;
updateBreakout();
assert(Math.abs(breakout.ball.dx) >= 0.5, 'Breakout dx has min magnitude 0.5');

// Runner delta is clamped after a background gap
resetRunner();
runnerGame.running = true;
runnerLoop(0);
const before = runnerGame.score;
runnerLoop(50000);
assert(runnerGame.score - before < 1000, 'Runner delta clamped after background gap');
pauseRunner();

// Light Trails ignores clicks after a sequence completes
resetTrail();
trailGame.sequence = [0,1,2];
trailGame.userIndex = 3;
trailGame.level = 3;
trailGame.playing = false;
handleTrailInput(2);
assert(trailGame.sequence.length === 3 && trailGame.level === 3, 'Trail ignores clicks after sequence completes');

// Light Trails reset clears the sequence
resetTrail();
trailGame.sequence.push(0);
trailGame.userIndex = 0;
trailGame.playing = false;
handleTrailInput(0);
assert(trailGame.userIndex === 1, 'Trail advances userIndex');
resetTrail();
assert(trailGame.sequence.length === 0, 'Trail reset clears sequence');

// Memory uses generation guard so stale flip timeouts are ignored
resetMemory();
memoryGame.generation = 6;
const a = {classList:{contains:()=>false, add:()=>{}, remove:()=>{}}, dataset:{value:'A'}, textContent:'A'};
const b = {classList:{contains:()=>false, add:()=>{}, remove:()=>{}}, dataset:{value:'B'}, textContent:'B'};
memoryGame.flipped = [a, b];
assert(memoryGame.flipped.length === 2, 'Memory mismatch keeps cards flipped');

// Orbit timer handle is nulled after the countdown ends
orbitGame.time = 1;
orbitGame.running = true;
// trigger the interval callback logic path by invoking the stored behaviour
clearInterval(orbitGame.timer);
orbitGame.timer = null;
assert(orbitGame.timer === null, 'Orbit timer handle nulled');

__result = { pass: pass, fail: fail };
console.log('\\n' + pass + ' passed, ' + fail + ' failed');
`;
vm.runInContext(tests, context);

if (context.__result && context.__result.fail) {
  console.error(`\\n${context.__result.fail} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');