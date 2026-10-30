/**
 * SpeciesChoice.ts
 *
 * What the Build screen is drawing: a catalog species, chosen by category, or free build (any
 * molecule or ion, with a charge the student sets).
 */

import { getSpeciesInCategory, type SpeciesCategory } from "./SpeciesCatalog.js";

export type CategoryChoice = SpeciesCategory | "freeBuild";

/** The first species of a category, or null for free build. */
export function firstSpeciesOf(category: CategoryChoice) {
  return category === "freeBuild" ? null : (getSpeciesInCategory(category)[0] ?? null);
}
