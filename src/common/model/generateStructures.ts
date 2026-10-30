/**
 * generateStructures.ts
 *
 * Every valid Lewis structure on a fixed skeleton, ranked. The catalog stores only skeletons; the
 * answers students are checked against all come from here, and the tests compare them with
 * textbook structures.
 *
 *  1. Enumerate bond orders (1–3) on the skeleton's edges, keeping each atom within its bond limit
 *     (H 1, an octet 4, an expandable central atom 7) and within the electron total.
 *  2. Give each atom a nonbonding count that brings it to an allowed total: 2 for H; 8; Be 4 or
 *     B/Al 6 as an allowed incomplete octet; 10, 12 or 14 for a period-3+ atom with two or more
 *     bonds. With an odd total, one atom holds one fewer (an unpaired electron), and it must be the
 *     least electronegative non-hydrogen atom (NO, NO₂, ClO₂).
 *  3. Keep the assignments that use exactly the electron total.
 *  4. Rank by Σ|FC|, then ΣFC² (avoid ±2 on one atom, as in N₃⁻), then ΣFC·χ (negative formal
 *     charge on the more electronegative atom, as in SCN⁻ and OCN⁻). OctetPolicy decides how the
 *     electrons past an octet weigh against formal charge (see OctetPolicy.ts).
 *
 * Structures that tie on the full key are equivalent resonance forms (NO₃⁻, O₃, benzene). Searches
 * stop after MAX_VISITS bond-order assignments, which only a large free-build drawing reaches.
 */

import { getElement, MAX_EXPANDED_ELECTRONS, maxBondOrderSum } from "./ElementData.js";
import { OctetPolicy } from "./OctetPolicy.js";
import { MAX_BOND_ORDER, neighborLists, type StructureData, structureKey } from "./StructureData.js";

export type ScoredStructure = {
  readonly data: StructureData;
  readonly formalCharges: readonly number[];
  /** Σ|FC| */
  readonly absoluteSum: number;
  /** ΣFC² */
  readonly squareSum: number;
  /** ΣFC·χ: lower puts negative charge on more electronegative atoms. */
  readonly electronegativityScore: number;
  /** Σ electrons past eight, over all atoms. */
  readonly excess: number;
};

export type StructureSet = {
  /** The best structure(s); several are equivalent resonance forms. */
  readonly best: readonly ScoredStructure[];
  /** Also correct under the policy (ACCEPT_BOTH: the octet forms when the best set expands). */
  readonly alternatives: readonly ScoredStructure[];
  /** As small formal charges as the best, but with negative charge on a less electronegative atom. */
  readonly acceptable: readonly ScoredStructure[];
  /** Other valid structures within two units of total formal charge: minor resonance contributors. */
  readonly minor: readonly ScoredStructure[];
  /** Every valid structure, best first. */
  readonly all: readonly ScoredStructure[];
  /** True when the search hit MAX_VISITS and the lists may be incomplete. */
  readonly truncated: boolean;
};

const MAX_VISITS = 200_000;
const EPSILON = 1e-9;
/** How far past the best Σ|FC| a structure may be and still be listed as a minor contributor. */
const MINOR_WINDOW = 2;

function compareNumbers(a: number, b: number): number {
  return Math.abs(a - b) < EPSILON ? 0 : a - b;
}

function compareFormalCharge(a: ScoredStructure, b: ScoredStructure): number {
  return (
    compareNumbers(a.absoluteSum, b.absoluteSum) ||
    compareNumbers(a.squareSum, b.squareSum) ||
    compareNumbers(a.electronegativityScore, b.electronegativityScore)
  );
}

function compareOctetFirst(a: ScoredStructure, b: ScoredStructure): number {
  return compareNumbers(a.excess, b.excess) || compareFormalCharge(a, b);
}

