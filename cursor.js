// @ts-check
import { appendSparks, advanceSparks, advanceStroke, createDragSparks, createHoverSpark, sampleStroke, appendPulse, advancePulses, createReleaseSparks } from './cursor-physics.mjs';
import { paintCursor } from './cursor-painter.mjs';

/** @typedef {import('./cursor-physics.mjs').Point} Point */
/** @typedef {import('./cursor-physics.mjs').Spark} Spark */
/** @typedef {import('./cursor-physics.mjs').TrailPoint} TrailPoint */
/** @typedef {import('./cursor-physics.mjs').Pulse} Pulse */

/** @returns {void} */
function mountCursorTrail() {
  const canvas = document.getElementById('cursor-trail');
  const hint = document.getElementById('cursor-hint');
  if (!(canvas instanceof HTMLCanvasElement) || !(hint instanceof HTMLParagraphElement)) {
    throw new TypeError('Cursor trail requires the cursor-trail canvas and cursor-hint paragraph.');
  }
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The cursor trail could not create a Canvas 2D context.');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(any-pointer: fine)');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  if (!color) throw new Error('The cursor trail requires the --accent theme color.');
  /** @type {import('./cursor-painter.mjs').Palette} */
  const palette = [color, '#80d8cf', '#e5c484'];

  /** @type {ReadonlyArray<Spark>} */
  let sparks = [];
  /** @type {ReadonlyArray<TrailPoint>} */
  let stroke = [];
  /** @type {ReadonlyArray<Pulse>} */
  let pulses = [];
  /** @type {Point | null} */
  let previous = null;
  let dragging = false;
  let enabled = false;
  let frame = 0;
  let lastFrame = 0;
  let lastInput = 0;
  let phase = 0;
  let width = 0;
  let height = 0;
  let energy = 0;
  let dragDistance = 0;

  /** @returns {void} */
  function clearTrail() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    sparks = [];
    stroke = [];
    pulses = [];
    previous = null;
    dragging = false;
    energy = 0;
    dragDistance = 0;
    lastInput = 0;
    context.clearRect(0, 0, width, height);
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
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    clearTrail();
  }

  /** @returns {void} */
  function updateAvailability() {
    enabled = !reducedMotion.matches && finePointer.matches && !document.hidden;
    canvas.hidden = !enabled;
    hint.hidden = !enabled;
    if (enabled) resizeCanvas();
    else clearTrail();
  }

  /** @param {number} now @returns {void} */
  function render(now) {
    frame = 0;
    if (!enabled) return;
    const elapsed = lastFrame ? now - lastFrame : 16;
    sparks = advanceSparks(sparks, now, elapsed);
    stroke = advanceStroke(stroke, [], now);
    pulses = advancePulses(pulses, now);
    energy += ((dragging ? 1 : 0) - energy) * (1 - Math.exp(-Math.min(elapsed, 32) / 90));
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    paintCursor(context, { stroke, sparks, pulses, now, energy }, palette);
    if (sparks.length || stroke.length || pulses.length) frame = requestAnimationFrame(render);
    else lastFrame = 0;
  }

  /** @param {PointerEvent} event @returns {void} */
  function movePointer(event) {
    if (!enabled || event.pointerType !== 'mouse') return;
    if (document.querySelector('dialog[open]')) { clearTrail(); return; }
    const now = performance.now();
    if (now - lastInput < 16) return;
    const point = { x: event.clientX, y: event.clientY };
    const before = now - lastInput > 100 ? point : previous ?? point;
    const elapsed = Math.max(16, now - lastInput) / 1000;
    const samples = sampleStroke(before, point, now);
    stroke = advanceStroke(stroke, samples, now);
    if (dragging) {
      dragDistance += Math.hypot(point.x - before.x, point.y - before.y);
      const velocity = { x: (point.x - before.x) / elapsed, y: (point.y - before.y) / elapsed };
      for (const sample of samples) {
        sparks = appendSparks(sparks, createDragSparks(sample, velocity, now, phase));
        phase += 1;
      }
    } else {
      sparks = appendSparks(sparks, [createHoverSpark(point, now)]);
    }
    previous = point;
    lastInput = now;
    if (!frame) frame = requestAnimationFrame(render);
  }

  /** @param {PointerEvent} event @returns {void} */
  function beginDrag(event) {
    if (!enabled || event.pointerType !== 'mouse' || event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea, [contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    dragging = true;
    dragDistance = 0;
    stroke = [];
    previous = { x: event.clientX, y: event.clientY };
    lastInput = performance.now();
  }

  /** @param {PointerEvent} event @returns {void} */
  function endDrag(event) {
    if (event.pointerType !== 'mouse') return;
    if (enabled && dragging && dragDistance > 16) {
      const point = { x: event.clientX, y: event.clientY };
      const now = performance.now();
      sparks = appendSparks(sparks, createReleaseSparks(point, now));
      pulses = appendPulse(pulses, point, now);
      if (!frame) frame = requestAnimationFrame(render);
    }
    dragging = false;
    dragDistance = 0;
    previous = null;
  }

  document.addEventListener('pointermove', movePointer, { passive: true });
  document.addEventListener('pointerdown', beginDrag, { passive: true });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', clearTrail, { passive: true });
  window.addEventListener('blur', clearTrail);
  document.documentElement.addEventListener('pointerleave', clearTrail);
  document.addEventListener('visibilitychange', updateAvailability);
  document.addEventListener('scroll', clearTrail, { passive: true });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearTrail(); });
  window.addEventListener('resize', () => { if (enabled) resizeCanvas(); }, { passive: true });
  reducedMotion.addEventListener('change', updateAvailability);
  finePointer.addEventListener('change', updateAvailability);
  updateAvailability();
}

mountCursorTrail();
