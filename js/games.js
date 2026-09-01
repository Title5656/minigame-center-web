'use strict';

const tabButtons = document.querySelectorAll('.tab-btn');
const gamePanels = document.querySelectorAll('.game-panel');
const blockTransition = document.getElementById('blockTransition');
const blockRows = 8;
const blockCols = 12;
const blockDelayX = 0.012;
const blockDelayY = 0.004;
const enterDurationMs = 550;
const exitDurationMs = 400;
let activeGame = 'breakout';
let pixelBusy = false;
const rootStyles = getComputedStyle(document.documentElement);
const gameColors = {
  bg: rootStyles.getPropertyValue('--game-bg').trim() || '#10081f',
  text: rootStyles.getPropertyValue('--game-text').trim() || '#f7f5ff',
  gold: rootStyles.getPropertyValue('--game-gold').trim() || '#ffcf4a',
  cyan: rootStyles.getPropertyValue('--game-cyan').trim() || '#4be8ff',
  pink: rootStyles.getPropertyValue('--game-pink').trim() || '#ff4edb',
  goldDim: rootStyles.getPropertyValue('--game-gold-dim').trim() || 'rgba(255,207,74,0.3)',
  cyanDim: rootStyles.getPropertyValue('--game-cyan-dim').trim() || 'rgba(75,232,255,0.3)',
  pinkDim: rootStyles.getPropertyValue('--game-pink-dim').trim() || 'rgba(255,78,219,0.3)'
};

function buildBlockTransition(){
  if(!blockTransition) return;
  blockTransition.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let r=0;r<blockRows;r++){
    for(let c=0;c<blockCols;c++){
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      const delay = ((blockRows - 1 - r) * blockDelayY) + (c * blockDelayX);
      cell.style.setProperty('--delay', `${delay.toFixed(3)}s`);
      cell.style.setProperty('--hue', `${(c * 22 + r * 13) % 360}`);
      frag.appendChild(cell);
    }
  }
  blockTransition.appendChild(frag);
}

buildBlockTransition();

function runBlockTransition(onMid){
  if(!blockTransition || pixelBusy){
    if(onMid) onMid();
    return;
  }
  const maxDelayMs = ((blockCols - 1) * blockDelayX + (blockRows - 1) * blockDelayY) * 1000;
  const inDelay = Math.round(maxDelayMs + enterDurationMs);
  const outDelay = Math.round(maxDelayMs + exitDurationMs);
  pixelBusy = true;
  blockTransition.classList.remove('is-exit');
  blockTransition.classList.add('is-active');
  setTimeout(()=>{
    if(onMid) onMid();
    blockTransition.classList.remove('is-active');
    blockTransition.classList.add('is-exit');
    setTimeout(()=>{
      blockTransition.classList.remove('is-exit');
      pixelBusy = false;
    },outDelay);
  },inDelay);
}

function showGameNow(game){
  activeGame = game;
  tabButtons.forEach(btn=>{
    const selected = btn.dataset.game === game;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-selected', String(selected));
    btn.setAttribute('tabindex', selected ? '0' : '-1');
  });
  gamePanels.forEach(panel=>{
    const active = panel.dataset.game === game;
    panel.classList.toggle('is-active', active);
    if(active) document.getElementById(`tab-${game}`)?.focus();
  });
  pauseBreakout();
  pauseSnake();
  pauseRunner();
  pauseDodge();
  pauseTower();
  pauseOrbit();
  pauseTrail();
  pauseMemory();
  pauseHex();
}

function showGame(game){
  if(game === activeGame) return;
  runBlockTransition(()=>showGameNow(game));
}

tabButtons.forEach(btn=>btn.addEventListener('click',()=>showGame(btn.dataset.game)));
{
  const tabList = document.querySelector('[role="tablist"]');
  if(tabList){
    tabList.addEventListener('keydown', e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const tabs = [...tabList.querySelectorAll('[role="tab"]')];
      const currentIndex = tabs.findIndex(tab=>tab.getAttribute('aria-selected') === 'true');
      let nextIndex = currentIndex;
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
      if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if(e.key === 'Home') nextIndex = 0;
      if(e.key === 'End') nextIndex = tabs.length - 1;
      const game = tabs[nextIndex].dataset.game;
      if(game) showGame(game);
    });
  }
}
document.querySelectorAll('nav a').forEach(a=>{
  a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    if(href && href.startsWith('#')){
      e.preventDefault();
      runBlockTransition(()=>{
        document.querySelector(href)?.scrollIntoView({behavior:'smooth'});
      });
    }
  });
});

// Breakout
const breakoutCanvas = document.getElementById('breakoutCanvas');
const breakoutCtx = breakoutCanvas.getContext('2d');
const breakoutScoreEl = document.getElementById('breakoutScore');
const breakoutLivesEl = document.getElementById('breakoutLives');
const breakoutStatus = document.getElementById('breakoutStatus');
const breakoutStartBtn = document.getElementById('breakoutStart');
const breakoutResetBtn = document.getElementById('breakoutReset');

const breakout = {
  running:false,
  score:0,
  lives:3,
  ball:{x:280,y:220,dx:3,dy:-3,r:7},
  paddle:{w:90,h:10,x:235,speed:6},
  bricks:[],
  rows:4,
  cols:8,
  brickW:60,
  brickH:16,
  brickGap:10,
  raf:0,
  lastTime:0,
  keys:{left:false,right:false}
};

