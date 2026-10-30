/**
 * moleculeGraph.ts
 *
 * Comparing two drawings regardless of where the atoms sit or the order they were added in: a
 * graph-isomorphism search. Atoms start in classes by an invariant (element, bond count and, for a
 * full comparison, lone pairs, unpaired electrons and bond orders), the classes are refined by
 * neighbour classes until stable (Morgan's algorithm, as in SpectroscopyLab's MoleculeGraph), and a
 * backtracking search maps atoms class to class, checking each bond as it goes. Gen Chem molecules
 * have at most a dozen or so atoms, so the search is instant.
 */

import { bondOrderBetween, neighborLists, type StructureData } from "./StructureData.js";

type Labels = {
  /** Invariant of an atom before refinement. */
  readonly atom: (data: StructureData, i: number) => string;
  /** Label of the bond between i and j (0 = none). */
  readonly bond: (data: StructureData, i: number, j: number) => number;
};

const SKELETON_LABELS: Labels = {
  atom: (data, i) => data.atoms[i]?.element ?? "",
  bond: (data, i, j) => (bondOrderBetween(data, i, j) > 0 ? 1 : 0),
};

const FULL_LABELS: Labels = {
  atom: (data, i) => {
    const atom = data.atoms[i];
    return atom ? `${atom.element}/${atom.lonePairs}/${atom.unpaired}` : "";
  },
  bond: (data, i, j) => bondOrderBetween(data, i, j),
};

/** Plain code-unit order for class strings (the order only has to be consistent). */
function byText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Refined class of every atom in both structures, from one shared vocabulary so classes compare. */
function refineClasses(a: StructureData, b: StructureData, labels: Labels): [string[], string[]] {
  const neighborsA = neighborLists(a);
  const neighborsB = neighborLists(b);
  let classesA = a.atoms.map((_, i) => labels.atom(a, i));
  let classesB = b.atoms.map((_, i) => labels.atom(b, i));
  const count = (classes: string[]) => new Set(classes).size;
  for (let round = 0; round < a.atoms.length + 1; round++) {
    const next = (data: StructureData, neighbors: number[][], classes: string[]) =>
      classes.map((own, i) => {
        const around = (neighbors[i] ?? [])
          .map((j) => `${labels.bond(data, i, j)}:${classes[j]}`)
          .sort(byText)
          .join(",");
        return `${own}[${around}]`;
      });
    const nextA = next(a, neighborsA, classesA);
    const nextB = next(b, neighborsB, classesB);
    const stable = count(nextA) === count(classesA) && count(nextB) === count(classesB);
    classesA = nextA;
    classesB = nextB;
    if (stable) {
      break;
    }
  }
  return [classesA, classesB];
}

/**
 * A mapping from the atoms of `a` to the atoms of `b` that preserves the labels, or null. With the
 * skeleton labels only elements and connectivity must match; with the full labels the bond orders,
 * lone pairs and unpaired electrons must too.
 */
function findIsomorphism(a: StructureData, b: StructureData, labels: Labels): number[] | null {
  const n = a.atoms.length;
  if (n !== b.atoms.length || a.bonds.length !== b.bonds.length) {
    return null;
  }
  const [classesA, classesB] = refineClasses(a, b, labels);
  const sortedA = [...classesA].sort(byText).join("|");
  const sortedB = [...classesB].sort(byText).join("|");
  if (sortedA !== sortedB) {
    return null;
  }

  const neighborsA = neighborLists(a);
  const mapping: number[] = new Array(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  // Map atoms in breadth-first order so each new atom already has a mapped neighbour to check.
  const order: number[] = [];
  const seen = new Set<number>();
  for (let start = 0; start < n; start++) {
    if (seen.has(start)) {
      continue;
    }
    const queue = [start];
    seen.add(start);
    while (queue.length > 0) {
      const atom = queue.shift() as number;
      order.push(atom);
      for (const next of neighborsA[atom] ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  }

  const extend = (k: number): boolean => {
    if (k === n) {
      return true;
    }
    const i = order[k] as number;
    for (let j = 0; j < n; j++) {
      if (used[j] || classesA[i] !== classesB[j]) {
        continue;
      }
      let consistent = true;
      for (let m = 0; m < k && consistent; m++) {
        const other = order[m] as number;
        consistent = labels.bond(a, i, other) === labels.bond(b, j, mapping[other] as number);
      }
      if (!consistent) {
        continue;
      }
      mapping[i] = j;
      used[j] = true;
      if (extend(k + 1)) {
        return true;
      }
      used[j] = false;
      mapping[i] = -1;
    }
    return false;
  };
  return extend(0) ? mapping : null;
}

/** Same atoms joined the same way (bond orders and electrons ignored). */
export function sameSkeleton(a: StructureData, b: StructureData): boolean {
  return findIsomorphism(a, b, SKELETON_LABELS) !== null;
}

/** Same atoms, bonds, bond orders, lone pairs and unpaired electrons, and the same charge. */
export function sameStructure(a: StructureData, b: StructureData): boolean {
  return a.charge === b.charge && findIsomorphism(a, b, FULL_LABELS) !== null;
}

/** A skeleton-preserving map from the atoms of `a` to those of `b`, or null. */
export function skeletonMapping(a: StructureData, b: StructureData): number[] | null {
  return findIsomorphism(a, b, SKELETON_LABELS);
}
