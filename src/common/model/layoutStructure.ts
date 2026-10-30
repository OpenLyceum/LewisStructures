/**
 * layoutStructure.ts
 *
 * Geometry for drawing, none of which affects the chemistry:
 *
 *  - `electronAngles` places an atom's lone pairs and unpaired electron in the widest gaps between
 *    its bonds, preferring the four textbook positions (up, down, left, right).
 *  - `freeSpotNear` finds where to put a new atom next to an existing one (or near the middle of
 *    an empty board) without landing on another atom.
 *  - `tidyLayout` relaxes a drawing with springs on the bonds and repulsion between atoms, from
 *    the current positions, so the result stays close to what the student drew.
 */

import { Vector2 } from "scenerystack/dot";
import { MIN_ATOM_SEPARATION } from "../../LewisStructuresConstants.js";

const TWO_PI = 2 * Math.PI;
/** Candidate directions, textbook positions first (y up): up, down, left, right, then diagonals. */
const CANDIDATE_ANGLES = [90, 270, 180, 0, 45, 135, 225, 315].map((degrees) => (degrees * Math.PI) / 180);

function angularDistance(a: number, b: number): number {
  const difference = Math.abs((((a - b) % TWO_PI) + TWO_PI) % TWO_PI);
  return Math.min(difference, TWO_PI - difference);
}

/**
 * Directions (radians, y up) for `count` electron groups on an atom whose bonds point along
 * `bondAngles`. Each group takes the candidate farthest from the bonds and the groups already
 * placed; ties go to the earlier (textbook) candidate. `candidateAngles` overrides the candidates.
 */
export function electronAngles(
  bondAngles: readonly number[],
  count: number,
  candidateAngles: readonly number[] = CANDIDATE_ANGLES,
): number[] {
  const chosen: number[] = [];
  const candidates = [...candidateAngles];
  for (let i = 0; i < count; i++) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    candidates.forEach((angle, index) => {
      const neighbours = [...bondAngles, ...chosen];
      const score = neighbours.length === 0 ? 0 : Math.min(...neighbours.map((other) => angularDistance(angle, other)));
      // A small margin so a textbook direction wins a near-tie against a diagonal.
      if (score > bestScore + 1e-3) {
        bestScore = score;
        bestIndex = index;
      }
    });
    chosen.push(candidates[bestIndex] as number);
    candidates.splice(bestIndex, 1);
    if (candidates.length === 0) {
      break;
    }
  }
  return chosen;
}

/**
 * A spot one bond length from `anchor`, in the direction farthest from its bonds, that is clear
 * of `occupied` and inside `bounds`; with no anchor, the clear spot nearest `center`.
 */
export function freeSpotNear(
  anchor: Vector2 | null,
  anchorBondAngles: readonly number[],
  occupied: readonly Vector2[],
  center: Vector2,
  isInside: (point: Vector2) => boolean,
): Vector2 {
  const isClear = (point: Vector2) =>
    isInside(point) && occupied.every((other) => other.distance(point) >= MIN_ATOM_SEPARATION);
  if (anchor) {
    // Try directions in order of how far they are from the anchor's bonds.
    const directions = electronAngles(anchorBondAngles, CANDIDATE_ANGLES.length);
    for (const radius of [1, 1.4]) {
      for (const angle of directions) {
        const point = anchor.plus(Vector2.createPolar(radius, angle));
        if (isClear(point)) {
          return point;
        }
      }
    }
  }
  // Spiral out from the centre.
  for (let ring = 0; ring < 12; ring++) {
    const steps = Math.max(1, ring * 6);
    for (let k = 0; k < steps; k++) {
      const point = center.plus(Vector2.createPolar(ring * 0.9, (TWO_PI * k) / steps));
      if (isClear(point)) {
        return point;
      }
    }
  }
  return center;
}

/**
 * Relaxed positions for atoms joined by `bonds` (index pairs), starting from `positions`, then
 * shifted so the drawing is centred on `center`.
 */
export function tidyLayout(
  positions: readonly Vector2[],
  bonds: readonly (readonly [number, number])[],
  center: Vector2,
): Vector2[] {
  const n = positions.length;
  if (n === 0) {
    return [];
  }
  const points = positions.map((p) => p.copy());
  const ITERATIONS = 300;
  const SPRING = 0.2;
  const REPULSION = 0.08;
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    const forces = points.map(() => new Vector2(0, 0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = points[i] as Vector2;
        const b = points[j] as Vector2;
        let delta = b.minus(a);
        let distance = delta.magnitude;
        if (distance < 1e-6) {
          // Coincident atoms: separate them along a fixed, index-based direction.
          delta = Vector2.createPolar(1, i + j);
          distance = 1e-3;
        }
        const push = delta.timesScalar(REPULSION / (distance * distance * distance));
        (forces[i] as Vector2).subtract(push);
        (forces[j] as Vector2).add(push);
      }
    }
    for (const [i, j] of bonds) {
      const a = points[i] as Vector2;
      const b = points[j] as Vector2;
      const delta = b.minus(a);
      const distance = Math.max(delta.magnitude, 1e-6);
      const pull = delta.timesScalar((SPRING * (distance - 1)) / distance);
      (forces[i] as Vector2).add(pull);
      (forces[j] as Vector2).subtract(pull);
    }
    const step = 1 - iteration / ITERATIONS;
    points.forEach((point, i) => {
      const force = forces[i] as Vector2;
      const magnitude = force.magnitude;
      // Cap each move so the relaxation stays stable.
      point.add(magnitude > 0.2 ? force.timesScalar((0.2 / magnitude) * step) : force.timesScalar(step));
    });
  }
  const centroid = points.reduce((sum, p) => sum.plus(p), new Vector2(0, 0)).timesScalar(1 / n);
  return points.map((p) => p.minus(centroid).plus(center));
}
