/**
 * formatValues.ts
 *
 * Text shared by the screens: signed charges with a true minus sign, ion charges written as
 * superscripts ("2−"), and element-count lists ("2 O, 1 N").
 */

import type { ElementSymbol } from "../model/ElementData.js";

const MINUS = "−";

/** A formal charge: "+1", "−2", "0". */
export function signedCharge(charge: number): string {
  if (charge === 0) {
    return "0";
  }
  return charge > 0 ? `+${charge}` : `${MINUS}${-charge}`;
}

/** A badge label: "+", "−", "2+", "2−" (or "0"). */
export function badgeCharge(charge: number): string {
  if (charge === 0) {
    return "0";
  }
  const magnitude = Math.abs(charge);
  return `${magnitude === 1 ? "" : magnitude}${charge > 0 ? "+" : MINUS}`;
}

/** "2 O, 1 N" from a count map, in the order given. */
export function countList(counts: ReadonlyMap<ElementSymbol, number>): string {
  return [...counts].map(([element, count]) => `${count} ${element}`).join(", ");
}
