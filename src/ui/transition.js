export function createBlockTransition(element) {
  const el = element || document.getElementById('blockTransition');
  const blockRows = 8;
  const blockCols = 12;
  let pixelBusy = false;

  function build() {
    if (!el) return;
    el.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let r = 0; r < blockRows; r++) {
      for (let c = 0; c < blockCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'block-cell';
        const delay = (blockRows - 1 - r) * 0.004 + c * 0.012;
        cell.style.setProperty('--delay', `${delay.toFixed(3)}s`);
        cell.style.setProperty('--hue', `${(c * 22 + r * 13) % 360}`);
        frag.appendChild(cell);
      }
    }
    el.appendChild(frag);
  }

  build();

  return {
    run(onMid) {
      if (!el || pixelBusy) {
        if (onMid) onMid();
        return;
      }
      pixelBusy = true;
      el.classList.remove('is-exit');
      el.classList.add('is-active');
      const midDuration = 550 + ((blockCols - 1) * 0.012 + (blockRows - 1) * 0.004) * 1000;
      setTimeout(() => {
        if (onMid) onMid();
        el.classList.remove('is-active');
        el.classList.add('is-exit');
        setTimeout(() => {
          el.classList.remove('is-exit');
          pixelBusy = false;
        }, 400);
      }, midDuration);
    }
  };
}
