(() => {
  'use strict';

  const root = document.getElementById('root');
  if (!root) return;

  let canvas = null;
  let wrapper = null;
  let controls = null;
  let detachCanvasEvents = () => {};
  let lastAim = null;
  const activeKeys = new Map();
  const keyCounts = new Map();
  const activeMousePointers = new Map();

  function keyEvent(type, key) {
    const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
    window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true }));
  }

  function pressKey(pointerId, key, button) {
    if (activeKeys.has(pointerId)) return;
    activeKeys.set(pointerId, key);
    const count = (keyCounts.get(key) || 0) + 1;
    keyCounts.set(key, count);
    if (count === 1) keyEvent('keydown', key);
    button?.classList.add('is-pressed');
  }

  function releaseKey(pointerId, button) {
    const key = activeKeys.get(pointerId);
    if (!key) return;
    activeKeys.delete(pointerId);
    const count = Math.max(0, (keyCounts.get(key) || 1) - 1);
    if (count === 0) {
      keyCounts.delete(key);
      keyEvent('keyup', key);
    } else keyCounts.set(key, count);
    button?.classList.remove('is-pressed');
  }

  function aimPoint() {
    if (lastAim) return lastAim;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.56, y: rect.top + rect.height * 0.52 };
  }

  function mouseEvent(type, button, point) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(rect.left + 1, Math.min(rect.right - 1, point.x));
    const y = Math.max(rect.top + 1, Math.min(rect.bottom - 1, point.y));
    if (type === 'mousedown') {
      canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y, buttons: button === 0 ? 1 : 2 }));
      canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button, buttons: button === 0 ? 1 : 2 }));
    } else {
      window.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button, buttons: 0 }));
    }
  }

  function releaseAll() {
    for (const [pointerId, key] of [...activeKeys.entries()]) {
      const count = Math.max(0, (keyCounts.get(key) || 1) - 1);
      if (count === 0) {
        keyCounts.delete(key);
        keyEvent('keyup', key);
      } else keyCounts.set(key, count);
      activeKeys.delete(pointerId);
    }
    for (const [pointerId, button] of [...activeMousePointers.entries()]) {
      mouseEvent('mouseup', button, aimPoint());
      activeMousePointers.delete(pointerId);
    }
    controls?.querySelectorAll('.is-pressed').forEach((button) => button.classList.remove('is-pressed'));
  }

  function makeControls() {
    const panel = document.createElement('div');
    panel.className = 'voxel-touch-controls';
    panel.setAttribute('aria-label', 'Controles táctiles');
    panel.innerHTML = `
      <div class="voxel-touch-pad" aria-label="Movimiento">
        <button type="button" data-key="a" aria-label="Mover a la izquierda">◀</button>
        <button type="button" data-key="w" aria-label="Saltar">▲<small>SALTAR</small></button>
        <button type="button" data-key="d" aria-label="Mover a la derecha">▶</button>
        <button type="button" data-key="s" aria-label="Bajar en modo creativo">▼</button>
      </div>
      <div class="voxel-touch-actions" aria-label="Acciones">
        <button type="button" data-action="mine" aria-label="Mantener para minar">⛏<small>MINAR</small></button>
        <button type="button" data-action="place" aria-label="Colocar o usar bloque">▰<small>USAR</small></button>
      </div>`;
    wrapper.appendChild(panel);
    return panel;
  }

  function bindControlButtons() {
    controls.querySelectorAll('button').forEach((button) => {
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        try { button.setPointerCapture(event.pointerId); } catch (_) {}
        const key = button.dataset.key;
        const action = button.dataset.action;
        if (key) pressKey(event.pointerId, key, button);
        else if (action === 'mine') {
          const point = aimPoint();
          activeMousePointers.set(event.pointerId, 0);
          mouseEvent('mousedown', 0, point);
          button.classList.add('is-pressed');
        } else if (action === 'place') {
          mouseEvent('mousedown', 2, aimPoint());
          mouseEvent('mouseup', 2, aimPoint());
          button.classList.add('is-pressed');
        }
      });
      const end = (event) => {
        event.preventDefault();
        releaseKey(event.pointerId, button);
        if (activeMousePointers.has(event.pointerId)) {
          const mouseButton = activeMousePointers.get(event.pointerId);
          mouseEvent('mouseup', mouseButton, aimPoint());
          activeMousePointers.delete(event.pointerId);
        }
        button.classList.remove('is-pressed');
      };
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('lostpointercapture', end);
    });
  }

  function attachCanvas(nextCanvas) {
    const onDown = (event) => {
      if (event.pointerType === 'mouse') return;
      event.preventDefault();
      lastAim = { x: event.clientX, y: event.clientY };
      try { nextCanvas.setPointerCapture(event.pointerId); } catch (_) {}
      activeMousePointers.set(event.pointerId, 0);
      mouseEvent('mousedown', 0, lastAim);
    };
    const onMove = (event) => {
      if (!activeMousePointers.has(event.pointerId) || event.pointerType === 'mouse') return;
      event.preventDefault();
      lastAim = { x: event.clientX, y: event.clientY };
      nextCanvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: event.clientX, clientY: event.clientY, buttons: 1 }));
    };
    const onUp = (event) => {
      if (!activeMousePointers.has(event.pointerId) || event.pointerType === 'mouse') return;
      event.preventDefault();
      lastAim = { x: event.clientX, y: event.clientY };
      mouseEvent('mouseup', activeMousePointers.get(event.pointerId), lastAim);
      activeMousePointers.delete(event.pointerId);
    };
    nextCanvas.addEventListener('pointerdown', onDown, { passive: false });
    nextCanvas.addEventListener('pointermove', onMove, { passive: false });
    nextCanvas.addEventListener('pointerup', onUp, { passive: false });
    nextCanvas.addEventListener('pointercancel', onUp, { passive: false });
    detachCanvasEvents = () => {
      nextCanvas.removeEventListener('pointerdown', onDown);
      nextCanvas.removeEventListener('pointermove', onMove);
      nextCanvas.removeEventListener('pointerup', onUp);
      nextCanvas.removeEventListener('pointercancel', onUp);
    };
  }

  function sync() {
    const nextCanvas = root.querySelector('canvas[aria-label="Mundo del juego"]');
    if (nextCanvas !== canvas) {
      releaseAll();
      detachCanvasEvents();
      controls?.remove();
      canvas = nextCanvas;
      wrapper = canvas?.parentElement ?? null;
      controls = null;
      lastAim = null;
      if (canvas && wrapper) {
        controls = makeControls();
        bindControlButtons();
        attachCanvas(canvas);
      }
    }
    if (!canvas || !wrapper || !controls) return;
    const smallOrTouch = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const splash = wrapper.querySelector('.absolute.inset-0.z-20');
    const inventory = wrapper.querySelector('[class*="max-h-[85vh]"][class*="overflow-auto"]');
    controls.style.display = smallOrTouch && !splash && !inventory ? 'flex' : 'none';
  }

  const observer = new MutationObserver(sync);
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('orientationchange', sync, { passive: true });
  window.addEventListener('blur', releaseAll);
  sync();
})();
