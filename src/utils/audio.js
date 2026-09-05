let audioCtx = null;
let muted = false;

function initMuteState() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('minigame_muted');
      if (saved !== null) {
        muted = saved === 'true';
      }
    }
  } catch {
    muted = false;
  }
}

initMuteState();

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('minigame_muted', String(muted));
    }
  } catch {
    // Ignore storage errors
  }
  return muted;
}

export function setMuted(val) {
  muted = Boolean(val);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('minigame_muted', String(muted));
    }
  } catch {
    // Ignore storage errors
  }
}

export function playTone(freq, type = 'square', duration = 0.08, volume = 0.1) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio playback error swallowed gracefully
  }
}

export function playBlip() {
  playTone(520, 'square', 0.05, 0.06);
}

export function playCoin() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(987.77, 'square', 0.08, 0.08); // B5
    setTimeout(() => {
      playTone(1318.51, 'square', 0.18, 0.08); // E6
    }, 80);
  } catch {
    // Ignore
  }
}

export function playJump() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore
  }
}

export function playHit() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore
  }
}

export function playWin() {
  if (muted) return;
  const notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'triangle', 0.2, 0.08);
    }, idx * 100);
  });
}
