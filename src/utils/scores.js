const memoryStorage = new Map();

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getBestScore(gameSlug, defaultValue = 0) {
  const key = `minigame_best_${gameSlug}`;
  if (hasLocalStorage()) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null && !isNaN(Number(val))) {
        return Number(val);
      }
    } catch {
      // Fall back to memory
    }
  }
  return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
}

export function saveBestScore(gameSlug, score, isLowerBetter = false) {
  const num = Number(score);
  if (isNaN(num)) return getBestScore(gameSlug, 0);

  const current = getBestScore(gameSlug, isLowerBetter ? Infinity : 0);
  const isBetter = isLowerBetter
    ? current === 0 || current === Infinity || num < current
    : num > current;

  if (isBetter) {
    const key = `minigame_best_${gameSlug}`;
    if (hasLocalStorage()) {
      try {
        window.localStorage.setItem(key, String(num));
      } catch {
        // Fall back to memory
      }
    }
    memoryStorage.set(key, num);
    return num;
  }
  return current;
}
