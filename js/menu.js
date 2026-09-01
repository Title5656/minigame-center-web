'use strict';

const blockTransition = document.getElementById('blockTransition');
const blockRows = 8;
const blockCols = 12;
let pixelBusy = false;

function buildBlockTransition(){
  if(!blockTransition) return;
  blockTransition.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let r=0;r<blockRows;r++){
    for(let c=0;c<blockCols;c++){
      const cell = document.createElement('div');
      cell.className = 'block-cell';
      const delay = ((blockRows - 1 - r) * 0.004) + (c * 0.012);
      cell.style.setProperty('--delay', `${delay.toFixed(3)}s`);
      cell.style.setProperty('--hue', `${(c * 22 + r * 13) % 360}`);
      frag.appendChild(cell);
    }
  }
  blockTransition.appendChild(frag);
}

function runBlockTransition(onMid){
  if(!blockTransition || pixelBusy){
    if(onMid) onMid();
    return;
  }
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
    },400);
  },550 + ((blockCols - 1) * 0.012 + (blockRows - 1) * 0.004) * 1000);
}

buildBlockTransition();

document.querySelectorAll('.game-card').forEach(card=>{
  card.addEventListener('click', e=>{
    const href = card.getAttribute('href');
    if(!href) return;
    e.preventDefault();
    runBlockTransition(()=>{ window.location.href = href; });
  });
});

document.querySelectorAll('nav a').forEach(a=>{
  a.addEventListener('click', e=>{
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')){
      e.preventDefault();
      runBlockTransition(()=>{
        document.querySelector(href)?.scrollIntoView({behavior:'smooth'});
      });
    }
  });
});
