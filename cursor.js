// @ts-check
import { createCircuit, nearestNode, branchSignals, appendSignals, advanceSignals } from './circuit-model.mjs';
import { paintBoard, paintProximity, paintSignals } from './circuit-painter.mjs';

/** @returns {void} */
function mountCircuit() {
  const canvas = document.getElementById('cursor-trail');
  const hint = document.getElementById('cursor-hint');
  if (!(canvas instanceof HTMLCanvasElement) || !(hint instanceof HTMLParagraphElement)) throw new TypeError('The circuit background requires the cursor-trail canvas and cursor-hint paragraph.');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The circuit background could not create its Canvas 2D context.');
  const board = document.createElement('canvas');
  const boardContext = board.getContext('2d');
  if (!boardContext) throw new Error('The circuit background could not create its static drawing context.');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(any-pointer: fine)');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  if (!accent) throw new Error('The circuit background requires the --accent theme color.');
  /** @type {import('./circuit-painter.mjs').Palette} */
  const palette = [accent, '#80d8cf', '#e5c484'];
  /** @type {import('./circuit-model.mjs').Circuit} */
  let circuit = createCircuit(window.innerWidth, window.innerHeight);
  /** @type {ReadonlyArray<import('./circuit-model.mjs').Signal>} */
  let signals = [];
  /** @type {import('./circuit-model.mjs').Point | null} */
  let pointer = null;
  let interactive = false;
  let dragging = false;
  let frame = 0;
  let width = 0;
  let height = 0;
  let lastNode = -1;
  let lastEmission = 0;

  /** @returns {void} */
  function drawStaticBoard() {
    context.clearRect(0, 0, width, height);
    context.drawImage(board, 0, 0, width, height);
  }

  /** @returns {void} */
  function clearInteraction() {
    cancelAnimationFrame(frame);
    frame = 0;
    signals = [];
    pointer = null;
    dragging = false;
    lastNode = -1;
    lastEmission = 0;
    drawStaticBoard();
  }

  /** @returns {void} */
  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    board.width = canvas.width;
    board.height = canvas.height;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    boardContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    circuit = createCircuit(width, height);
    paintBoard(boardContext, circuit, palette);
    clearInteraction();
  }

  /** @returns {void} */
  function updateAvailability() {
    interactive = !reducedMotion.matches && finePointer.matches && !document.hidden;
    canvas.hidden = document.hidden;
    hint.hidden = !interactive;
    resizeCanvas();
  }

  /** @param {number} now @returns {void} */
  function render(now) {
    frame = 0;
    if (!interactive) return;
    signals = advanceSignals(signals, now);
    drawStaticBoard();
    if (pointer) paintProximity(context, circuit, pointer, palette);
    paintSignals(context, circuit, signals, now, palette);
    if (signals.length) frame = requestAnimationFrame(render);
  }

  /** @returns {void} */
  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  /** @param {import('./circuit-model.mjs').Point} point @param {number} now @returns {void} */
  function sendFrom(point, now) {
    const node = nearestNode(circuit, point);
    signals = appendSignals(signals, branchSignals(circuit, node.id, now));
    lastNode = node.id;
    lastEmission = now;
    requestRender();
  }

  /** @param {PointerEvent} event @returns {void} */
  function movePointer(event) {
    if (!interactive || event.pointerType !== 'mouse') return;
    if (document.querySelector('dialog[open]')) { clearInteraction(); return; }
    pointer = { x: event.clientX, y: event.clientY };
    const now = performance.now();
    if (dragging && now - lastEmission > 120 && nearestNode(circuit, pointer).id !== lastNode) sendFrom(pointer, now);
    requestRender();
  }

  /** @param {PointerEvent} event @returns {void} */
  function beginDrag(event) {
    if (!interactive || event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea, [contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    dragging = true;
    pointer = { x: event.clientX, y: event.clientY };
    sendFrom(pointer, performance.now());
  }

  /** @param {PointerEvent} event @returns {void} */
  function endDrag(event) {
    if (event.pointerType !== 'mouse') return;
    if (interactive && dragging) sendFrom({ x: event.clientX, y: event.clientY }, performance.now());
    dragging = false;
  }

  document.addEventListener('pointermove', movePointer, { passive: true });
  document.addEventListener('pointerdown', beginDrag, { passive: true });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', clearInteraction, { passive: true });
  window.addEventListener('blur', clearInteraction);
  document.documentElement.addEventListener('pointerleave', clearInteraction);
  document.addEventListener('scroll', clearInteraction, { passive: true });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearInteraction(); });
  document.addEventListener('visibilitychange', updateAvailability);
  window.addEventListener('resize', resizeCanvas, { passive: true });
  reducedMotion.addEventListener('change', updateAvailability);
  finePointer.addEventListener('change', updateAvailability);
  updateAvailability();
}

mountCircuit();
