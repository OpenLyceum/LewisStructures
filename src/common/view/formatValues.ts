/**
 * formatValues.ts
 *
 * Text shared by the screens: signed charges with a true minus sign, ion charges written as
 * superscripts ("2−"), and element-count lists ("2 O, 1 N").
 */

import { toFixed } from "scenerystack/dot";
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

const VULGAR: ReadonlyMap<string, string> = new Map([
  ["1/2", "½"],
  ["1/3", "⅓"],
  ["2/3", "⅔"],
  ["1/4", "¼"],
  ["3/4", "¾"],
  ["1/5", "⅕"],
  ["2/5", "⅖"],
  ["3/5", "⅗"],
  ["4/5", "⅘"],
  ["1/6", "⅙"],
  ["5/6", "⅚"],
]);

/**
 * An average as a mixed fraction with a vulgar-fraction glyph: 4/3 → "1⅓", −2/3 → "−⅔", 1.5 → "1½".
 * Denominators up to 6 cover every hybrid in the catalog; anything else falls back to two decimals.
 * With `signed`, positive values get a "+".
 */
export function fractionText(value: number, signed = false): string {
  const sign = value < 0 ? MINUS : signed && value > 0 ? "+" : "";
  const magnitude = Math.abs(value);
  for (let denominator = 1; denominator <= 6; denominator++) {
    const numerator = Math.round(magnitude * denominator);
    if (Math.abs(numerator / denominator - magnitude) < 1e-6) {
      const whole = Math.floor(numerator / denominator);
      const rest = numerator - whole * denominator;
      if (rest === 0) {
        return `${sign}${whole}`;
      }
      const glyph = VULGAR.get(`${rest}/${denominator}`) ?? `${rest}/${denominator}`;
      return `${sign}${whole > 0 ? whole : ""}${glyph}`;
    }
  }
  return `${sign}${toFixed(magnitude, 2)}`;
}