function resetBreakout(){
  breakout.running=false;
  breakout.score=0;
  breakout.lives=3;
  breakout.ball={x:breakoutCanvas.width/2,y:breakoutCanvas.height-80,dx:3,dy:-3,r:7};
  breakout.paddle.x=(breakoutCanvas.width-breakout.paddle.w)/2;
  breakout.bricks=[];
  const offsetX=(breakoutCanvas.width-(breakout.cols*breakout.brickW+(breakout.cols-1)*breakout.brickGap))/2;
  const offsetY=40;
  for(let r=0;r<breakout.rows;r++){
    for(let c=0;c<breakout.cols;c++){
      breakout.bricks.push({
        x:offsetX+c*(breakout.brickW+breakout.brickGap),
        y:offsetY+r*(breakout.brickH+breakout.brickGap),
        active:true
      });
    }
  }
  breakoutScoreEl.textContent = breakout.score;
  breakoutLivesEl.textContent = breakout.lives;
  breakoutStatus.textContent = 'Press Start to play. Controls: ← → / A D';
  drawBreakout();
}

function drawBreakout(){
  breakoutCtx.clearRect(0,0,breakoutCanvas.width,breakoutCanvas.height);
  breakoutCtx.fillStyle = gameColors.bg;
  breakoutCtx.fillRect(0,0,breakoutCanvas.width,breakoutCanvas.height);

  breakout.bricks.forEach(brick=>{
    if(!brick.active) return;
    breakoutCtx.fillStyle = gameColors.goldDim;
    breakoutCtx.fillRect(brick.x, brick.y, breakout.brickW, breakout.brickH);
    breakoutCtx.strokeStyle = gameColors.cyanDim;
    breakoutCtx.strokeRect(brick.x, brick.y, breakout.brickW, breakout.brickH);
  });

  breakoutCtx.fillStyle = gameColors.text;
  breakoutCtx.fillRect(breakout.paddle.x, breakoutCanvas.height - 24, breakout.paddle.w, breakout.paddle.h);

  breakoutCtx.beginPath();
  breakoutCtx.fillStyle = gameColors.gold;
  breakoutCtx.arc(breakout.ball.x, breakout.ball.y, breakout.ball.r, 0, Math.PI*2);
  breakoutCtx.fill();
}

function updateBreakout(scale){
  if(!breakout.running) return;
  if(breakout.keys.left) breakout.paddle.x = Math.max(0, breakout.paddle.x - breakout.paddle.speed * scale);
  if(breakout.keys.right) breakout.paddle.x = Math.min(breakoutCanvas.width - breakout.paddle.w, breakout.paddle.x + breakout.paddle.speed * scale);

  breakout.ball.x += breakout.ball.dx * scale;
  breakout.ball.y += breakout.ball.dy * scale;

  if(breakout.ball.x + breakout.ball.r > breakoutCanvas.width || breakout.ball.x - breakout.ball.r < 0){
    breakout.ball.dx *= -1;
  }
  if(breakout.ball.y - breakout.ball.r < 0){
    breakout.ball.dy *= -1;
  }

  const paddleY = breakoutCanvas.height - 24;
  if(breakout.ball.y + breakout.ball.r >= paddleY &&
    breakout.ball.x >= breakout.paddle.x &&
    breakout.ball.x <= breakout.paddle.x + breakout.paddle.w){
    breakout.ball.dy = -Math.abs(breakout.ball.dy);
    const hitPos = (breakout.ball.x - breakout.paddle.x) / breakout.paddle.w - 0.5;
    breakout.ball.dx = hitPos * 6;
    if(Math.abs(breakout.ball.dx) < 0.5) breakout.ball.dx = breakout.ball.dx >= 0 ? 0.5 : -0.5;
  }

  if(breakout.ball.y - breakout.ball.r > breakoutCanvas.height){
    breakout.lives -= 1;
    breakoutLivesEl.textContent = breakout.lives;
    if(breakout.lives <= 0){
      breakout.running = false;
      breakoutStatus.textContent = 'Game Over. Press Reset.';
      return;
    }
    breakout.ball = {x:breakoutCanvas.width/2,y:breakoutCanvas.height-80,dx:3,dy:-3,r:7};
    breakout.paddle.x = (breakoutCanvas.width-breakout.paddle.w)/2;
  }

  breakout.bricks.forEach(brick=>{
    if(!brick.active) return;
    if(breakout.ball.x > brick.x &&
      breakout.ball.x < brick.x + breakout.brickW &&
      breakout.ball.y - breakout.ball.r < brick.y + breakout.brickH &&
      breakout.ball.y + breakout.ball.r > brick.y){
      brick.active = false;
      breakout.ball.dy *= -1;
      breakout.score += 10;
      breakoutScoreEl.textContent = breakout.score;
    }
  });

  if(breakout.bricks.every(b=>!b.active)){
    breakout.running = false;
    breakoutStatus.textContent = 'You cleared the board! Press Reset.';
  }
}

function breakoutLoop(timestamp){
  if(!breakout.lastTime) breakout.lastTime = timestamp;
  const delta = Math.min(timestamp - breakout.lastTime, 100);
  breakout.lastTime = timestamp;
  updateBreakout(delta / (1000 / 60));
  drawBreakout();
  if(breakout.running){
    breakout.raf = requestAnimationFrame(breakoutLoop);
  }
}
function startBreakout(){
  if(breakout.running) return;
  breakout.running = true;
  breakout.lastTime = 0;
  breakoutStatus.textContent = 'Playing...';
  breakoutLoop(performance.now());
}
function pauseBreakout(){
  breakout.running = false;
  cancelAnimationFrame(breakout.raf);
}

breakoutStartBtn.addEventListener('click', startBreakout);
breakoutResetBtn.addEventListener('click', ()=>resetBreakout());
resetBreakout();

