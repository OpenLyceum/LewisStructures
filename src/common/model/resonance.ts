/**
 * resonance.ts
 *
 * Comparing resonance forms on one skeleton (same atoms in the same order, as generateStructures
 * produces them):
 *
 *  - `resonanceArrows` gives the curved arrows that turn one form into another. Every bond-order
 *    change of one is a pair of electrons moving: a lone pair becomes a bond (lone pair → bond), a
 *    bond pair becomes a lone pair (bond → lone pair), or a pair slides from one bond to the next
 *    (bond → bond, as around benzene). Electron gains are matched to losses on a shared atom.
 *  - `resonanceHybrid` averages the equivalent major forms: bond orders (4/3 in NO₃⁻) and formal
 *    charges (−2/3 on each O).
 *  - `resonanceGallery` picks the forms worth showing, ranked: the best set, the policy
 *    alternatives, then one of each kind of acceptable or minor form (symmetry duplicates dropped).
 */

import type { ScoredStructure, StructureSet } from "./generateStructures.js";
import { sameStructure } from "./moleculeGraph.js";
import type { StructureData } from "./StructureData.js";

/** One end of a curved arrow: a lone pair on an atom, or the pair of a bond (by bond index). */
export type ArrowEnd =
  | { readonly kind: "lonePair"; readonly atom: number }
  | { readonly kind: "bond"; readonly bond: number };

export type ResonanceArrow = { readonly from: ArrowEnd; readonly to: ArrowEnd };

function bondKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * The curved arrows from form `from` to form `to` (same skeleton, bonds in the same order). Changes
 * that cannot be paired (an unpaired electron moving) are left without an arrow.
 */
export function resonanceArrows(from: StructureData, to: StructureData): ResonanceArrow[] {
  const toOrders = new Map(to.bonds.map((bond) => [bondKey(bond.a, bond.b), bond.order]));
  // Units of change: each +1/−1 in a bond order or lone-pair count is one electron pair.
  const bondGains: number[] = [];
  const bondLosses: number[] = [];
  from.bonds.forEach((bond, i) => {
    const change = (toOrders.get(bondKey(bond.a, bond.b)) ?? bond.order) - bond.order;
    for (let k = 0; k < Math.abs(change); k++) {
      (change > 0 ? bondGains : bondLosses).push(i);
    }
  });
  const pairGains: number[] = [];
  const pairLosses: number[] = [];
  from.atoms.forEach((atom, i) => {
    const change = (to.atoms[i]?.lonePairs ?? atom.lonePairs) - atom.lonePairs;
    for (let k = 0; k < Math.abs(change); k++) {
      (change > 0 ? pairGains : pairLosses).push(i);
    }
  });

  const joins = (bondIndex: number, atom: number) => {
    const bond = from.bonds[bondIndex];
    return bond !== undefined && (bond.a === atom || bond.b === atom);
  };
  const adjacent = (i: number, j: number) => {
    const bond = from.bonds[i];
    return bond !== undefined && (joins(j, bond.a) || joins(j, bond.b));
  };
  const take = <T>(list: T[], predicate: (item: T) => boolean): T | null => {
    const index = list.findIndex(predicate);
    return index < 0 ? null : (list.splice(index, 1)[0] as T);
  };

  const arrows: ResonanceArrow[] = [];
  // A new bond pair comes from a lone pair on one of its atoms…
  for (const gained of [...bondGains]) {
    const atom = take(pairLosses, (a) => joins(gained, a));
    if (atom !== null) {
      arrows.push({ from: { kind: "lonePair", atom }, to: { kind: "bond", bond: gained } });
      bondGains.splice(bondGains.indexOf(gained), 1);
    }
  }
  // …or slides over from a neighbouring bond.
  for (const gained of [...bondGains]) {
    const lost = take(bondLosses, (b) => adjacent(b, gained));
    if (lost !== null) {
      arrows.push({ from: { kind: "bond", bond: lost }, to: { kind: "bond", bond: gained } });
      bondGains.splice(bondGains.indexOf(gained), 1);
    }
  }
  // A lost bond pair becomes a lone pair on one of its atoms.
  for (const lost of [...bondLosses]) {
    const atom = take(pairGains, (a) => joins(lost, a));
    if (atom !== null) {
      arrows.push({ from: { kind: "bond", bond: lost }, to: { kind: "lonePair", atom } });
    }
  }
  return arrows;
}

export type ResonanceHybrid = {
  /** Average order of each bond, in the skeleton's bond order. */
  readonly bondOrders: readonly number[];
  /** Average formal charge of each atom. */
  readonly formalCharges: readonly number[];
};

/** The average of the given forms (normally the equivalent best forms). */
export function resonanceHybrid(forms: readonly ScoredStructure[]): ResonanceHybrid {
  const first = forms[0];
  if (!first) {
    return { bondOrders: [], formalCharges: [] };
  }
  const n = forms.length;
  const bondOrders = first.data.bonds.map((bond) => {
    const key = bondKey(bond.a, bond.b);
    const sum = forms.reduce((total, form) => {
      const match = form.data.bonds.find((other) => bondKey(other.a, other.b) === key);
      return total + (match?.order ?? 0);
    }, 0);
    return sum / n;
  });
  const formalCharges = first.data.atoms.map(
    (_, i) => forms.reduce((total, form) => total + (form.formalCharges[i] ?? 0), 0) / n,
  );
  return { bondOrders, formalCharges };
}

/** How a form ranks among the resonance forms of its species. */
export type FormRank = "major" | "equivalent" | "alternative" | "acceptable" | "minor";

export type GalleryForm = {
  readonly form: ScoredStructure;
  readonly rank: FormRank;
};

/** Most forms shown in the gallery. */
export const MAX_GALLERY_FORMS = 9;

/**
 * The forms to show for a species: every best form (equivalent forms are the point of resonance),
 * then the policy alternatives, then up to two acceptable and two minor forms that are not
 * symmetry copies of one another.
 */
export function resonanceGallery(set: StructureSet): GalleryForm[] {
  const gallery: GalleryForm[] = set.best.map((form) => ({
    form,
    rank: set.best.length > 1 ? "equivalent" : "major",
  }));
  const addDistinct = (forms: readonly ScoredStructure[], rank: FormRank, limit: number) => {
    let added = 0;
    for (const form of forms) {
      if (added >= limit || gallery.length >= MAX_GALLERY_FORMS) {
        return;
      }
      const duplicate = gallery.some((shown) => shown.rank === rank && sameStructure(shown.form.data, form.data));
      if (!duplicate) {
        gallery.push({ form, rank });
        added++;
      }
    }
  };
  addDistinct(set.alternatives, "alternative", 2);
  addDistinct(set.acceptable, "acceptable", 2);
  addDistinct(set.minor, "minor", 2);
  return gallery.slice(0, MAX_GALLERY_FORMS);
}
