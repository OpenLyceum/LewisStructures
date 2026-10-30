/**
 * SpeciesCatalog.ts
 *
 * The molecules and ions students draw. Each entry gives a formula, a charge and a **skeleton**:
 * which atom is bonded to which, with 2D positions in bond lengths (y up) for when the sim lays the
 * structure out itself. The catalog stores no answers: generateStructures derives the bond orders
 * and lone pairs, and tests/common/generateStructures.test.ts checks them against textbook
 * structures. Display names are localised under `species.<id>` in the string files.
 */

import type { ElementSymbol } from "./ElementData.js";
import type { StructureData } from "./StructureData.js";

export type SpeciesCategory =
  | "simple"
  | "multipleBonds"
  | "ions"
  | "resonance"
  | "expanded"
  | "incomplete"
  | "radicals";

export const SPECIES_CATEGORIES: readonly SpeciesCategory[] = [
  "simple",
  "multipleBonds",
  "ions",
  "resonance",
  "expanded",
  "incomplete",
  "radicals",
];

export type Species = {
  /** Key for the localised name and for query parameters, e.g. "nitrate". */
  readonly id: string;
  /** Formula as RichText markup, e.g. "NO<sub>3</sub><sup>−</sup>". */
  readonly formula: string;
  /** Formula as plain text for speech, e.g. "N O 3 minus". */
  readonly spokenFormula: string;
  readonly category: SpeciesCategory;
  /** 1 simple, 2 multiple bonds and resonance, 3 expanded, incomplete and odd-electron. */
  readonly difficulty: 1 | 2 | 3;
  /** Index of the central atom (the hint "which atom is central"), or null for chains and rings. */
  readonly central: number | null;
  readonly skeleton: StructureData;
};

type SkeletonAtom = readonly [ElementSymbol, number, number];

function skeleton(
  atoms: readonly SkeletonAtom[],
  bonds: readonly (readonly [number, number])[],
  charge = 0,
): StructureData {
  return {
    atoms: atoms.map(([element, x, y]) => ({ element, x, y, lonePairs: 0, unpaired: 0 })),
    bonds: bonds.map(([a, b]) => ({ a, b, order: 1 })),
    charge,
  };
}

/** Angles (degrees, y up) for n terminal atoms drawn around a central atom, textbook style. */
function starAngles(n: number): number[] {
  switch (n) {
    case 1:
      return [0];
    case 2:
      return [180, 0];
    case 3:
      return [90, 210, 330];
    case 4:
      return [90, 180, 270, 0];
    case 5:
      return [90, 162, 234, 306, 18];
    default:
      return Array.from({ length: n }, (_, i) => 90 + (360 * i) / n);
  }
}

/** A central atom (index 0) with terminal atoms around it. */
function star(
  center: ElementSymbol,
  terminals: readonly ElementSymbol[],
  charge = 0,
  angles = starAngles(terminals.length),
) {
  const atoms: SkeletonAtom[] = [[center, 0, 0]];
  terminals.forEach((element, i) => {
    const angle = ((angles[i] ?? 0) * Math.PI) / 180;
    atoms.push([element, round(Math.cos(angle)), round(Math.sin(angle))]);
  });
  return skeleton(
    atoms,
    terminals.map((_, i) => [0, i + 1] as const),
    charge,
  );
}

/** Atoms in a straight line, left to right. */
function line(elements: readonly ElementSymbol[], charge = 0) {
  const offset = (elements.length - 1) / 2;
  return skeleton(
    elements.map((element, i) => [element, i - offset, 0] as const),
    elements.slice(1).map((_, i) => [i, i + 1] as const),
    charge,
  );
}

