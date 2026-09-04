export function createGameCard(game, onNavigate) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `play.html?game=${encodeURIComponent(game.slug)}`;

  const name = document.createElement('span');
  name.className = 'gc-name';
  name.textContent = game.name;

  const desc = document.createElement('span');
  desc.className = 'gc-desc';
  desc.textContent = game.description;

  card.appendChild(name);
  card.appendChild(desc);

  if (onNavigate) {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate(card.href);
    });
  }

  return card;
}
