/**
 * checkStructure.ts
 *
 * Grades a drawing against the generated answers, step by step, so the feedback names the first
 * thing wrong: the atoms, then whether the electron rules are met, then the skeleton, then how the
 * finished structure ranks (best, a policy alternative, acceptable but with charge on the wrong
 * atom, a minor resonance contributor, or valid but not the best).
 *
 * In free build there is no target formula: the drawing's own skeleton is used, so any molecule
 * can be checked for its best electron arrangement.
 */

import { analyzeStructure } from "./analyzeStructure.js";
import type { ElementSymbol } from "./ElementData.js";
import { generateStructures, type ScoredStructure, type StructureSet } from "./generateStructures.js";
import { sameSkeleton, sameStructure } from "./moleculeGraph.js";
import type { OctetPolicy } from "./OctetPolicy.js";
import type { Species } from "./SpeciesCatalog.js";
import { elementCounts, type StructureData } from "./StructureData.js";

export type CheckOutcome =
  | { readonly kind: "empty" }
  | {
      readonly kind: "wrongAtoms";
      readonly missing: ReadonlyMap<ElementSymbol, number>;
      readonly extra: ReadonlyMap<ElementSymbol, number>;
    }
  | { readonly kind: "incomplete" }
  | { readonly kind: "wrongSkeleton" }
  | { readonly kind: "best"; readonly form: ScoredStructure; readonly formCount: number }
  | { readonly kind: "alternative"; readonly form: ScoredStructure }
  | { readonly kind: "acceptable"; readonly form: ScoredStructure }
  | { readonly kind: "minor"; readonly form: ScoredStructure }
  | { readonly kind: "notBest" }
  | { readonly kind: "tooLarge" };

/** Outcomes that count as a correct answer in the Challenge. */
export function isCorrect(outcome: CheckOutcome): boolean {
  return outcome.kind === "best" || outcome.kind === "alternative";
}

function compareAtoms(drawing: StructureData, target: StructureData): CheckOutcome | null {
  const have = elementCounts(drawing);
  const want = elementCounts(target);
  const missing = new Map<ElementSymbol, number>();
  const extra = new Map<ElementSymbol, number>();
  for (const [element, count] of want) {
    const difference = count - (have.get(element) ?? 0);
    if (difference > 0) {
      missing.set(element, difference);
    }
  }
  for (const [element, count] of have) {
    const difference = count - (want.get(element) ?? 0);
    if (difference > 0) {
      extra.set(element, difference);
    }
  }
  return missing.size > 0 || extra.size > 0 ? { kind: "wrongAtoms", missing, extra } : null;
}

/** Ranks a finished drawing within a generated set. */
function rank(drawing: StructureData, set: StructureSet): CheckOutcome {
  const find = (list: readonly ScoredStructure[]) => list.find((s) => sameStructure(drawing, s.data));
  const best = find(set.best);
  if (best) {
    return { kind: "best", form: best, formCount: set.best.length };
  }
  const alternative = find(set.alternatives);
  if (alternative) {
    return { kind: "alternative", form: alternative };
  }
  const acceptable = find(set.acceptable);
  if (acceptable) {
    return { kind: "acceptable", form: acceptable };
  }
  const minor = find(set.minor);
  if (minor) {
    return { kind: "minor", form: minor };
  }
  return set.truncated ? { kind: "tooLarge" } : { kind: "notBest" };
}

/** Checks a drawing against a catalog species. */
export function checkAgainstSpecies(drawing: StructureData, species: Species, policy: OctetPolicy): CheckOutcome {
  if (drawing.atoms.length === 0) {
    return { kind: "empty" };
  }
  const atoms = compareAtoms(drawing, species.skeleton);
  if (atoms) {
    return atoms;
  }
  if (!analyzeStructure(drawing).complete) {
    return { kind: "incomplete" };
  }
  if (!sameSkeleton(drawing, species.skeleton)) {
    return { kind: "wrongSkeleton" };
  }
  return rank(drawing, generateStructures(species.skeleton, policy));
}

/** Checks a free drawing against the best arrangements of its own skeleton. */
export function checkFreeBuild(drawing: StructureData, policy: OctetPolicy): CheckOutcome {
  if (drawing.atoms.length === 0) {
    return { kind: "empty" };
  }
  if (!analyzeStructure(drawing).complete) {
    return { kind: "incomplete" };
  }
  return rank(drawing, generateStructures(drawing, policy));
}
