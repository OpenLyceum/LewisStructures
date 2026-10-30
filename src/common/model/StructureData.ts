/**
 * StructureData.ts
 *
 * An immutable snapshot of a Lewis structure: atoms (element, 2D position in bond lengths, lone
 * pairs, unpaired electrons), bonds by atom index with an order of 1–3, and the overall charge.
 * The analysis, the generator, the comparisons and the tests all work on this plain form; the
 * editable LewisStructure converts to and from it.
 */

import type { ElementSymbol } from "./ElementData.js";

export type AtomData = {
  readonly element: ElementSymbol;
  /** Position in bond lengths, y up. Cosmetic: no rule depends on it. */
  readonly x: number;
  readonly y: number;
  readonly lonePairs: number;
  /** 0 or 1. */
  readonly unpaired: number;
};

export type BondData = {
  readonly a: number;
  readonly b: number;
  /** 1, 2 or 3. */
  readonly order: number;
};

export type StructureData = {
  readonly atoms: readonly AtomData[];
  readonly bonds: readonly BondData[];
  readonly charge: number;
};

export const MAX_BOND_ORDER = 3;
/** Four lone pairs is a full octet with no bonds (as in a halide ion). */
export const MAX_LONE_PAIRS = 4;

/** Neighbour indices of each atom. */
export function neighborLists(data: StructureData): number[][] {
  const neighbors: number[][] = data.atoms.map(() => []);
  for (const bond of data.bonds) {
    neighbors[bond.a]?.push(bond.b);
    neighbors[bond.b]?.push(bond.a);
  }
  return neighbors;
}

/** Sum of the bond orders at each atom. */
export function bondOrderSums(data: StructureData): number[] {
  const sums = data.atoms.map(() => 0);
  for (const bond of data.bonds) {
    sums[bond.a] = (sums[bond.a] ?? 0) + bond.order;
    sums[bond.b] = (sums[bond.b] ?? 0) + bond.order;
  }
  return sums;
}

/** Whether every atom can be reached from the first along bonds (an empty structure is not). */
export function isConnected(data: StructureData): boolean {
  if (data.atoms.length === 0) {
    return false;
  }
  const neighbors = neighborLists(data);
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length > 0) {
    const atom = stack.pop() as number;
    for (const next of neighbors[atom] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen.size === data.atoms.length;
}

/** Order of the bond between atoms i and j, or 0. */
export function bondOrderBetween(data: StructureData, i: number, j: number): number {
  for (const bond of data.bonds) {
    if ((bond.a === i && bond.b === j) || (bond.a === j && bond.b === i)) {
      return bond.order;
    }
  }
  return 0;
}

/** Element counts, e.g. { N: 1, O: 3 }, for comparing a drawing's atoms with a formula. */
export function elementCounts(data: StructureData): Map<ElementSymbol, number> {
  const counts = new Map<ElementSymbol, number>();
  for (const atom of data.atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  }
  return counts;
}

/** A stable text form for tests: atoms by index, then bonds sorted. */
export function structureKey(data: StructureData): string {
  const atoms = data.atoms.map((atom) => `${atom.element}:${atom.lonePairs}${atom.unpaired ? "." : ""}`).join(",");
  const bonds = data.bonds
    .map((bond) => {
      const [a, b] = bond.a < bond.b ? [bond.a, bond.b] : [bond.b, bond.a];
      return `${a}-${b}:${bond.order}`;
    })
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  return `${atoms}|${bonds}|${data.charge}`;
}
