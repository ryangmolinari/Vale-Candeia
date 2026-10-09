// Teclado e mouse.

export const Input = {
  down: new Set<string>(),
  pressed: new Set<string>(),
  released: new Set<string>(),
  mx: 0, my: 0, mInside: false,
  mDown: [false, false, false],
  mPressed: [false, false, false],
  mReleased: [false, false, false],
  wheel: 0,
  blocked: false, // UI DOM capturou o input
  init(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', e => {
      const k = normKey(e);
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return;
      if (['Tab', 'Space', ' ', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.code === 'Space' || e.key === 'Tab') e.preventDefault();
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
    });
    window.addEventListener('keyup', e => { const k = normKey(e); this.down.delete(k); this.released.add(k); });
    window.addEventListener('blur', () => { this.down.clear(); this.mDown = [false, false, false]; });
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.mx = e.clientX - r.left; this.my = e.clientY - r.top; this.mInside = true; });
    canvas.addEventListener('mouseleave', () => { this.mInside = false; });
    canvas.addEventListener('mousedown', e => { this.mDown[e.button] = true; this.mPressed[e.button] = true; e.preventDefault(); });
    window.addEventListener('mouseup', e => { if (this.mDown[e.button]) this.mReleased[e.button] = true; this.mDown[e.button] = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  },
  endFrame() {
    this.pressed.clear(); this.released.clear();
    this.mPressed = [false, false, false]; this.mReleased = [false, false, false]; this.wheel = 0;
  },
  isDown(...keys: string[]) { return keys.some(k => this.down.has(k)); },
  isPressed(...keys: string[]) { return keys.some(k => this.pressed.has(k)); },
  clear() { this.down.clear(); this.pressed.clear(); this.mDown = [false, false, false]; this.mPressed = [false, false, false]; },
};

function normKey(e: KeyboardEvent) {
  if (e.code === 'Space') return 'space';
  if (e.code.startsWith('Digit')) return e.code.slice(5);
  if (e.code === 'Minus') return '-';
  if (e.code === 'Equal') return '=';
  if (e.code.startsWith('Key')) return e.code.slice(3).toLowerCase();
  return e.key.toLowerCase();
}
