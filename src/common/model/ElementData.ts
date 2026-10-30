/**
 * ElementData.ts
 *
 * The main-group elements a Gen Chem Lewis structure uses, with what the electron-counting rules
 * need: valence electrons, period (only period 3 and below may expand an octet), Pauling
 * electronegativity (formal-charge tie-breaks and where an odd electron goes) and the covalent
 * radius for the 3D shape preview. Pure data, no Scenery imports, so tests can use it directly.
 *
 * Sources: Pauling electronegativities from the CRC Handbook (the same values as PeriodicTrends);
 * single-bond covalent radii from B. Cordero et al., Dalton Trans. 2832 (2008), pm.
 */

export const ELEMENT_SYMBOLS = [
  "H",
  "Be",
  "B",
  "C",
  "N",
  "O",
  "F",
  "Al",
  "Si",
  "P",
  "S",
  "Cl",
  "Se",
  "Br",
  "I",
  "Xe",
] as const;

export type ElementSymbol = (typeof ELEMENT_SYMBOLS)[number];

export type LewisElement = {
  readonly symbol: ElementSymbol;
  readonly valence: number;
  readonly period: number;
  /** IUPAC group, 1–18. */
  readonly group: number;
  readonly electronegativity: number;
  /** Covalent radius, pm. */
  readonly radius: number;
  /** Electrons the atom normally wants around it: 2 for H, 8 for everything else. */
  readonly target: number;
  /** A smaller count the atom may stop at without breaking a rule (Be 4, B and Al 6), or null. */
  readonly allowedIncomplete: number | null;
  /** Whether it may hold more than eight electrons (period ≥ 3, group ≥ 14). */
  readonly canExpand: boolean;
};

/** Largest number of electrons an expanded atom may hold (ClO₄⁻ with three Cl=O needs 14). */
export const MAX_EXPANDED_ELECTRONS = 14;

function element(
  symbol: ElementSymbol,
  valence: number,
  period: number,
  group: number,
  electronegativity: number,
  radius: number,
  allowedIncomplete: number | null = null,
): LewisElement {
  return {
    symbol,
    valence,
    period,
    group,
    electronegativity,
    radius,
    target: symbol === "H" ? 2 : 8,
    allowedIncomplete,
    canExpand: period >= 3 && group >= 14,
  };
}

const ELEMENTS: Readonly<Record<ElementSymbol, LewisElement>> = {
  H: element("H", 1, 1, 1, 2.2, 31),
  Be: element("Be", 2, 2, 2, 1.57, 96, 4),
  B: element("B", 3, 2, 13, 2.04, 84, 6),
  C: element("C", 4, 2, 14, 2.55, 76),
  N: element("N", 5, 2, 15, 3.04, 71),
  O: element("O", 6, 2, 16, 3.44, 66),
  F: element("F", 7, 2, 17, 3.98, 57),
  Al: element("Al", 3, 3, 13, 1.61, 121, 6),
  Si: element("Si", 4, 3, 14, 1.9, 111),
  P: element("P", 5, 3, 15, 2.19, 107),
  S: element("S", 6, 3, 16, 2.58, 105),
  Cl: element("Cl", 7, 3, 17, 3.16, 102),
  Se: element("Se", 6, 4, 16, 2.55, 120),
  Br: element("Br", 7, 4, 17, 2.96, 120),
  I: element("I", 7, 5, 17, 2.66, 139),
  Xe: element("Xe", 8, 5, 18, 2.6, 140),
};

export function getElement(symbol: ElementSymbol): LewisElement {
  return ELEMENTS[symbol];
}

export function isElementSymbol(symbol: string): symbol is ElementSymbol {
  return (ELEMENT_SYMBOLS as readonly string[]).includes(symbol);
}

/** Largest total bond order the atom can carry (H 1; an octet 4; an expanded atom 7). */
export function maxBondOrderSum(symbol: ElementSymbol): number {
  const data = ELEMENTS[symbol];
  if (symbol === "H") {
    return 1;
  }
  return data.canExpand ? MAX_EXPANDED_ELECTRONS / 2 : data.target / 2;
}
