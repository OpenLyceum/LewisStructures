/**
 * speciesLabels.ts
 *
 * Localised labels for species and categories, created once per species and kept for the life of
 * the sim, so combo boxes that are rebuilt do not leak DerivedProperties.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import type { ElementSymbol } from "../model/ElementData.js";
import type { Species, SpeciesCategory } from "../model/SpeciesCatalog.js";
import type { CategoryChoice } from "../model/SpeciesChoice.js";

type StringMap = Record<string, TReadOnlyProperty<string>>;

function lookup(map: object, key: string): TReadOnlyProperty<string> {
  const property = (map as StringMap)[`${key}StringProperty`];
  if (!property) {
    throw new Error(`missing string: ${key}`);
  }
  return property;
}

/** The localised name of a species ("nitrate"). */
export function speciesName(species: Species): TReadOnlyProperty<string> {
  return lookup(StringManager.getInstance().getSpeciesNames(), species.id);
}

/** The localised name of an element ("oxygen"). */
export function elementName(element: ElementSymbol): TReadOnlyProperty<string> {
  return lookup(StringManager.getInstance().getElementNames(), element);
}

/** The localised name of a category, or of free build. */
export function categoryName(category: CategoryChoice | SpeciesCategory): TReadOnlyProperty<string> {
  return lookup(StringManager.getInstance().getCategoryNames(), category);
}

const displayCache = new Map<Species, TReadOnlyProperty<string>>();

/** "NO<sub>3</sub><sup>−</sup>  nitrate", for combo-box items. */
export function speciesDisplay(species: Species): TReadOnlyProperty<string> {
  let display = displayCache.get(species);
  if (!display) {
    display = new DerivedProperty([speciesName(species)], (name) => `${species.formula}   ${name}`);
    displayCache.set(species, display);
  }
  return display;
}
