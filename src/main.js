import './styles/index.css';
import { games } from './data/games.js';
import { createBlockTransition } from './ui/transition.js';
import { createGameCard } from './ui/game-card.js';

const transition = createBlockTransition(document.getElementById('blockTransition'));

const gameGrid = document.getElementById('game-grid');
if (gameGrid) {
  gameGrid.innerHTML = '';
  games.forEach((game) => {
    const card = createGameCard(game, (href) => {
      transition.run(() => {
        window.location.href = href;
      });
    });
    gameGrid.appendChild(card);
  });
}

const rosterGrid = document.getElementById('roster-grid');
if (rosterGrid) {
  rosterGrid.innerHTML = '';
  games.forEach((game) => {
    const item = document.createElement('div');
    item.className = 'roster-item';
    item.textContent = `${game.name} · Playable`;
    rosterGrid.appendChild(item);
  });
}

document.querySelectorAll('nav a').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      transition.run(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });
});