/** A bent triatomic A–B–C with B central (index 1), drawn as an open V. */
function bent(left: ElementSymbol, center: ElementSymbol, right: ElementSymbol, charge = 0) {
  return skeleton(
    [
      [left, -0.87, -0.5],
      [center, 0, 0],
      [right, 0.87, -0.5],
    ],
    [
      [0, 1],
      [1, 2],
    ],
    charge,
  );
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function benzene(): StructureData {
  const atoms: SkeletonAtom[] = [];
  const bonds: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((90 + 60 * i) * Math.PI) / 180;
    atoms.push(["C", round(Math.cos(angle)), round(Math.sin(angle))]);
  }
  for (let i = 0; i < 6; i++) {
    const angle = ((90 + 60 * i) * Math.PI) / 180;
    atoms.push(["H", round(2 * Math.cos(angle)), round(2 * Math.sin(angle))]);
    bonds.push([i, (i + 1) % 6], [i, i + 6]);
  }
  return skeleton(atoms, bonds);
}

const SPECIES: readonly Species[] = [
  // ── Simple molecules (single bonds, octets) ─────────────────────────────────
  {
    id: "water",
    formula: "H<sub>2</sub>O",
    spokenFormula: "H 2 O",
    category: "simple",
    difficulty: 1,
    central: 1,
    skeleton: bent("H", "O", "H"),
  },
  {
    id: "ammonia",
    formula: "NH<sub>3</sub>",
    spokenFormula: "N H 3",
    category: "simple",
    difficulty: 1,
    central: 0,
    skeleton: star("N", ["H", "H", "H"], 0, [180, 0, 270]),
  },
  {
    id: "methane",
    formula: "CH<sub>4</sub>",
    spokenFormula: "C H 4",
    category: "simple",
    difficulty: 1,
    central: 0,
    skeleton: star("C", ["H", "H", "H", "H"]),
  },
  {
    id: "carbonTetrachloride",
    formula: "CCl<sub>4</sub>",
    spokenFormula: "C Cl 4",
    category: "simple",
    difficulty: 1,
    central: 0,
    skeleton: star("C", ["Cl", "Cl", "Cl", "Cl"]),
  },
  {
    id: "phosphorusTrichloride",
    formula: "PCl<sub>3</sub>",
    spokenFormula: "P Cl 3",
    category: "simple",
    difficulty: 1,
    central: 0,
    skeleton: star("P", ["Cl", "Cl", "Cl"], 0, [180, 0, 270]),
  },
  {
    id: "hydrogenSulfide",
    formula: "H<sub>2</sub>S",
    spokenFormula: "H 2 S",
    category: "simple",
    difficulty: 1,
    central: 1,
    skeleton: bent("H", "S", "H"),
  },
  {
    id: "oxygenDifluoride",
    formula: "OF<sub>2</sub>",
    spokenFormula: "O F 2",
    category: "simple",
    difficulty: 1,
    central: 1,
    skeleton: bent("F", "O", "F"),
  },
  {
    id: "methanol",
    formula: "CH<sub>3</sub>OH",
    spokenFormula: "C H 3 O H",
    category: "simple",
    difficulty: 1,
    central: null,
    skeleton: skeleton(
      [
        ["C", -0.5, 0],
        ["H", -0.5, 1],
        ["H", -1.5, 0],
        ["H", -0.5, -1],
        ["O", 0.5, 0],
        ["H", 1.37, -0.5],
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [4, 5],
      ],
    ),
  },
  {
    id: "hydrazine",
    formula: "N<sub>2</sub>H<sub>4</sub>",
    spokenFormula: "N 2 H 4",
    category: "simple",
    difficulty: 1,
    central: null,
    skeleton: skeleton(
      [
        ["N", -0.5, 0],
        ["N", 0.5, 0],
        ["H", -1.2, 0.71],
        ["H", -1.2, -0.71],
        ["H", 1.2, 0.71],
        ["H", 1.2, -0.71],
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
        [1, 5],
      ],
    ),
  },
  {
    id: "hydrogenPeroxide",
    formula: "H<sub>2</sub>O<sub>2</sub>",
    spokenFormula: "H 2 O 2",
    category: "simple",
    difficulty: 1,
    central: null,
    skeleton: line(["H", "O", "O", "H"]),
  },

  // ── Multiple bonds ──────────────────────────────────────────────────────────
  {
    id: "carbonDioxide",
    formula: "CO<sub>2</sub>",
    spokenFormula: "C O 2",
    category: "multipleBonds",
    difficulty: 2,
    central: 1,
    skeleton: line(["O", "C", "O"]),
  },
  {
    id: "nitrogen",
    formula: "N<sub>2</sub>",
    spokenFormula: "N 2",
    category: "multipleBonds",
    difficulty: 2,
    central: null,
    skeleton: line(["N", "N"]),
  },
  {
    id: "carbonMonoxide",
    formula: "CO",
    spokenFormula: "C O",
    category: "multipleBonds",
    difficulty: 2,
    central: null,
    skeleton: line(["C", "O"]),
  },
  {
    id: "hydrogenCyanide",
    formula: "HCN",
    spokenFormula: "H C N",
    category: "multipleBonds",
    difficulty: 2,
    central: 1,
    skeleton: line(["H", "C", "N"]),
  },
  {
    id: "formaldehyde",
    formula: "CH<sub>2</sub>O",
    spokenFormula: "C H 2 O",
    category: "multipleBonds",
    difficulty: 2,
    central: 0,
    skeleton: star("C", ["O", "H", "H"], 0, [90, 210, 330]),
  },
  {
    id: "ethene",
    formula: "C<sub>2</sub>H<sub>4</sub>",
    spokenFormula: "C 2 H 4",
    category: "multipleBonds",
    difficulty: 2,
    central: null,
    skeleton: skeleton(
      [
        ["C", -0.5, 0],
        ["C", 0.5, 0],
        ["H", -1.2, 0.71],
        ["H", -1.2, -0.71],
        ["H", 1.2, 0.71],
        ["H", 1.2, -0.71],
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
        [1, 5],
      ],
    ),
  },
  {
    id: "ethyne",
    formula: "C<sub>2</sub>H<sub>2</sub>",
    spokenFormula: "C 2 H 2",
    category: "multipleBonds",
    difficulty: 2,
    central: null,
    skeleton: line(["H", "C", "C", "H"]),
  },

  // ── Ions ────────────────────────────────────────────────────────────────────
  {
    id: "ammonium",
    formula: "NH<sub>4</sub><sup>+</sup>",
    spokenFormula: "N H 4 plus",
    category: "ions",
    difficulty: 1,
    central: 0,
    skeleton: star("N", ["H", "H", "H", "H"], 1),
  },
  {
    id: "hydronium",
    formula: "H<sub>3</sub>O<sup>+</sup>",
    spokenFormula: "H 3 O plus",
    category: "ions",
    difficulty: 1,
    central: 0,
    skeleton: star("O", ["H", "H", "H"], 1, [180, 0, 270]),
  },
  {
    id: "hydroxide",
    formula: "OH<sup>−</sup>",
    spokenFormula: "O H minus",
    category: "ions",
    difficulty: 1,
    central: null,
    skeleton: line(["O", "H"], -1),
  },
  {
    id: "hypochlorite",
    formula: "ClO<sup>−</sup>",
    spokenFormula: "Cl O minus",
    category: "ions",
    difficulty: 1,
    central: null,
    skeleton: line(["Cl", "O"], -1),
  },
  {
    id: "cyanide",
    formula: "CN<sup>−</sup>",
    spokenFormula: "C N minus",
    category: "ions",
    difficulty: 2,
    central: null,
    skeleton: line(["C", "N"], -1),
  },
  {
    id: "nitrosonium",
    formula: "NO<sup>+</sup>",
    spokenFormula: "N O plus",
    category: "ions",
    difficulty: 2,
    central: null,
    skeleton: line(["N", "O"], 1),
  },
  {
    id: "tetrafluoroborate",
    formula: "BF<sub>4</sub><sup>−</sup>",
    spokenFormula: "B F 4 minus",
    category: "ions",
    difficulty: 2,
    central: 0,
    skeleton: star("B", ["F", "F", "F", "F"], -1),
  },

  // ── Resonance ───────────────────────────────────────────────────────────────
  {
    id: "ozone",
    formula: "O<sub>3</sub>",
    spokenFormula: "O 3",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: bent("O", "O", "O"),
  },
  {
    id: "nitrate",
    formula: "NO<sub>3</sub><sup>−</sup>",
    spokenFormula: "N O 3 minus",
    category: "resonance",
    difficulty: 2,
    central: 0,
    skeleton: star("N", ["O", "O", "O"], -1),
  },
  {
    id: "nitrite",
    formula: "NO<sub>2</sub><sup>−</sup>",
    spokenFormula: "N O 2 minus",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: bent("O", "N", "O", -1),
  },
  {
    id: "carbonate",
    formula: "CO<sub>3</sub><sup>2−</sup>",
    spokenFormula: "C O 3 2 minus",
    category: "resonance",
    difficulty: 2,
    central: 0,
    skeleton: star("C", ["O", "O", "O"], -2),
  },
  {
    id: "formate",
    formula: "HCO<sub>2</sub><sup>−</sup>",
    spokenFormula: "H C O 2 minus",
    category: "resonance",
    difficulty: 2,
    central: 0,
    skeleton: star("C", ["H", "O", "O"], -1, [180, 30, 330]),
  },
  {
    id: "nitricAcid",
    formula: "HNO<sub>3</sub>",
    spokenFormula: "H N O 3",
    category: "resonance",
    difficulty: 2,
    central: 0,
    skeleton: skeleton(
      [
        ["N", 0, 0],
        ["O", 0, 1],
        ["O", 0.87, -0.5],
        ["O", -0.87, -0.5],
        ["H", -1.73, 0],
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [3, 4],
      ],
    ),
  },
  {
    id: "sulfurDioxide",
    formula: "SO<sub>2</sub>",
    spokenFormula: "S O 2",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: bent("O", "S", "O"),
  },
  {
    id: "sulfurTrioxide",
    formula: "SO<sub>3</sub>",
    spokenFormula: "S O 3",
    category: "resonance",
    difficulty: 2,
    central: 0,
    skeleton: star("S", ["O", "O", "O"]),
  },
  {
    id: "thiocyanate",
    formula: "SCN<sup>−</sup>",
    spokenFormula: "S C N minus",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: line(["S", "C", "N"], -1),
  },
  {
    id: "cyanate",
    formula: "OCN<sup>−</sup>",
    spokenFormula: "O C N minus",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: line(["O", "C", "N"], -1),
  },
  {
    id: "azide",
    formula: "N<sub>3</sub><sup>−</sup>",
    spokenFormula: "N 3 minus",
    category: "resonance",
    difficulty: 2,
    central: 1,
    skeleton: line(["N", "N", "N"], -1),
  },
  {
    id: "benzene",
    formula: "C<sub>6</sub>H<sub>6</sub>",
    spokenFormula: "C 6 H 6",
    category: "resonance",
    difficulty: 2,
    central: null,
    skeleton: benzene(),
  },

  // ── Expanded octets ─────────────────────────────────────────────────────────
  {
    id: "sulfurTetrafluoride",
    formula: "SF<sub>4</sub>",
    spokenFormula: "S F 4",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("S", ["F", "F", "F", "F"]),
  },
  {
    id: "sulfurHexafluoride",
    formula: "SF<sub>6</sub>",
    spokenFormula: "S F 6",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("S", ["F", "F", "F", "F", "F", "F"]),
  },
  {
    id: "phosphorusPentachloride",
    formula: "PCl<sub>5</sub>",
    spokenFormula: "P Cl 5",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("P", ["Cl", "Cl", "Cl", "Cl", "Cl"]),
  },
  {
    id: "chlorineTrifluoride",
    formula: "ClF<sub>3</sub>",
    spokenFormula: "Cl F 3",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("Cl", ["F", "F", "F"], 0, [180, 0, 270]),
  },
  {
    id: "xenonDifluoride",
    formula: "XeF<sub>2</sub>",
    spokenFormula: "Xe F 2",
    category: "expanded",
    difficulty: 3,
    central: 1,
    skeleton: line(["F", "Xe", "F"]),
  },
  {
    id: "xenonTetrafluoride",
    formula: "XeF<sub>4</sub>",
    spokenFormula: "Xe F 4",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("Xe", ["F", "F", "F", "F"]),
  },
  {
    id: "triiodide",
    formula: "I<sub>3</sub><sup>−</sup>",
    spokenFormula: "I 3 minus",
    category: "expanded",
    difficulty: 3,
    central: 1,
    skeleton: line(["I", "I", "I"], -1),
  },
  {
    id: "sulfate",
    formula: "SO<sub>4</sub><sup>2−</sup>",
    spokenFormula: "S O 4 2 minus",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("S", ["O", "O", "O", "O"], -2),
  },
  {
    id: "phosphate",
    formula: "PO<sub>4</sub><sup>3−</sup>",
    spokenFormula: "P O 4 3 minus",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("P", ["O", "O", "O", "O"], -3),
  },
  {
    id: "perchlorate",
    formula: "ClO<sub>4</sub><sup>−</sup>",
    spokenFormula: "Cl O 4 minus",
    category: "expanded",
    difficulty: 3,
    central: 0,
    skeleton: star("Cl", ["O", "O", "O", "O"], -1),
  },

  // ── Incomplete octets ───────────────────────────────────────────────────────
  {
    id: "boronTrifluoride",
    formula: "BF<sub>3</sub>",
    spokenFormula: "B F 3",
    category: "incomplete",
    difficulty: 3,
    central: 0,
    skeleton: star("B", ["F", "F", "F"]),
  },
  {
    id: "berylliumChloride",
    formula: "BeCl<sub>2</sub>",
    spokenFormula: "Be Cl 2",
    category: "incomplete",
    difficulty: 3,
    central: 1,
    skeleton: line(["Cl", "Be", "Cl"]),
  },
  {
    id: "aluminumChloride",
    formula: "AlCl<sub>3</sub>",
    spokenFormula: "Al Cl 3",
    category: "incomplete",
    difficulty: 3,
    central: 0,
    skeleton: star("Al", ["Cl", "Cl", "Cl"]),
  },

  // ── Odd-electron molecules ──────────────────────────────────────────────────
  {
    id: "nitricOxide",
    formula: "NO",
    spokenFormula: "N O",
    category: "radicals",
    difficulty: 3,
    central: null,
    skeleton: line(["N", "O"]),
  },
  {
    id: "nitrogenDioxide",
    formula: "NO<sub>2</sub>",
    spokenFormula: "N O 2",
    category: "radicals",
    difficulty: 3,
    central: 1,
    skeleton: bent("O", "N", "O"),
  },
  {
    id: "chlorineDioxide",
    formula: "ClO<sub>2</sub>",
    spokenFormula: "Cl O 2",
    category: "radicals",
    difficulty: 3,
    central: 1,
    skeleton: bent("O", "Cl", "O"),
  },
];

export function getAllSpecies(): readonly Species[] {
  return SPECIES;
}

export function getSpecies(id: string): Species {
  const species = SPECIES.find((s) => s.id === id);
  if (!species) {
    throw new Error(`unknown species: ${id}`);
  }
  return species;
}

export function getSpeciesInCategory(category: SpeciesCategory): readonly Species[] {
  return SPECIES.filter((s) => s.category === category);
}