// Snake
const snakeCanvas = document.getElementById('snakeCanvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeScoreEl = document.getElementById('snakeScore');
const snakeBestEl = document.getElementById('snakeBest');
const snakeStatus = document.getElementById('snakeStatus');
const snakeStartBtn = document.getElementById('snakeStart');
const snakeResetBtn = document.getElementById('snakeReset');

const snakeGame = {
  running:false,
  score:0,
  best:0,
  size:18,
  dir:{x:1,y:0},
  nextDir:{x:1,y:0},
  snake:[{x:9,y:9}],
  food:{x:5,y:5},
  timer:null
};

function placeFood(){
  let x,y;
  do{
    x=Math.floor(Math.random()*snakeGame.size);
    y=Math.floor(Math.random()*snakeGame.size);
  }while(snakeGame.snake.some(s=>s.x===x&&s.y===y));
  snakeGame.food={x,y};
}

function resetSnake(){
  snakeGame.running=false;
  clearInterval(snakeGame.timer);
  snakeGame.score=0;
  snakeGame.dir={x:1,y:0};
  snakeGame.nextDir={x:1,y:0};
  snakeGame.snake=[{x:9,y:9},{x:8,y:9}];
  placeFood();
  snakeScoreEl.textContent = snakeGame.score;
  snakeStatus.textContent = 'Use arrow keys to move. Avoid walls.';
  drawSnake();
}

function drawSnake(){
  snakeCtx.clearRect(0,0,snakeCanvas.width,snakeCanvas.height);
  const cell = snakeCanvas.width / snakeGame.size;
  snakeCtx.fillStyle = gameColors.bg;
  snakeCtx.fillRect(0,0,snakeCanvas.width,snakeCanvas.height);

  snakeCtx.fillStyle = gameColors.cyan;
  snakeCtx.fillRect(snakeGame.food.x*cell, snakeGame.food.y*cell, cell, cell);

  snakeCtx.fillStyle = gameColors.text;
  snakeGame.snake.forEach((s,i)=>{
    snakeCtx.fillRect(s.x*cell, s.y*cell, cell-1, cell-1);
    if(i===0){
      snakeCtx.fillStyle = gameColors.gold;
      snakeCtx.fillRect(s.x*cell, s.y*cell, cell-1, cell-1);
      snakeCtx.fillStyle = gameColors.text;
    }
  });
}

function tickSnake(){
  snakeGame.dir = snakeGame.nextDir;
  const head = {x:snakeGame.snake[0].x + snakeGame.dir.x, y:snakeGame.snake[0].y + snakeGame.dir.y};
  if(head.x<0 || head.y<0 || head.x>=snakeGame.size || head.y>=snakeGame.size ||
    snakeGame.snake.slice(0,-1).some(s=>s.x===head.x && s.y===head.y)){
    snakeStatus.textContent = 'Game Over. Press Reset.';
    snakeGame.running=false;
    clearInterval(snakeGame.timer);
    return;
  }
  snakeGame.snake.unshift(head);
  if(head.x===snakeGame.food.x && head.y===snakeGame.food.y){
    snakeGame.score += 10;
    snakeScoreEl.textContent = snakeGame.score;
    if(snakeGame.score > snakeGame.best){
      snakeGame.best = snakeGame.score;
      snakeBestEl.textContent = snakeGame.best;
    }
    placeFood();
  }else{
    snakeGame.snake.pop();
  }
  drawSnake();
}

function startSnake(){
  if(snakeGame.running) return;
  snakeGame.running=true;
  snakeStatus.textContent = 'Playing...';
  snakeGame.timer = setInterval(tickSnake, 130);
}
function pauseSnake(){
  snakeGame.running=false;
  clearInterval(snakeGame.timer);
}

snakeStartBtn.addEventListener('click', startSnake);
snakeResetBtn.addEventListener('click', resetSnake);
resetSnake();

// Memory Match
const memoryGrid = document.getElementById('memoryGrid');
const memoryMoves = document.getElementById('memoryMoves');
const memoryTime = document.getElementById('memoryTime');
const memoryStatus = document.getElementById('memoryStatus');
const memoryShuffleBtn = document.getElementById('memoryShuffle');
const memoryResetBtn = document.getElementById('memoryReset');

const memoryGame = {
  values:[],
  flipped:[],
  matched:0,
  moves:0,
  timer:null,
  seconds:0,
  active:false,
  generation:0
};

function buildMemory(){
  memoryGrid.innerHTML = '';
  const base = ['A','B','C','D','E','F','G','H'];
  memoryGame.values = [...base, ...base].sort(()=>Math.random()-0.5);
  memoryGame.values.forEach(value=>{
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.type = 'button';
    btn.dataset.value = value;
    btn.textContent = '?';
    btn.addEventListener('click',()=>flipCard(btn));
    memoryGrid.appendChild(btn);
  });
}

function startMemoryTimer(){
  if(memoryGame.timer) return;
  memoryGame.timer = setInterval(()=>{
    memoryGame.seconds += 1;
    memoryTime.textContent = memoryGame.seconds;
  },1000);
}

function resetMemory(){
  memoryGame.flipped=[];
  memoryGame.matched=0;
  memoryGame.moves=0;
  memoryGame.seconds=0;
  memoryGame.active=false;
  memoryGame.generation=(memoryGame.generation||0)+1;
  clearInterval(memoryGame.timer);
  memoryGame.timer=null;
  memoryMoves.textContent = '0';
  memoryTime.textContent = '0';
  memoryStatus.textContent = 'Match all pairs with fewer moves.';
  buildMemory();
}
function pauseMemory(){
  if(memoryGame.timer){
    clearInterval(memoryGame.timer);
    memoryGame.timer = null;
  }
  memoryGame.active = false;
}

function flipCard(card){
  if(card.classList.contains('is-matched') || card.classList.contains('is-flipped')) return;
  if(memoryGame.flipped.length === 2) return;
  if(!memoryGame.active){
    memoryGame.active = true;
    startMemoryTimer();
  }
  card.classList.add('is-flipped');
  card.textContent = card.dataset.value;
  memoryGame.flipped.push(card);
  if(memoryGame.flipped.length === 2){
    memoryGame.moves += 1;
    memoryMoves.textContent = memoryGame.moves;
    const [a,b] = memoryGame.flipped;
    if(a.dataset.value === b.dataset.value){
      a.classList.add('is-matched');
      b.classList.add('is-matched');
      memoryGame.flipped = [];
      memoryGame.matched += 2;
      if(memoryGame.matched === memoryGame.values.length){
        clearInterval(memoryGame.timer);
        memoryStatus.textContent = `Completed in ${memoryGame.moves} moves · ${memoryGame.seconds}s`;
      }
    } else {
      const generation = memoryGame.generation;
      setTimeout(()=>{
        if(memoryGame.generation !== generation) return;
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        a.textContent='?';
        b.textContent='?';
        memoryGame.flipped = [];
      },600);
    }
  }
}

memoryShuffleBtn.addEventListener('click', resetMemory);
memoryResetBtn.addEventListener('click', resetMemory);
resetMemory();

// Pixel Runner
const runnerCanvas = document.getElementById('runnerCanvas');
const runnerCtx = runnerCanvas.getContext('2d');
const runnerScoreEl = document.getElementById('runnerScore');
const runnerBestEl = document.getElementById('runnerBest');
const runnerStatus = document.getElementById('runnerStatus');
const runnerStartBtn = document.getElementById('runnerStart');
const runnerResetBtn = document.getElementById('runnerReset');

const runnerGame = {
  running:false,
  score:0,
  best:0,
  speed:3.2,
  gravity:0.5,
  jump:-9,
  ground:runnerCanvas.height - 28,
  player:{x:60,y:0,w:24,h:28,vy:0},
  obstacles:[],
  spawnTimer:0,
  raf:0,
  lastTime:0
};

function resetRunner(){
  runnerGame.running=false;
  runnerGame.score=0;
  runnerGame.player.y = runnerGame.ground - runnerGame.player.h;
  runnerGame.player.vy = 0;
  runnerGame.obstacles = [];
  runnerGame.spawnTimer = 0;
  runnerScoreEl.textContent = '0';
  runnerStatus.textContent = 'Press Start. Space to jump.';
  drawRunner();
}

function spawnRunnerObstacle(){
  const width = 18 + Math.random()*16;
  const height = 18 + Math.random()*22;
  runnerGame.obstacles.push({
    x: runnerCanvas.width + 20,
    y: runnerGame.ground - height,
    w: width,
    h: height
  });
}

function drawRunner(){
  runnerCtx.clearRect(0,0,runnerCanvas.width,runnerCanvas.height);
  runnerCtx.fillStyle = gameColors.bg;
  runnerCtx.fillRect(0,0,runnerCanvas.width,runnerCanvas.height);
  runnerCtx.fillStyle = gameColors.cyanDim;
  runnerCtx.fillRect(0, runnerGame.ground, runnerCanvas.width, 2);
  runnerCtx.fillStyle = gameColors.text;
  runnerCtx.fillRect(runnerGame.player.x, runnerGame.player.y, runnerGame.player.w, runnerGame.player.h);
  runnerCtx.fillStyle = gameColors.pink;
  runnerGame.obstacles.forEach(obs=>{
    runnerCtx.fillRect(obs.x, obs.y, obs.w, obs.h);
  });
}

function updateRunner(delta){
  runnerGame.score += delta * 0.02;
  const newScore = String(Math.floor(runnerGame.score));
  if(runnerScoreEl.textContent !== newScore) runnerScoreEl.textContent = newScore;
  if(runnerGame.score > runnerGame.best){
    runnerGame.best = Math.floor(runnerGame.score);
    const bestStr = String(runnerGame.best);
    if(runnerBestEl.textContent !== bestStr) runnerBestEl.textContent = bestStr;
  }

  runnerGame.spawnTimer += delta;
  if(runnerGame.spawnTimer > 1100){
    spawnRunnerObstacle();
    runnerGame.spawnTimer = 0;
  }

  runnerGame.player.vy += runnerGame.gravity;
  runnerGame.player.y += runnerGame.player.vy;
  if(runnerGame.player.y > runnerGame.ground - runnerGame.player.h){
    runnerGame.player.y = runnerGame.ground - runnerGame.player.h;
    runnerGame.player.vy = 0;
  }

  runnerGame.obstacles.forEach(obs=>{obs.x -= runnerGame.speed;});
  runnerGame.obstacles = runnerGame.obstacles.filter(obs=>obs.x + obs.w > 0);

  const p = runnerGame.player;
  for(const obs of runnerGame.obstacles){
    if(p.x < obs.x + obs.w &&
      p.x + p.w > obs.x &&
      p.y < obs.y + obs.h &&
      p.y + p.h > obs.y){
      runnerGame.running = false;
      runnerStatus.textContent = 'Game Over. Press Reset.';
      return;
    }
  }
}

function runnerLoop(timestamp){
  if(!runnerGame.running) return;
  if(!runnerGame.lastTime) runnerGame.lastTime = timestamp;
  const delta = Math.min(timestamp - runnerGame.lastTime, 100);
  runnerGame.lastTime = timestamp;
  updateRunner(delta);
  drawRunner();
  if(runnerGame.running){
    runnerGame.raf = requestAnimationFrame(runnerLoop);
  }
}

function startRunner(){
  if(runnerGame.running) return;
  runnerGame.running = true;
  runnerGame.lastTime = 0;
  runnerStatus.textContent = 'Playing...';
  runnerLoop(performance.now());
}

function pauseRunner(){
  runnerGame.running = false;
  cancelAnimationFrame(runnerGame.raf);
}

function runnerJump(){
  if(!runnerGame.running) return;
  if(runnerGame.player.y >= runnerGame.ground - runnerGame.player.h - 1){
    runnerGame.player.vy = runnerGame.jump;
  }
}

runnerStartBtn.addEventListener('click', startRunner);
runnerResetBtn.addEventListener('click', resetRunner);
resetRunner();

// Astro Dodge
const dodgeCanvas = document.getElementById('dodgeCanvas');
const dodgeCtx = dodgeCanvas.getContext('2d');
const dodgeScoreEl = document.getElementById('dodgeScore');
const dodgeBestEl = document.getElementById('dodgeBest');
const dodgeStatus = document.getElementById('dodgeStatus');
const dodgeStartBtn = document.getElementById('dodgeStart');
const dodgeResetBtn = document.getElementById('dodgeReset');

const dodgeGame = {
  running:false,
  score:0,
  best:0,
  ship:{x:190,y:dodgeCanvas.height-30,w:28,h:16,speed:5},
  asteroids:[],
  spawnTimer:0,
  raf:0,
  lastTime:0,
  keys:{left:false,right:false}
};

function resetDodge(){
  dodgeGame.running=false;
  dodgeGame.score=0;
  dodgeGame.ship.x = (dodgeCanvas.width - dodgeGame.ship.w)/2;
  dodgeGame.asteroids = [];
  dodgeGame.spawnTimer = 0;
  dodgeScoreEl.textContent = '0';
  dodgeStatus.textContent = 'Move with ← → / A D and dodge the asteroids.';
  drawDodge();
}

function spawnAsteroid(){
  const size = 10 + Math.random()*10;
  dodgeGame.asteroids.push({
    x: Math.random()*(dodgeCanvas.width - size),
    y: -size,
    r: size/2,
    speed: 1.6 + Math.random()*1.6
  });
}

function drawDodge(){
  dodgeCtx.clearRect(0,0,dodgeCanvas.width,dodgeCanvas.height);
  dodgeCtx.fillStyle = gameColors.bg;
  dodgeCtx.fillRect(0,0,dodgeCanvas.width,dodgeCanvas.height);

  dodgeCtx.fillStyle = gameColors.text;
  dodgeCtx.fillRect(dodgeGame.ship.x, dodgeGame.ship.y, dodgeGame.ship.w, dodgeGame.ship.h);

  dodgeCtx.fillStyle = gameColors.gold;
  dodgeGame.asteroids.forEach(ast=>{
    dodgeCtx.beginPath();
    dodgeCtx.arc(ast.x + ast.r, ast.y + ast.r, ast.r, 0, Math.PI*2);
    dodgeCtx.fill();
  });
}

function updateDodge(delta){
  dodgeGame.score += delta * 0.02;
  const newScore = String(Math.floor(dodgeGame.score));
  if(dodgeScoreEl.textContent !== newScore) dodgeScoreEl.textContent = newScore;
  if(dodgeGame.score > dodgeGame.best){
    dodgeGame.best = Math.floor(dodgeGame.score);
    const bestStr = String(dodgeGame.best);
    if(dodgeBestEl.textContent !== bestStr) dodgeBestEl.textContent = bestStr;
  }

  if(dodgeGame.keys.left) dodgeGame.ship.x = Math.max(0, dodgeGame.ship.x - dodgeGame.ship.speed);
  if(dodgeGame.keys.right) dodgeGame.ship.x = Math.min(dodgeCanvas.width - dodgeGame.ship.w, dodgeGame.ship.x + dodgeGame.ship.speed);

  dodgeGame.spawnTimer += delta;
  if(dodgeGame.spawnTimer > 750){
    spawnAsteroid();
    dodgeGame.spawnTimer = 0;
  }

  dodgeGame.asteroids.forEach(ast=>{ast.y += ast.speed;});
  dodgeGame.asteroids = dodgeGame.asteroids.filter(ast=>ast.y < dodgeCanvas.height + 20);

  for(const ast of dodgeGame.asteroids){
    const hit = dodgeGame.ship.x < ast.x + ast.r*2 &&
      dodgeGame.ship.x + dodgeGame.ship.w > ast.x &&
      dodgeGame.ship.y < ast.y + ast.r*2 &&
      dodgeGame.ship.y + dodgeGame.ship.h > ast.y;
    if(hit){
      dodgeGame.running = false;
      dodgeStatus.textContent = 'Impact! Press Reset.';
      return;
    }
  }
}

function dodgeLoop(timestamp){
  if(!dodgeGame.running) return;
  if(!dodgeGame.lastTime) dodgeGame.lastTime = timestamp;
  const delta = Math.min(timestamp - dodgeGame.lastTime, 100);
  dodgeGame.lastTime = timestamp;
  updateDodge(delta);
  drawDodge();
  if(dodgeGame.running){
    dodgeGame.raf = requestAnimationFrame(dodgeLoop);
  }
}

function startDodge(){
  if(dodgeGame.running) return;
  dodgeGame.running = true;
  dodgeGame.lastTime = 0;
  dodgeStatus.textContent = 'Playing...';
  dodgeLoop(performance.now());
}

function pauseDodge(){
  dodgeGame.running = false;
  cancelAnimationFrame(dodgeGame.raf);
}

dodgeStartBtn.addEventListener('click', startDodge);
dodgeResetBtn.addEventListener('click', resetDodge);
resetDodge();

// Tower Drop
const towerCanvas = document.getElementById('towerCanvas');
const towerCtx = towerCanvas.getContext('2d');
const towerScoreEl = document.getElementById('towerScore');
const towerBestEl = document.getElementById('towerBest');
const towerStatus = document.getElementById('towerStatus');
const towerStartBtn = document.getElementById('towerStart');
const towerDropBtn = document.getElementById('towerDrop');
const towerResetBtn = document.getElementById('towerReset');

const towerGame = {
  running:false,
  score:0,
  best:0,
  blockH:16,
  stack:[],
  current:{x:0,y:0,w:120,dir:1,speed:2.4},
  raf:0,
  lastTime:0
};

function resetTower(){
  towerGame.running=false;
  towerGame.score=0;
  towerGame.stack = [{
    x:(towerCanvas.width-140)/2,
    y:towerCanvas.height-26,
    w:140
  }];
  towerGame.current = {
    x:0,
    y:towerGame.stack[0].y - towerGame.blockH - 6,
    w:140,
    dir:1,
    speed:2.4
  };
  towerScoreEl.textContent = '0';
  towerStatus.textContent = 'Press Drop or Space to stack the blocks.';
  drawTower();
}

function drawTower(){
  towerCtx.clearRect(0,0,towerCanvas.width,towerCanvas.height);
  towerCtx.fillStyle = gameColors.bg;
  towerCtx.fillRect(0,0,towerCanvas.width,towerCanvas.height);

  towerCtx.fillStyle = gameColors.goldDim;
  towerGame.stack.forEach(block=>{
    towerCtx.fillRect(block.x, block.y, block.w, towerGame.blockH);
  });
  towerCtx.fillStyle = gameColors.cyan;
  towerCtx.fillRect(towerGame.current.x, towerGame.current.y, towerGame.current.w, towerGame.blockH);
}

function updateTower(scale){
  if(!towerGame.running) return;
  towerGame.current.x += towerGame.current.dir * towerGame.current.speed * scale;
  if(towerGame.current.x <= 0 || towerGame.current.x + towerGame.current.w >= towerCanvas.width){
    towerGame.current.dir *= -1;
  }
}

function towerLoop(timestamp){
  if(!towerGame.lastTime) towerGame.lastTime = timestamp;
  const delta = Math.min(timestamp - towerGame.lastTime, 100);
  towerGame.lastTime = timestamp;
  updateTower(delta / (1000 / 60));
  drawTower();
  if(towerGame.running){
    towerGame.raf = requestAnimationFrame(towerLoop);
  }
}

function dropTower(){
  if(!towerGame.running) return;
  const last = towerGame.stack[towerGame.stack.length - 1];
  const left = Math.max(towerGame.current.x, last.x);
  const right = Math.min(towerGame.current.x + towerGame.current.w, last.x + last.w);
  const overlap = right - left;
  if(overlap <= 4){
    towerGame.running = false;
    towerStatus.textContent = 'Missed! Press Reset.';
    return;
  }
  towerGame.stack.push({x:left,y:towerGame.current.y,w:overlap});
  towerGame.score += 1;
  towerScoreEl.textContent = String(towerGame.score);
  if(towerGame.score > towerGame.best){
    towerGame.best = towerGame.score;
    towerBestEl.textContent = String(towerGame.best);
  }
  towerGame.current = {
    x:0,
    y:towerGame.current.y - towerGame.blockH - 6,
    w:overlap,
    dir:1,
    speed:towerGame.current.speed + 0.08
  };
  if(towerGame.current.y < 20){
    towerGame.running = false;
    towerStatus.textContent = 'Perfect stack! Press Reset.';
  }
}

function startTower(){
  if(towerGame.running) return;
  towerGame.running = true;
  towerGame.lastTime = 0;
  towerStatus.textContent = 'Playing...';
  towerLoop(performance.now());
}

function pauseTower(){
  towerGame.running = false;
  cancelAnimationFrame(towerGame.raf);
}

towerStartBtn.addEventListener('click', startTower);
towerDropBtn.addEventListener('click', dropTower);
towerResetBtn.addEventListener('click', resetTower);
resetTower();

// Hex Slide
const hexGrid = document.getElementById('hexGrid');
const hexMovesEl = document.getElementById('hexMoves');
const hexTimeEl = document.getElementById('hexTime');
const hexStatus = document.getElementById('hexStatus');
const hexShuffleBtn = document.getElementById('hexShuffle');
const hexResetBtn = document.getElementById('hexReset');

const hexGame = {
  tiles:[],
  empty:15,
  moves:0,
  seconds:0,
  timer:null,
  active:false
};

function renderHex(){
  hexGrid.innerHTML = '';
  hexGame.tiles.forEach((value,index)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `hex-tile${value === 0 ? ' empty' : ''}`;
    btn.textContent = value === 0 ? '' : value;
    btn.addEventListener('click',()=>tryMoveHex(index));
    hexGrid.appendChild(btn);
  });
}

