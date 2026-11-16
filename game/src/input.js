export function createInput(canvas, onLockChange) {
  const keys = new Set();
  const state = {
    keys,
    locked: false,
    firing: false,
    altFiring: false,
    lookX: 0,
    lookY: 0,
    pressed: {},
    wheel: 0,
  };

  function setKey(event, down) {
    if (down) {
      keys.add(event.code);
      state.pressed[event.code] = true;
    } else {
      keys.delete(event.code);
    }
    if (['Space', 'KeyB', 'KeyR', 'KeyE', 'Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(event.code)) {
      event.preventDefault();
    }
  }

  window.addEventListener('keydown', (event) => setKey(event, true));
  window.addEventListener('keyup', (event) => setKey(event, false));
  window.addEventListener('blur', () => {
    keys.clear();
    state.firing = false;
  });

  window.addEventListener('mousemove', (event) => {
    if (!state.locked) return;
    state.lookX += event.movementX;
    state.lookY += event.movementY;
  });

  window.addEventListener('mousedown', (event) => {
    if (!state.locked) return;
    if (event.button === 0) state.firing = true;
    if (event.button === 2) state.altFiring = true;
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) state.firing = false;
    if (event.button === 2) state.altFiring = false;
  });

  window.addEventListener('wheel', (event) => {
    if (!state.locked) return;
    state.wheel += Math.sign(event.deltaY);
  }, { passive: true });

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    if (!state.locked) {
      keys.clear();
      state.firing = false;
      state.altFiring = false;
    }
    onLockChange(state.locked);
  });

  return {
    state,
    requestLock() {
      canvas.requestPointerLock();
    },
    takeLook() {
      const x = state.lookX;
      const y = state.lookY;
      state.lookX = 0;
      state.lookY = 0;
      return { x, y };
    },
    takeWheel() {
      const w = state.wheel;
      state.wheel = 0;
      return w;
    },
    consumePressed(code) {
      if (state.pressed[code]) {
        state.pressed[code] = false;
        return true;
      }
      return false;
    },
  };
}
