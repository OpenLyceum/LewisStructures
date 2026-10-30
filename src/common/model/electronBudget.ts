/**
 * electronBudget.ts
 *
 * The valence-electron count shown beside the board and spoken after each edit. With a target (a
 * catalog species) the total comes from its formula, so it is known before any atom is drawn; in
 * free build it comes from the atoms on the board.
 */

import { getElement } from "./ElementData.js";
import type { LewisStructure } from "./LewisStructure.js";
import type { StructureData } from "./StructureData.js";

export type ElectronBudget = {
  readonly fromAtoms: number;
  readonly charge: number;
  readonly total: number;
  readonly placed: number;
  /** Negative when too many are placed. */
  readonly left: number;
};

export function electronBudget(structure: LewisStructure, target: StructureData | null): ElectronBudget {
  const atoms = target ? target.atoms : structure.atoms;
  const fromAtoms = atoms.reduce((sum, atom) => sum + getElement(atom.element).valence, 0);
  const charge = structure.chargeProperty.value;
  const total = fromAtoms - charge;
  const placed = structure.analysisProperty.value.placed;
  return { fromAtoms, charge, total, placed, left: total - placed };
}