function getHexNeighbors(index){
  const row = Math.floor(index/4);
  const col = index%4;
  const neighbors = [];
  if(row > 0) neighbors.push(index-4);
  if(row < 3) neighbors.push(index+4);
  if(col > 0) neighbors.push(index-1);
  if(col < 3) neighbors.push(index+1);
  return neighbors;
}

function startHexTimer(){
  if(hexGame.timer) return;
  hexGame.timer = setInterval(()=>{
    hexGame.seconds += 1;
    hexTimeEl.textContent = String(hexGame.seconds);
  },1000);
}

function pauseHex(){
  if(hexGame.timer){
    clearInterval(hexGame.timer);
    hexGame.timer = null;
  }
  hexGame.active = false;
}

function swapHex(index){
  [hexGame.tiles[index], hexGame.tiles[hexGame.empty]] = [hexGame.tiles[hexGame.empty], hexGame.tiles[index]];
  hexGame.empty = index;
}

function tryMoveHex(index){
  if(!getHexNeighbors(hexGame.empty).includes(index)) return;
  if(!hexGame.active){
    hexGame.active = true;
    startHexTimer();
  }
  swapHex(index);
  hexGame.moves += 1;
  hexMovesEl.textContent = String(hexGame.moves);
  renderHex();
  checkHexSolved();
}