/** Allowed electron totals around atom i, given its bond count and whether it may hold the odd electron. */
function allowedTotals(data: StructureData, i: number, degree: number, mayBeOdd: boolean): number[] {
  const atom = data.atoms[i];
  if (!atom) {
    return [];
  }
  if (atom.element === "H") {
    return [2];
  }
  const element = getElement(atom.element);
  const totals = [element.target];
  if (element.allowedIncomplete !== null) {
    totals.push(element.allowedIncomplete);
  }
  const expands = element.canExpand && degree >= 2;
  if (expands) {
    for (let total = element.target + 2; total <= MAX_EXPANDED_ELECTRONS; total += 2) {
      totals.push(total);
    }
  }
  if (mayBeOdd) {
    totals.push(element.target - 1);
    if (expands) {
      for (let total = element.target + 1; total < MAX_EXPANDED_ELECTRONS; total += 2) {
        totals.push(total);
      }
    }
  }
  return totals;
}

function score(data: StructureData): ScoredStructure {
  const sums = data.atoms.map(() => 0);
  for (const bond of data.bonds) {
    sums[bond.a] = (sums[bond.a] ?? 0) + bond.order;
    sums[bond.b] = (sums[bond.b] ?? 0) + bond.order;
  }
  let absoluteSum = 0;
  let squareSum = 0;
  let electronegativityScore = 0;
  let excess = 0;
  const formalCharges = data.atoms.map((atom, i) => {
    const element = getElement(atom.element);
    const nonbonding = 2 * atom.lonePairs + atom.unpaired;
    const bondSum = sums[i] ?? 0;
    const formalCharge = element.valence - nonbonding - bondSum;
    absoluteSum += Math.abs(formalCharge);
    squareSum += formalCharge * formalCharge;
    electronegativityScore += formalCharge * element.electronegativity;
    excess += Math.max(0, nonbonding + 2 * bondSum - element.target);
    return formalCharge;
  });
  return { data, formalCharges, absoluteSum, squareSum, electronegativityScore, excess };
}

/**
 * All valid structures on the skeleton's connectivity. Bond orders and lone pairs in `skeleton` are
 * ignored; positions and the charge are kept.
 */
export function enumerateStructures(skeleton: StructureData): { structures: ScoredStructure[]; truncated: boolean } {
  const atomCount = skeleton.atoms.length;
  const edges = skeleton.bonds.map((bond) => [bond.a, bond.b] as const);
  const neighbors = neighborLists(skeleton);
  const total = skeleton.atoms.reduce((sum, atom) => sum + getElement(atom.element).valence, 0) - skeleton.charge;
  const structures: ScoredStructure[] = [];
  if (atomCount === 0 || total < 0) {
    return { structures, truncated: false };
  }

  const odd = total % 2 === 1;
  // The odd electron goes on the least electronegative non-hydrogen atom(s).
  let oddCandidates = new Set<number>();
  if (odd) {
    let lowest = Number.POSITIVE_INFINITY;
    skeleton.atoms.forEach((atom, i) => {
      if (atom.element === "H") {
        return;
      }
      const chi = getElement(atom.element).electronegativity;
      if (chi < lowest - EPSILON) {
        lowest = chi;
        oddCandidates = new Set([i]);
      } else if (Math.abs(chi - lowest) < EPSILON) {
        oddCandidates.add(i);
      }
    });
  }

  const limits = skeleton.atoms.map((atom) => maxBondOrderSum(atom.element));
  const bondSums = skeleton.atoms.map(() => 0);
  const orders = edges.map(() => 1);
  let visits = 0;
  let truncated = false;

  const assignElectrons = (remaining: number): void => {
    const nonbonding = skeleton.atoms.map(() => 0);
    const options = skeleton.atoms.map((_, i) =>
      allowedTotals(skeleton, i, neighbors[i]?.length ?? 0, oddCandidates.has(i))
        .map((totalAround) => totalAround - 2 * (bondSums[i] ?? 0))
        .filter((n) => n >= 0),
    );
    const place = (i: number, left: number, oddUsed: boolean): void => {
      if (i === atomCount) {
        if (left === 0 && oddUsed === odd) {
          const atoms = skeleton.atoms.map((atom, k) => {
            const n = nonbonding[k] ?? 0;
            return { ...atom, lonePairs: Math.floor(n / 2), unpaired: n % 2 };
          });
          const bonds = edges.map(([a, b], k) => ({ a, b, order: orders[k] ?? 1 }));
          structures.push(score({ atoms, bonds, charge: skeleton.charge }));
        }
        return;
      }
      for (const n of new Set(options[i])) {
        const isOdd = n % 2 === 1;
        if (n > left || (isOdd && (oddUsed || !odd))) {
          continue;
        }
        nonbonding[i] = n;
        place(i + 1, left - n, oddUsed || isOdd);
      }
    };
    place(0, remaining, false);
  };

  const assignBonds = (k: number, electronsLeft: number): void => {
    if (truncated) {
      return;
    }
    if (k === edges.length) {
      visits++;
      if (visits > MAX_VISITS) {
        truncated = true;
        return;
      }
      assignElectrons(electronsLeft);
      return;
    }
    const [a, b] = edges[k] as readonly [number, number];
    const isHydrogen = skeleton.atoms[a]?.element === "H" || skeleton.atoms[b]?.element === "H";
    const maxOrder = isHydrogen ? 1 : MAX_BOND_ORDER;
    for (let order = 1; order <= maxOrder; order++) {
      const sumA = (bondSums[a] ?? 0) + order;
      const sumB = (bondSums[b] ?? 0) + order;
      if (sumA > (limits[a] ?? 0) || sumB > (limits[b] ?? 0) || 2 * order > electronsLeft) {
        break;
      }
      bondSums[a] = sumA;
      bondSums[b] = sumB;
      orders[k] = order;
      assignBonds(k + 1, electronsLeft - 2 * order);
      bondSums[a] = sumA - order;
      bondSums[b] = sumB - order;
    }
  };

  assignBonds(0, total);
  return { structures, truncated };
}

