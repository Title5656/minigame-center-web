import { isMuted, toggleMute, playBlip } from '../utils/audio.js';

export function createGameNav({ container, games, activeSlug, onSelectGame, onHome }) {
  container.innerHTML = '';

  const leftGroup = document.createElement('div');
  leftGroup.style.display = 'flex';
  leftGroup.style.gap = '0.75rem';
  leftGroup.style.alignItems = 'center';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-link';
  backBtn.id = 'backHome';
  backBtn.type = 'button';
  backBtn.textContent = '← Home';
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (onHome) onHome();
  });

  const soundBtn = document.createElement('button');
  soundBtn.className = 'back-link';
  soundBtn.id = 'toggleAudio';
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-label', 'Toggle audio sound effects');

  function updateSoundText() {
    soundBtn.textContent = isMuted() ? '🔇 Muted' : '🔊 Sound';
  }
  updateSoundText();

  soundBtn.addEventListener('click', () => {
    toggleMute();
    updateSoundText();
    if (!isMuted()) playBlip();
  });

  leftGroup.appendChild(backBtn);
  leftGroup.appendChild(soundBtn);

  const switchWrap = document.createElement('div');
  switchWrap.className = 'switch-wrap';

  const labelSpan = document.createElement('span');
  labelSpan.textContent = 'Switch Game';

  const select = document.createElement('select');
  select.id = 'gameNavSelect';
  select.setAttribute('aria-label', 'Switch game');

  games.forEach((game) => {
    const opt = document.createElement('option');
    opt.value = game.slug;
    opt.textContent = game.name;
    if (game.slug === activeSlug) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    if (onSelectGame) onSelectGame(select.value);
  });

  switchWrap.appendChild(labelSpan);
  switchWrap.appendChild(select);

  container.appendChild(leftGroup);
  container.appendChild(switchWrap);

  return {
    setSelected(slug) {
      select.value = slug;
    }
  };
}