function moveHexByKey(key){
  const row = Math.floor(hexGame.empty/4);
  const col = hexGame.empty%4;
  let target = null;
  if(key === 'ArrowUp' && row < 3) target = hexGame.empty + 4;
  if(key === 'ArrowDown' && row > 0) target = hexGame.empty - 4;
  if(key === 'ArrowLeft' && col < 3) target = hexGame.empty + 1;
  if(key === 'ArrowRight' && col > 0) target = hexGame.empty - 1;
  if(target !== null) tryMoveHex(target);
}

function checkHexSolved(){
  for(let i=0;i<15;i++){
    if(hexGame.tiles[i] !== i+1) return;
  }
  if(hexGame.tiles[15] !== 0) return;
  pauseHex();
  hexStatus.textContent = `Solved in ${hexGame.moves} moves · ${hexGame.seconds}s`;
}

function shuffleHex(){
  hexGame.tiles = [...Array(15).keys()].map(i=>i+1).concat(0);
  hexGame.empty = 15;
  for(let i=0;i<200;i++){
    const neighbors = getHexNeighbors(hexGame.empty);
    const choice = neighbors[Math.floor(Math.random()*neighbors.length)];
    swapHex(choice);
  }
  hexGame.moves = 0;
  hexGame.seconds = 0;
  hexGame.active = false;
  pauseHex();
  hexMovesEl.textContent = '0';
  hexTimeEl.textContent = '0';
  hexStatus.textContent = 'Slide tiles with arrow keys or taps.';
  renderHex();
}

