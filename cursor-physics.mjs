// @ts-check
/** @typedef {Readonly<{x: number, y: number}>} Point */
/** @typedef {Readonly<{x: number, y: number, time: number}>} TrailPoint */
/** @typedef {Readonly<{x: number, y: number, vx: number, vy: number, born: number, life: number, radius: number}>} Spark */

export const MAX_SPARKS = 96;
export const MAX_TRAIL_POINTS = 48;
export const TRAIL_LIFE = 650;

/** @param {Point} point @param {number} time @returns {Spark} */
export function createHoverSpark(point, time) {
  return { x: point.x, y: point.y, vx: 0, vy: -5, born: time, life: 400, radius: 1.1 };
}

/** @param {Point} point @param {Point} velocity @param {number} time @param {number} phase @returns {ReadonlyArray<Spark>} */
export function createDragSparks(point, velocity, time, phase) {
  return [0, 1, 2].map((index) => {
    const angle = phase * 2.399963 + index * 2.094395;
    const spread = 22 + index * 15;
    return {
      x: point.x, y: point.y,
      vx: Math.max(-150, Math.min(150, velocity.x * .1)) + Math.cos(angle) * spread,
      vy: Math.max(-150, Math.min(150, velocity.y * .1)) + Math.sin(angle) * spread,
      born: time, life: 650 + index * 140, radius: 1.3 + index * .35,
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
  const drag = Math.exp(-1.8 * seconds);
  return sparks.filter((spark) => now - spark.born < spark.life).map((spark) => ({
    ...spark, x: spark.x + spark.vx * seconds, y: spark.y + spark.vy * seconds,
    vx: spark.vx * drag, vy: spark.vy * drag + 9 * seconds,
  }));
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
