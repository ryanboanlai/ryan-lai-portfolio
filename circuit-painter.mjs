// @ts-check
import { pointOnTrace } from './circuit-model.mjs';

/** @typedef {import('./circuit-model.mjs').Point} Point */
/** @typedef {import('./circuit-model.mjs').Circuit} Circuit */
/** @typedef {import('./circuit-model.mjs').CircuitNode} CircuitNode */
/** @typedef {readonly [string, string, string]} Palette */

/** @param {CanvasRenderingContext2D} context @param {ReadonlyArray<Point>} points @returns {void} */
function tracePath(context, points) {
  context.beginPath(); context.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) context.lineTo(point.x, point.y);
}

/** @param {CanvasRenderingContext2D} context @param {CircuitNode} node @returns {void} */
function drawComponent(context, node) {
  context.beginPath();
  if (node.kind === 'chip') {
    context.rect(node.x - 15, node.y - 12, 30, 24);
    for (const offset of [-8, 0, 8]) {
      context.moveTo(node.x + offset, node.y - 18); context.lineTo(node.x + offset, node.y - 12);
      context.moveTo(node.x + offset, node.y + 12); context.lineTo(node.x + offset, node.y + 18);
    }
  } else if (node.kind === 'gate') {
    context.moveTo(node.x - 12, node.y - 11); context.lineTo(node.x, node.y - 11);
    context.arc(node.x, node.y, 11, -Math.PI / 2, Math.PI / 2);
    context.lineTo(node.x - 12, node.y + 11); context.closePath();
  } else context.arc(node.x, node.y, 3, 0, Math.PI * 2);
  context.fill(); context.stroke();
}

/** @param {CanvasRenderingContext2D} context @param {Circuit} circuit @param {Palette} palette @returns {void} */
export function paintBoard(context, circuit, palette) {
  context.save(); context.strokeStyle = palette[0]; context.lineWidth = .8; context.globalAlpha = .1;
  for (const trace of circuit.traces) { tracePath(context, trace.points); context.stroke(); }
  context.globalAlpha = .22; context.fillStyle = '#141713';
  for (const node of circuit.nodes) drawComponent(context, node);
  context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {Circuit} circuit @param {Point} pointer @param {Palette} palette @returns {void} */
export function paintProximity(context, circuit, pointer, palette) {
  context.save(); context.strokeStyle = palette[1]; context.lineWidth = 1;
  for (const trace of circuit.traces) {
    const midpoint = pointOnTrace(trace, .5);
    const strength = Math.max(0, 1 - Math.hypot(midpoint.x - pointer.x, midpoint.y - pointer.y) / 170);
    if (!strength) continue;
    context.globalAlpha = strength * .35; tracePath(context, trace.points); context.stroke();
  }
  for (const node of circuit.nodes) {
    const strength = Math.max(0, 1 - Math.hypot(node.x - pointer.x, node.y - pointer.y) / 160);
    if (!strength) continue;
    context.globalAlpha = strength * .85; context.strokeStyle = palette[0]; context.fillStyle = '#141713';
    drawComponent(context, node);
    context.globalAlpha = strength * .1; context.fillStyle = palette[1];
    context.beginPath(); context.arc(node.x, node.y, 10 + strength * 10, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {Circuit} circuit @param {ReadonlyArray<import('./circuit-model.mjs').Signal>} signals @param {number} now @param {Palette} palette @returns {void} */
export function paintSignals(context, circuit, signals, now, palette) {
  context.save(); context.lineCap = 'round';
  for (const signal of signals) {
    if (now < signal.born) continue;
    const trace = circuit.traces.find((candidate) => candidate.id === signal.traceId);
    if (!trace) throw new RangeError(`Signal references missing trace ${signal.traceId}.`);
    const progress = (now - signal.born) / signal.duration;
    const forward = signal.from === trace.from;
    const points = Array.from({ length: 9 }, (_, index) => {
      const position = Math.max(0, progress - .27 + index / 8 * .27);
      return pointOnTrace(trace, forward ? position : 1 - position);
    });
    context.strokeStyle = palette[signal.tone]; tracePath(context, points);
    context.globalAlpha = .1; context.lineWidth = 9; context.stroke();
    context.globalAlpha = .8; context.lineWidth = 1.8; context.stroke();
    const head = points[points.length - 1]; context.fillStyle = palette[signal.tone];
    context.beginPath(); context.arc(head.x, head.y, 2.8, 0, Math.PI * 2); context.fill();
    context.globalAlpha = .7; context.font = '10px monospace';
    context.fillText(signal.tone % 2 ? '1' : '0', head.x + 6, head.y - 7);
    if (progress > .78) {
      const arrival = pointOnTrace(trace, forward ? 1 : 0);
      const ring = (progress - .78) / .22;
      context.globalAlpha = (1 - ring) * .6; context.lineWidth = 1;
      context.beginPath(); context.arc(arrival.x, arrival.y, 5 + ring * 15, 0, Math.PI * 2); context.stroke();
    }
  }
  context.restore();
}