hexShuffleBtn.addEventListener('click', shuffleHex);
hexResetBtn.addEventListener('click', shuffleHex);
shuffleHex();

// Orbit Tap
const orbitCanvas = document.getElementById('orbitCanvas');
const orbitCtx = orbitCanvas.getContext('2d');
const orbitScoreEl = document.getElementById('orbitScore');
const orbitTimeEl = document.getElementById('orbitTime');
const orbitStatus = document.getElementById('orbitStatus');
const orbitStartBtn = document.getElementById('orbitStart');
const orbitResetBtn = document.getElementById('orbitReset');

const orbitGame = {
  running:false,
  score:0,
  time:20,
  target:{x:0,y:0,r:20},
  timer:null
};

function spawnOrbitTarget(){
  const r = 16 + Math.random()*12;
  orbitGame.target.r = r;
  orbitGame.target.x = r + Math.random()*(orbitCanvas.width - r*2);
  orbitGame.target.y = r + Math.random()*(orbitCanvas.height - r*2);
}

function drawOrbit(){
  orbitCtx.clearRect(0,0,orbitCanvas.width,orbitCanvas.height);
  orbitCtx.fillStyle = gameColors.bg;
  orbitCtx.fillRect(0,0,orbitCanvas.width,orbitCanvas.height);
  orbitCtx.strokeStyle = gameColors.cyanDim;
  orbitCtx.lineWidth = 6;
  orbitCtx.beginPath();
  orbitCtx.arc(orbitGame.target.x, orbitGame.target.y, orbitGame.target.r, 0, Math.PI*2);
  orbitCtx.stroke();
  orbitCtx.fillStyle = gameColors.pink;
  orbitCtx.beginPath();
  orbitCtx.arc(orbitGame.target.x, orbitGame.target.y, orbitGame.target.r*0.45, 0, Math.PI*2);
  orbitCtx.fill();
}

