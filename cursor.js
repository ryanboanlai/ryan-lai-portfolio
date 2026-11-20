// @ts-check
import { appendSparks, advanceSparks, advanceStroke, createDragSparks, createHoverSpark, sampleStroke, TRAIL_LIFE } from './cursor-physics.mjs';

/** @typedef {import('./cursor-physics.mjs').Point} Point */
/** @typedef {import('./cursor-physics.mjs').Spark} Spark */
/** @typedef {import('./cursor-physics.mjs').TrailPoint} TrailPoint */

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

  /** @type {ReadonlyArray<Spark>} */
  let sparks = [];
  /** @type {ReadonlyArray<TrailPoint>} */
  let stroke = [];
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

  /** @returns {void} */
  function clearTrail() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    sparks = [];
    stroke = [];
    previous = null;
    dragging = false;
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
  function drawStroke(now) {
    if (stroke.length < 2) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
    context.globalAlpha = .07 * (1 - (now - stroke[stroke.length - 1].time) / TRAIL_LIFE);
    context.lineWidth = 10;
    context.stroke();
    context.lineWidth = 1.4;
    for (let index = 1; index < stroke.length; index += 1) {
      const point = stroke[index];
      const before = stroke[index - 1];
      context.globalAlpha = .5 * Math.pow(1 - (now - point.time) / TRAIL_LIFE, 2);
      context.beginPath();
      context.moveTo(before.x, before.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }
  }

  /** @param {number} now @returns {void} */
  function drawSparks(now) {
    context.fillStyle = color;
    context.strokeStyle = color;
    for (const spark of sparks) {
      const remaining = 1 - (now - spark.born) / spark.life;
      context.globalAlpha = .65 * remaining * remaining;
      context.beginPath();
      context.arc(spark.x, spark.y, spark.radius * (.5 + remaining * .5), 0, Math.PI * 2);
      context.fill();
    }
    const recent = sparks.slice(-12);
    context.lineWidth = .7;
    for (let index = 0; index < recent.length; index += 1) {
      for (const other of recent.slice(index + 1)) {
        const point = recent[index];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance > 48) continue;
        context.globalAlpha = .13 * (1 - distance / 48) * (1 - (now - point.born) / point.life);
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }
  }

  /** @param {number} now @returns {void} */
  function render(now) {
    frame = 0;
    if (!enabled) return;
    sparks = advanceSparks(sparks, now, lastFrame ? now - lastFrame : 16);
    stroke = advanceStroke(stroke, [], now);
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    drawStroke(now);
    drawSparks(now);
    context.globalAlpha = 1;
    if (sparks.length || stroke.length) frame = requestAnimationFrame(render);
    else lastFrame = 0;
  }

  /** @param {PointerEvent} event @returns {void} */
  function movePointer(event) {
    if (!enabled || event.pointerType !== 'mouse') return;
    if (document.querySelector('dialog[open]')) return;
    const now = performance.now();
    if (now - lastInput < 16) return;
    const point = { x: event.clientX, y: event.clientY };
    const before = previous ?? point;
    const elapsed = Math.max(16, now - lastInput) / 1000;
    if (dragging) {
      const samples = sampleStroke(before, point, now);
      const velocity = { x: (point.x - before.x) / elapsed, y: (point.y - before.y) / elapsed };
      stroke = advanceStroke(stroke, samples, now);
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
    stroke = [];
    previous = { x: event.clientX, y: event.clientY };
    lastInput = performance.now();
  }

  /** @returns {void} */
  function endDrag() {
    dragging = false;
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
