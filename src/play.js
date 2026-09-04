import './styles/index.css';
import { games, isValidGame } from './data/games.js';
import { createBlockTransition } from './ui/transition.js';
import { createGameNav } from './ui/game-nav.js';

const gameLoaders = {
  breakout: () => import('./games/breakout/index.js'),
  snake: () => import('./games/snake/index.js'),
  memory: () => import('./games/memory/index.js'),
  runner: () => import('./games/runner/index.js'),
  dodge: () => import('./games/dodge/index.js'),
  tower: () => import('./games/tower/index.js'),
  hex: () => import('./games/hex/index.js'),
  orbit: () => import('./games/orbit/index.js'),
  trail: () => import('./games/trail/index.js')
};

const transition = createBlockTransition(document.getElementById('blockTransition'));
const gameRoot = document.getElementById('game-root');
const gameNavEl = document.getElementById('gameNav');
const notFoundPanel = document.getElementById('notFoundPanel');
const notFoundHome = document.getElementById('notFoundHome');

let activeInstance = null;

async function initPlay() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('game');

  if (slug && isValidGame(slug) && gameLoaders[slug]) {
    if (notFoundPanel) notFoundPanel.classList.remove('is-active');
    if (gameNavEl) {
      gameNavEl.style.display = '';
      createGameNav({
        container: gameNavEl,
        games,
        activeSlug: slug,
        onSelectGame(newSlug) {
          transition.run(() => {
            window.location.href = `play.html?game=${encodeURIComponent(newSlug)}`;
          });
        },
        onHome() {
          transition.run(() => {
            window.location.href = 'index.html';
          });
        }
      });
    }

    try {
      const loader = gameLoaders[slug];
      const mod = await loader();
      if (activeInstance) {
        activeInstance.destroy?.();
      }
      activeInstance = mod.mount(gameRoot);
      transition.run(null);
    } catch (err) {
      console.error('Failed to load game module:', err);
      showNotFound();
    }
  } else {
    showNotFound();
  }
}

function showNotFound() {
  if (gameNavEl) gameNavEl.style.display = 'none';
  if (gameRoot) gameRoot.innerHTML = '';
  if (notFoundPanel) notFoundPanel.classList.add('is-active');
  if (notFoundHome) {
    notFoundHome.addEventListener('click', (e) => {
      e.preventDefault();
      transition.run(() => {
        window.location.href = 'index.html';
      });
    });
  }
}

window.addEventListener('beforeunload', () => {
  activeInstance?.destroy?.();
  activeInstance = null;
});

initPlay();