function startOrbit(){
  if(orbitGame.running) return;
  orbitGame.running = true;
  orbitGame.score = 0;
  orbitGame.time = 20;
  orbitScoreEl.textContent = '0';
  orbitTimeEl.textContent = String(orbitGame.time);
  orbitStatus.textContent = 'Go!';
  spawnOrbitTarget();
  clearInterval(orbitGame.timer);
  orbitGame.timer = setInterval(()=>{
    orbitGame.time -= 1;
    orbitTimeEl.textContent = String(orbitGame.time);
    drawOrbit();
    if(orbitGame.time <= 0){
      orbitGame.running = false;
      clearInterval(orbitGame.timer);
      orbitGame.timer = null;
      orbitStatus.textContent = 'Time! Press Reset.';
    }
  },1000);
  drawOrbit();
}

function pauseOrbit(){
  orbitGame.running = false;
  clearInterval(orbitGame.timer);
}

function resetOrbit(){
  pauseOrbit();
  orbitGame.score = 0;
  orbitGame.time = 20;
  orbitScoreEl.textContent = '0';
  orbitTimeEl.textContent = '20';
  orbitStatus.textContent = 'Click the glowing orb before time runs out.';
  spawnOrbitTarget();
  drawOrbit();
}

orbitCanvas.addEventListener('click', e=>{
  if(!orbitGame.running) return;
  const rect = orbitCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dx = x - orbitGame.target.x;
  const dy = y - orbitGame.target.y;
  if(Math.hypot(dx,dy) <= orbitGame.target.r){
    orbitGame.score += 1;
    orbitScoreEl.textContent = String(orbitGame.score);
    spawnOrbitTarget();
    drawOrbit();
  }
});

