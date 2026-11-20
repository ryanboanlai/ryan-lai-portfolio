// @ts-check
/** @typedef {Readonly<{x: number, y: number}>} Point */
/** @typedef {Readonly<{id: number, x: number, y: number, kind: 'via' | 'chip' | 'gate'}>} CircuitNode */
/** @typedef {Readonly<{id: number, from: number, to: number, points: ReadonlyArray<Point>, length: number}>} Trace */
/** @typedef {Readonly<{nodes: ReadonlyArray<CircuitNode>, traces: ReadonlyArray<Trace>}>} Circuit */
/** @typedef {Readonly<{traceId: number, from: number, born: number, duration: number, tone: number}>} Signal */

export const MAX_SIGNALS = 96;

/** @param {CircuitNode} from @param {CircuitNode} to @param {number} id @returns {Trace} */
function connectNodes(from, to, id) {
  const horizontal = from.y === to.y;
  const points = horizontal
    ? [from, { x: from.x + 26, y: from.y }, { x: from.x + 42, y: from.y + 16 }, { x: to.x - 16, y: from.y + 16 }, to]
    : [from, { x: from.x, y: from.y + 26 }, { x: from.x - 16, y: from.y + 42 }, { x: from.x - 16, y: to.y - 16 }, to];
  const length = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
  return { id, from: from.id, to: to.id, points, length };
}

/** @param {number} width @param {number} height @returns {Circuit} */
export function createCircuit(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new RangeError('Circuit dimensions must be finite, positive pixel values.');
  const spacing = Math.max(108, Math.ceil(Math.sqrt(width * height / 180) / 8) * 8);
  const columns = Math.min(24, Math.max(2, Math.ceil(width / spacing)));
  const rows = Math.min(16, Math.max(2, Math.ceil(height / spacing)));
  /** @type {ReadonlyArray<CircuitNode>} */
  const nodes = Array.from({ length: columns * rows }, (_, id) => {
    const row = Math.floor(id / columns);
    const column = id % columns;
    const code = row * 7 + column * 11;
    return { id, x: 32 + column * spacing, y: 38 + row * spacing, kind: code % 23 === 0 ? 'chip' : code % 13 === 0 ? 'gate' : 'via' };
  });
  const traces = nodes.flatMap((node) => {
    const column = node.id % columns;
    const row = Math.floor(node.id / columns);
    const destinations = [
      ...(column < columns - 1 ? [nodes[node.id + 1]] : []),
      ...(row < rows - 1 && (column + row) % 3 !== 1 ? [nodes[node.id + columns]] : []),
    ];
    return destinations.map((destination, index) => connectNodes(node, destination, node.id * 2 + index));
  });
  return { nodes, traces };
}

/** @param {Circuit} circuit @param {Point} point @returns {CircuitNode} */
export function nearestNode(circuit, point) {
  if (!circuit.nodes.length) throw new RangeError('Cannot locate a node in an empty circuit.');
  return circuit.nodes.reduce((nearest, node) => Math.hypot(node.x - point.x, node.y - point.y) < Math.hypot(nearest.x - point.x, nearest.y - point.y) ? node : nearest);
}

/** @param {Trace} trace @param {number} progress @returns {Point} */
export function pointOnTrace(trace, progress) {
  let remaining = Math.max(0, Math.min(1, progress)) * trace.length;
  for (let index = 1; index < trace.points.length; index += 1) {
    const before = trace.points[index - 1];
    const after = trace.points[index];
    const length = Math.hypot(after.x - before.x, after.y - before.y);
    if (remaining <= length) {
      const ratio = remaining / length;
      return { x: before.x + (after.x - before.x) * ratio, y: before.y + (after.y - before.y) * ratio };
    }
    remaining -= length;
  }
  return trace.points[trace.points.length - 1];
}

/** @param {Circuit} circuit @param {number} nodeId @param {number} now @returns {ReadonlyArray<Signal>} */
export function branchSignals(circuit, nodeId, now) {
  if (!circuit.nodes.some((node) => node.id === nodeId)) throw new RangeError(`Circuit node ${nodeId} does not exist.`);
  const visited = new Set([nodeId]);
  const queue = [{ id: nodeId, arrival: now, depth: 0 }];
  /** @type {Signal[]} */
  const signals = [];
  for (let index = 0; index < queue.length && signals.length < 18; index += 1) {
    const current = queue[index];
    if (current.depth === 3) continue;
    for (const trace of circuit.traces.filter((candidate) => candidate.from === current.id || candidate.to === current.id)) {
      const next = trace.from === current.id ? trace.to : trace.from;
      if (visited.has(next)) continue;
      visited.add(next);
      const duration = trace.length / .4;
      signals.push({ traceId: trace.id, from: current.id, born: current.arrival, duration, tone: current.depth % 3 });
      queue.push({ id: next, arrival: current.arrival + duration, depth: current.depth + 1 });
      if (signals.length === 18) break;
    }
  }
  return signals;
}

/** @param {ReadonlyArray<Signal>} signals @param {ReadonlyArray<Signal>} incoming @returns {ReadonlyArray<Signal>} */
export function appendSignals(signals, incoming) {
  return [...signals, ...incoming].slice(-MAX_SIGNALS);
}

/** @param {ReadonlyArray<Signal>} signals @param {number} now @returns {ReadonlyArray<Signal>} */
export function advanceSignals(signals, now) {
  return signals.filter((signal) => now < signal.born + signal.duration);
}
