// @ts-check
/** @typedef {Readonly<{x: number, y: number}>} Point */
/** @typedef {Readonly<{x: number, y: number, time: number}>} TrailPoint */
/** @typedef {Readonly<{x: number, y: number, px: number, py: number, vx: number, vy: number, born: number, life: number, radius: number, spin: number, tone: number}>} Spark */
/** @typedef {Readonly<{x: number, y: number, born: number, life: number}>} Pulse */

export const MAX_SPARKS = 96;
export const MAX_TRAIL_POINTS = 64;
export const TRAIL_LIFE = 850;
export const MAX_PULSES = 3;

/** @param {Point} point @param {number} time @returns {Spark} */
export function createHoverSpark(point, time) {
  return { x: point.x, y: point.y, px: point.x, py: point.y, vx: Math.sin(time * .02) * 18, vy: -12, born: time, life: 650, radius: 1.4, spin: 1.6, tone: Math.floor(time / 90) % 3 };
}

/** @param {Point} point @param {Point} velocity @param {number} time @param {number} phase @returns {ReadonlyArray<Spark>} */
export function createDragSparks(point, velocity, time, phase) {
  return [0, 1, 2].map((index) => {
    const angle = phase * 2.399963 + index * 2.094395;
    const spread = 22 + index * 15;
    return {
      x: point.x, y: point.y, px: point.x, py: point.y,
      vx: Math.max(-170, Math.min(170, velocity.x * .16)) + Math.cos(angle) * spread,
      vy: Math.max(-170, Math.min(170, velocity.y * .16)) + Math.sin(angle) * spread,
      born: time, life: 700 + index * 160, radius: 1.5 + index * .45,
      spin: index % 2 ? -2.2 : 2.2, tone: index,
    };
  });
}

/** @param {ReadonlyArray<Spark>} sparks @param {ReadonlyArray<Spark>} incoming @returns {ReadonlyArray<Spark>} */
export function appendSparks(sparks, incoming) {
  return [...sparks, ...incoming].slice(-MAX_SPARKS);
}

/** @param {ReadonlyArray<Spark>} sparks @param {number} now @param {number} elapsed @returns {ReadonlyArray<Spark>} */
export function advanceSparks(sparks, now, elapsed) {
  const seconds = Math.min(32, Math.max(0, elapsed)) / 1000;
  const drag = Math.exp(-1.3 * seconds);
  return sparks.filter((spark) => now - spark.born < spark.life).map((spark) => {
    const angle = spark.spin * seconds;
    return {
      ...spark, px: spark.x, py: spark.y,
      x: spark.x + spark.vx * seconds, y: spark.y + spark.vy * seconds,
      vx: (spark.vx * Math.cos(angle) - spark.vy * Math.sin(angle)) * drag,
      vy: (spark.vx * Math.sin(angle) + spark.vy * Math.cos(angle)) * drag,
    };
  });
}

/** @param {Point} point @param {number} time @returns {ReadonlyArray<Spark>} */
export function createReleaseSparks(point, time) {
  return Array.from({ length: 18 }, (_, index) => {
    const angle = index * Math.PI * 2 / 18;
    const speed = 70 + index % 3 * 42;
    return {
      x: point.x, y: point.y, px: point.x, py: point.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      born: time, life: 850 + index % 3 * 140, radius: 1.5 + index % 3 * .4,
      spin: index % 2 ? -1.8 : 1.8, tone: index % 3,
    };
  });
}

/** @param {ReadonlyArray<Pulse>} pulses @param {Point} point @param {number} time @returns {ReadonlyArray<Pulse>} */
export function appendPulse(pulses, point, time) {
  return [...pulses, { x: point.x, y: point.y, born: time, life: 800 }].slice(-MAX_PULSES);
}

/** @param {ReadonlyArray<Pulse>} pulses @param {number} now @returns {ReadonlyArray<Pulse>} */
export function advancePulses(pulses, now) {
  return pulses.filter((pulse) => now - pulse.born < pulse.life);
}

/** @param {ReadonlyArray<TrailPoint>} points @param {number} now @param {number} amplitude @param {number} phase @returns {ReadonlyArray<Point>} */
export function ribbonPoints(points, now, amplitude, phase) {
  return points.map((point, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy);
    if (!length) return { x: point.x, y: point.y };
    const envelope = Math.sin(index / (points.length - 1) * Math.PI);
    const age = Math.max(0, 1 - (now - point.time) / TRAIL_LIFE);
    const offset = Math.sin(index * .38 - now * .006 + phase) * amplitude * envelope * age;
    return { x: point.x - dy / length * offset, y: point.y + dx / length * offset };
  });
}

/** @param {Point} previous @param {Point} next @param {number} time @returns {ReadonlyArray<TrailPoint>} */
export function sampleStroke(previous, next, time) {
  const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
  const count = Math.min(12, Math.max(1, Math.ceil(distance / 12)));
  return Array.from({ length: count }, (_, index) => {
    const fraction = (index + 1) / count;
    return { x: previous.x + (next.x - previous.x) * fraction, y: previous.y + (next.y - previous.y) * fraction, time };
  });
}

/** @param {ReadonlyArray<TrailPoint>} points @param {ReadonlyArray<TrailPoint>} incoming @param {number} now @returns {ReadonlyArray<TrailPoint>} */
export function advanceStroke(points, incoming, now) {
  return [...points, ...incoming].filter((point) => now - point.time < TRAIL_LIFE).slice(-MAX_TRAIL_POINTS);
}