orbitStartBtn.addEventListener('click', startOrbit);
orbitResetBtn.addEventListener('click', resetOrbit);
resetOrbit();

// Light Trails
const trailPads = [...document.querySelectorAll('.trail-pad')];
const trailLevelEl = document.getElementById('trailLevel');
const trailBestEl = document.getElementById('trailBest');
const trailStatus = document.getElementById('trailStatus');
const trailStartBtn = document.getElementById('trailStart');
const trailResetBtn = document.getElementById('trailReset');

const trailGame = {
  sequence:[],
  userIndex:0,
  playing:false,
  level:0,
  best:0,
  timeout:null
};

function flashTrailPad(index){
  const pad = trailPads[index];
  if(!pad) return;
  pad.classList.add('active');
  setTimeout(()=>pad.classList.remove('active'), 250);
}

function playTrailSequence(){
  trailGame.playing = true;
  trailStatus.textContent = 'Watch the sequence';
  let i = 0;
  const step = ()=>{
    if(i >= trailGame.sequence.length){
      trailGame.playing = false;
      trailStatus.textContent = 'Your turn';
      return;
    }
    flashTrailPad(trailGame.sequence[i]);
    i += 1;
    trailGame.timeout = setTimeout(step, 520);
  };
  step();
}

function addTrailStep(){
  trailGame.sequence.push(Math.floor(Math.random()*4));
  trailGame.userIndex = 0;
  trailGame.level = trailGame.sequence.length;
  trailLevelEl.textContent = String(trailGame.level);
  playTrailSequence();
}

function startTrail(){
  trailGame.sequence = [];
  trailGame.userIndex = 0;
  trailGame.level = 0;
  trailLevelEl.textContent = '0';
  trailStatus.textContent = 'Get ready...';
  addTrailStep();
}

function resetTrail(){
  pauseTrail();
  trailGame.sequence = [];
  trailGame.userIndex = 0;
  trailGame.level = 0;
  trailLevelEl.textContent = '0';
  trailStatus.textContent = 'Repeat the light sequence.';
}

function pauseTrail(){
  trailGame.playing = false;
  clearTimeout(trailGame.timeout);
}

function handleTrailInput(index){
  if(trailGame.playing || trailGame.sequence.length === 0) return;
  if(trailGame.userIndex >= trailGame.sequence.length) return;
  flashTrailPad(index);
  if(trailGame.sequence[trailGame.userIndex] !== index){
    trailStatus.textContent = 'Missed! Press Start.';
    if(trailGame.level > trailGame.best){
      trailGame.best = trailGame.level;
      trailBestEl.textContent = String(trailGame.best);
    }
    trailGame.sequence = [];
    trailGame.userIndex = 0;
    trailGame.level = 0;
    trailLevelEl.textContent = '0';
    return;
  }
  trailGame.userIndex += 1;
  if(trailGame.userIndex === trailGame.sequence.length){
    trailGame.timeout = setTimeout(addTrailStep, 400);
  }
}

trailPads.forEach(pad=>{
  pad.addEventListener('click',()=>handleTrailInput(Number(pad.dataset.pad)));
});
trailStartBtn.addEventListener('click', startTrail);
trailResetBtn.addEventListener('click', resetTrail);
resetTrail();

// Global input
document.addEventListener('keydown', e=>{
  const key = e.key;
  if(activeGame === 'breakout'){
    if(key === 'ArrowLeft' || key === 'a' || key === 'A'){
      breakout.keys.left = true;
    }else if(key === 'ArrowRight' || key === 'd' || key === 'D'){
      breakout.keys.right = true;
    }else{
      return;
    }
    e.preventDefault();
  }else if(activeGame === 'runner'){
    if(e.code === 'Space'){
      runnerJump();
      e.preventDefault();
    }
  }else if(activeGame === 'dodge'){
    if(key === 'ArrowLeft' || key === 'a' || key === 'A'){
      dodgeGame.keys.left = true;
    }else if(key === 'ArrowRight' || key === 'd' || key === 'D'){
      dodgeGame.keys.right = true;
    }else{
      return;
    }
    e.preventDefault();
  }else if(activeGame === 'tower'){
    if(e.code === 'Space'){
      dropTower();
      e.preventDefault();
    }
  }else if(activeGame === 'snake'){
    const dir = snakeGame.nextDir;
    const handled = (
      (key === 'ArrowUp' && dir.y !== 1 && (snakeGame.nextDir={x:0,y:-1}))
      || (key === 'ArrowDown' && dir.y !== -1 && (snakeGame.nextDir={x:0,y:1}))
      || (key === 'ArrowLeft' && dir.x !== 1 && (snakeGame.nextDir={x:-1,y:0}))
      || (key === 'ArrowRight' && dir.x !== -1 && (snakeGame.nextDir={x:1,y:0}))
    );
    if(handled) e.preventDefault();
  }else if(activeGame === 'hex'){
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)){
      moveHexByKey(key);
      e.preventDefault();
    }
  }
});

document.addEventListener('keyup', e=>{
  const key = e.key;
  if(activeGame === 'breakout' && (key === 'ArrowLeft' || key === 'a' || key === 'A')){
    breakout.keys.left = false;
  }
  if(activeGame === 'breakout' && (key === 'ArrowRight' || key === 'd' || key === 'D')){
    breakout.keys.right = false;
  }
  if(activeGame === 'dodge' && (key === 'ArrowLeft' || key === 'a' || key === 'A')){
    dodgeGame.keys.left = false;
  }
  if(activeGame === 'dodge' && (key === 'ArrowRight' || key === 'd' || key === 'D')){
    dodgeGame.keys.right = false;
  }
});
