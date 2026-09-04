export function createGameNav({ container, games, activeSlug, onSelectGame, onHome }) {
  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-link';
  backBtn.id = 'backHome';
  backBtn.type = 'button';
  backBtn.textContent = '← Home';
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (onHome) onHome();
  });

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

  container.appendChild(backBtn);
  container.appendChild(switchWrap);

  return {
    setSelected(slug) {
      select.value = slug;
    }
  };
}
