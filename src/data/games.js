export const games = [
  {
    slug: 'breakout',
    name: 'Breakout',
    description: 'Bounce the ball, clear all bricks.',
    controls: '← → / A D'
  },
  {
    slug: 'snake',
    name: 'Snake',
    description: 'Grow by eating food, avoid walls.',
    controls: 'Arrow keys'
  },
  {
    slug: 'memory',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs.',
    controls: 'Click cards'
  },
  {
    slug: 'runner',
    name: 'Pixel Runner',
    description: 'Jump the obstacles, keep running.',
    controls: 'Space to jump'
  },
  {
    slug: 'dodge',
    name: 'Astro Dodge',
    description: 'Dodge incoming asteroids.',
    controls: '← → / A D'
  },
  {
    slug: 'tower',
    name: 'Tower Drop',
    description: 'Stack the blocks neatly.',
    controls: 'Drop button or Space'
  },
  {
    slug: 'hex',
    name: 'Hex Slide',
    description: 'Slide tiles to solve the puzzle.',
    controls: 'Arrow keys or taps'
  },
  {
    slug: 'orbit',
    name: 'Orbit Tap',
    description: 'Tap the orb before time runs out.',
    controls: 'Click the orb'
  },
  {
    slug: 'trail',
    name: 'Light Trails',
    description: 'Repeat the light sequence.',
    controls: 'Repeat the sequence'
  }
];

export function getGame(slug) {
  return games.find((g) => g.slug === slug) || null;
}

export function isValidGame(slug) {
  return games.some((g) => g.slug === slug);
}
