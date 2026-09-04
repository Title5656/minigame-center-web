export function getGameColors() {
  const rootStyles = typeof getComputedStyle === 'function' && typeof document !== 'undefined' && document.documentElement
    ? getComputedStyle(document.documentElement)
    : null;

  const getProp = (prop, fallback) =>
    rootStyles?.getPropertyValue?.(prop)?.trim() || fallback;

  return {
    bg: getProp('--game-bg', '#10081f'),
    text: getProp('--game-text', '#f7f5ff'),
    gold: getProp('--game-gold', '#ffcf4a'),
    cyan: getProp('--game-cyan', '#4be8ff'),
    pink: getProp('--game-pink', '#ff4edb'),
    goldDim: getProp('--game-gold-dim', 'rgba(255,207,74,0.3)'),
    cyanDim: getProp('--game-cyan-dim', 'rgba(75,232,255,0.3)'),
    pinkDim: getProp('--game-pink-dim', 'rgba(255,78,219,0.3)')
  };
}
