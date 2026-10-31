// Teclado + mouse no desktop; dois joysticks virtuais no celular.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
    this.dashQueued = false;
    this.autoFire = false;
    this.touch = { move: null, aim: null };
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    this.onKey = null;

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'shift') { this.dashQueued = true; e.preventDefault(); }
      if (k === 'f' && !e.repeat) this.autoFire = !this.autoFire;
      this.keys.add(k);
      this.onKey?.(k, e);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; if (e.button === 2) this.dashQueued = true; });
    addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const stick = (t) => ({ id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY });
    canvas.addEventListener('touchstart', (e) => {
      this.isTouch = true;
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth / 2 && !this.touch.move) this.touch.move = stick(t);
        else if (t.clientX >= innerWidth / 2 && !this.touch.aim) this.touch.aim = stick(t);
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        for (const s of [this.touch.move, this.touch.aim]) if (s && s.id === t.identifier) { s.x = t.clientX; s.y = t.clientY; }
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (this.touch.move?.id === t.identifier) this.touch.move = null;
        if (this.touch.aim?.id === t.identifier) this.touch.aim = null;
      }
    };
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
  }

  // `playerScreen` = posição do jogador na tela (para mirar com o mouse).
  read(playerScreen, currentAngle) {
    let mx = 0, my = 0, angle = currentAngle, shoot = false;
    const k = this.keys;
    if (k.has('w') || k.has('arrowup')) my -= 1;
    if (k.has('s') || k.has('arrowdown')) my += 1;
    if (k.has('a') || k.has('arrowleft')) mx -= 1;
    if (k.has('d') || k.has('arrowright')) mx += 1;

    if (this.isTouch && (this.touch.move || this.touch.aim)) {
      const m = this.touch.move;
      if (m) {
        const dx = m.x - m.ox, dy = m.y - m.oy, d = Math.hypot(dx, dy);
        if (d > 8) { const s = Math.min(1, d / 60); mx = (dx / d) * s; my = (dy / d) * s; }
      }
      const a = this.touch.aim;
      if (a) {
        const dx = a.x - a.ox, dy = a.y - a.oy;
        if (Math.hypot(dx, dy) > 10) angle = Math.atan2(dy, dx);
        shoot = true;
      }
    } else {
      angle = Math.atan2(this.mouse.y - playerScreen.y, this.mouse.x - playerScreen.x);
      shoot = this.mouse.down || this.autoFire;
    }
    const dash = this.dashQueued;
    this.dashQueued = false;
    return { mx, my, angle, shoot, dash };
  }
}