/** The structures sharing the smallest key under `compare`. */
function minimal(structures: readonly ScoredStructure[], compare: (a: ScoredStructure, b: ScoredStructure) => number) {
  const sorted = [...structures].sort(compare);
  const first = sorted[0];
  return first ? sorted.filter((s) => compare(s, first) === 0) : [];
}

const cache = new Map<string, StructureSet>();

/** Ranked structures for a skeleton under a policy (memoised by connectivity, charge and policy). */
export function generateStructures(skeleton: StructureData, policy: OctetPolicy): StructureSet {
  const cacheKey = `${structureKey({ ...skeleton, atoms: skeleton.atoms.map((a) => ({ ...a, lonePairs: 0, unpaired: 0 })), bonds: skeleton.bonds.map((b) => ({ ...b, order: 1 })) })}|${policy.name}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { structures, truncated } = enumerateStructures(skeleton);
  const byFormalCharge = minimal(structures, compareFormalCharge);
  const byOctet = minimal(structures, compareOctetFirst);

  let best: ScoredStructure[];
  let alternatives: ScoredStructure[] = [];
  if (policy === OctetPolicy.OCTET_FIRST) {
    best = byOctet;
  } else {
    best = byFormalCharge;
    if (policy === OctetPolicy.ACCEPT_BOTH) {
      alternatives = byOctet.filter((s) => !best.includes(s));
    }
  }

  const reference = best[0];
  const taken = new Set<ScoredStructure>([...best, ...alternatives]);
  const acceptable = reference
    ? structures.filter(
        (s) =>
          !taken.has(s) &&
          compareNumbers(s.absoluteSum, reference.absoluteSum) === 0 &&
          compareNumbers(s.squareSum, reference.squareSum) === 0 &&
          (policy !== OctetPolicy.OCTET_FIRST || compareNumbers(s.excess, reference.excess) === 0),
      )
    : [];
  for (const s of acceptable) {
    taken.add(s);
  }
  const minor = reference
    ? structures
        .filter((s) => !taken.has(s) && s.absoluteSum <= reference.absoluteSum + MINOR_WINDOW + EPSILON)
        .sort(compareFormalCharge)
    : [];

  const all = [...structures].sort(policy === OctetPolicy.OCTET_FIRST ? compareOctetFirst : compareFormalCharge);
  const set: StructureSet = { best, alternatives, acceptable, minor, all, truncated };
  cache.set(cacheKey, set);
  return set;
}
