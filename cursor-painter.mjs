// @ts-check
import { ribbonPoints, TRAIL_LIFE } from './cursor-physics.mjs';

/** @typedef {import('./cursor-physics.mjs').Point} Point */
/** @typedef {Readonly<{stroke: ReadonlyArray<import('./cursor-physics.mjs').TrailPoint>, sparks: ReadonlyArray<import('./cursor-physics.mjs').Spark>, pulses: ReadonlyArray<import('./cursor-physics.mjs').Pulse>, now: number, energy: number}>} Scene */
/** @typedef {readonly [string, string, string]} Palette */

/** @param {CanvasRenderingContext2D} context @param {ReadonlyArray<Point>} points @returns {void} */
function traceCurve(context, points) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  const end = points[points.length - 1];
  context.lineTo(end.x, end.y);
}

/** @param {CanvasRenderingContext2D} context @param {Scene} scene @param {Palette} palette @returns {void} */
function paintRibbons(context, scene, palette) {
  if (scene.stroke.length < 2) return;
  const start = scene.stroke[0];
  const end = scene.stroke[scene.stroke.length - 1];
  const fade = Math.max(0, 1 - (scene.now - end.time) / TRAIL_LIFE);
  const gradient = context.createLinearGradient(start.x, start.y, end.x + .01, end.y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(.45, palette[1]);
  gradient.addColorStop(.8, palette[0]);
  gradient.addColorStop(1, '#f4f8e9');
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = gradient;
  traceCurve(context, scene.stroke);
  context.globalAlpha = .06 * fade;
  context.lineWidth = 22 + scene.energy * 16;
  context.stroke();
  context.globalAlpha = .16 * fade;
  context.lineWidth = 7 + scene.energy * 5;
  context.stroke();
  context.globalAlpha = .8 * fade;
  context.lineWidth = 1.3 + scene.energy * 1.3;
  context.stroke();

  for (let index = 0; index < 2; index += 1) {
    const points = ribbonPoints(scene.stroke, scene.now, 6 + scene.energy * 20, index * Math.PI);
    traceCurve(context, points);
    context.strokeStyle = palette[index + 1];
    context.globalAlpha = (.2 + scene.energy * .22) * fade;
    context.lineWidth = .9 + scene.energy * .6;
    context.stroke();
  }

  const radius = 20 + scene.energy * 20;
  const halo = context.createRadialGradient(end.x, end.y, 0, end.x, end.y, radius);
  halo.addColorStop(0, palette[0]);
  halo.addColorStop(1, 'transparent');
  context.fillStyle = halo;
  context.globalAlpha = .14 * fade;
  context.beginPath();
  context.arc(end.x, end.y, radius, 0, Math.PI * 2);
  context.fill();
}

/** @param {CanvasRenderingContext2D} context @param {Scene} scene @param {Palette} palette @returns {void} */
function paintSparks(context, scene, palette) {
  for (const spark of scene.sparks) {
    const remaining = 1 - (scene.now - spark.born) / spark.life;
    context.strokeStyle = palette[spark.tone];
    context.fillStyle = palette[spark.tone];
    context.globalAlpha = .8 * remaining * remaining;
    context.lineWidth = spark.radius * remaining;
    context.beginPath();
    context.moveTo(spark.px - spark.vx * .022, spark.py - spark.vy * .022);
    context.lineTo(spark.x, spark.y);
    context.stroke();
    context.beginPath();
    context.arc(spark.x, spark.y, spark.radius * (.4 + remaining * .6), 0, Math.PI * 2);
    context.fill();
  }
}

/** @param {CanvasRenderingContext2D} context @param {Scene} scene @param {Palette} palette @returns {void} */
function paintPulses(context, scene, palette) {
  for (const pulse of scene.pulses) {
    const progress = (scene.now - pulse.born) / pulse.life;
    const radius = 8 + (1 - Math.pow(1 - progress, 3)) * 85;
    for (let index = 0; index < 2; index += 1) {
      context.strokeStyle = palette[index];
      context.globalAlpha = Math.pow(1 - progress, 2) * .5;
      context.lineWidth = 1.2 - progress * .8;
      context.beginPath();
      context.arc(pulse.x, pulse.y, radius * (1 - index * .22), 0, Math.PI * 2);
      context.stroke();
    }
  }
}

/** @param {CanvasRenderingContext2D} context @param {Scene} scene @param {Palette} palette @returns {void} */
export function paintCursor(context, scene, palette) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  paintRibbons(context, scene, palette);
  paintSparks(context, scene, palette);
  paintPulses(context, scene, palette);
  context.restore();
}
