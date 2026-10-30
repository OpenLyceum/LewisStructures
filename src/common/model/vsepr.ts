/**
 * vsepr.ts
 *
 * VSEPR geometry from a finished Lewis structure. Each atom bonded to two or more others is a
 * centre; its electron domains are its bonded neighbours (a multiple bond counts once) plus its lone
 * pairs, plus one for an unpaired electron (so NO₂ comes out bent). The steric number fixes the
 * electron geometry and the number of lone pairs the molecular geometry, in AXₙEₘ notation.
 *
 * `idealDirections` places the domains on the textbook polyhedron for the 3D preview. Lone pairs
 * take the positions that keep them farthest from bonds and from each other: equatorial in a
 * trigonal bipyramid (SF₄ seesaw, ClF₃ T-shape, XeF₂ linear) and trans in an octahedron (XeF₄
 * square planar).
 */

import { neighborLists, type StructureData } from "./StructureData.js";

export type ElectronGeometry = "linear" | "trigonalPlanar" | "tetrahedral" | "trigonalBipyramidal" | "octahedral";

export type MolecularGeometry =
  | "linear"
  | "trigonalPlanar"
  | "bent"
  | "tetrahedral"
  | "trigonalPyramidal"
  | "trigonalBipyramidal"
  | "seesaw"
  | "tShaped"
  | "octahedral"
  | "squarePyramidal"
  | "squarePlanar";

/** Ideal bond angles as shown to students: exact where the geometry fixes them, "<" where lone pairs squeeze them. */
export type AngleText =
  | "180"
  | "120"
  | "lessThan120"
  | "109.5"
  | "lessThan109.5"
  | "90And120"
  | "lessThan90And120"
  | "lessThan90"
  | "90";

export type VseprCenter = {
  readonly atom: number;
  readonly bonded: readonly number[];
  readonly lonePairs: number;
  /** Electron domains: bonded atoms + lone pairs + an unpaired electron. */
  readonly stericNumber: number;
  /** "AX3E", "AX4E2", … */
  readonly notation: string;
  readonly electronGeometry: ElectronGeometry;
  readonly molecularGeometry: MolecularGeometry;
  readonly angles: AngleText;
};

const ELECTRON_GEOMETRIES: Record<number, ElectronGeometry> = {
  2: "linear",
  3: "trigonalPlanar",
  4: "tetrahedral",
  5: "trigonalBipyramidal",
  6: "octahedral",
};

/** Molecular geometry and angles by "steric number / nonbonding domains". */
const SHAPES: Record<string, [MolecularGeometry, AngleText]> = {
  "2/0": ["linear", "180"],
  "3/0": ["trigonalPlanar", "120"],
  "3/1": ["bent", "lessThan120"],
  "4/0": ["tetrahedral", "109.5"],
  "4/1": ["trigonalPyramidal", "lessThan109.5"],
  "4/2": ["bent", "lessThan109.5"],
  "5/0": ["trigonalBipyramidal", "90And120"],
  "5/1": ["seesaw", "lessThan90And120"],
  "5/2": ["tShaped", "lessThan90"],
  "5/3": ["linear", "180"],
  "6/0": ["octahedral", "90"],
  "6/1": ["squarePyramidal", "lessThan90"],
  "6/2": ["squarePlanar", "90"],
};

/** The VSEPR description of every atom with two or more bonded neighbours. */
export function vseprCenters(data: StructureData): VseprCenter[] {
  const neighbors = neighborLists(data);
  const centers: VseprCenter[] = [];
  data.atoms.forEach((atom, i) => {
    const bonded = neighbors[i] ?? [];
    if (bonded.length < 2) {
      return;
    }
    const nonbonding = atom.lonePairs + atom.unpaired;
    const stericNumber = bonded.length + nonbonding;
    const electronGeometry = ELECTRON_GEOMETRIES[stericNumber];
    const shape = SHAPES[`${stericNumber}/${nonbonding}`];
    if (!(electronGeometry && shape)) {
      return;
    }
    centers.push({
      atom: i,
      bonded,
      lonePairs: nonbonding,
      stericNumber,
      notation: `AX${bonded.length}${nonbonding === 0 ? "" : nonbonding === 1 ? "E" : `E${nonbonding}`}`,
      electronGeometry,
      molecularGeometry: shape[0],
      angles: shape[1],
    });
  });
  return centers;
}

/** The centre when every other atom is bonded only to it (SF₄, NH₃, CO₃²⁻), else null. */
export function singleCenter(data: StructureData): VseprCenter | null {
  const centers = vseprCenters(data);
  const only = centers[0];
  return centers.length === 1 && only && only.bonded.length === data.atoms.length - 1 ? only : null;
}

export type Vec3 = { readonly x: number; readonly y: number; readonly z: number };

function normalize(x: number, y: number, z: number): Vec3 {
  const length = Math.hypot(x, y, z);
  return { x: x / length, y: y / length, z: z / length };
}

const SQRT3_2 = Math.sqrt(3) / 2;

/** Domain directions for each steric number, in the order lone pairs prefer them last-to-first. */
const POLYHEDRA: Record<number, { readonly directions: readonly Vec3[]; readonly lonePairOrder: readonly number[] }> = {
  2: { directions: [normalize(1, 0, 0), normalize(-1, 0, 0)], lonePairOrder: [0, 1] },
  3: {
    directions: [normalize(0, 1, 0), normalize(-SQRT3_2, -0.5, 0), normalize(SQRT3_2, -0.5, 0)],
    lonePairOrder: [0, 1, 2],
  },
  4: {
    directions: [
      normalize(0, 1, 0),
      normalize(0.943, -0.333, 0),
      normalize(-0.471, -0.333, 0.816),
      normalize(-0.471, -0.333, -0.816),
    ],
    lonePairOrder: [0, 1, 2, 3],
  },
  5: {
    // Axial up and down, then three equatorial; lone pairs go equatorial first.
    directions: [
      normalize(0, 1, 0),
      normalize(0, -1, 0),
      normalize(1, 0, 0),
      normalize(-0.5, 0, SQRT3_2),
      normalize(-0.5, 0, -SQRT3_2),
    ],
    lonePairOrder: [2, 3, 4, 0, 1],
  },
  6: {
    // Lone pairs take +z then −z: trans to each other.
    directions: [
      normalize(0, 0, 1),
      normalize(0, 0, -1),
      normalize(1, 0, 0),
      normalize(-1, 0, 0),
      normalize(0, 1, 0),
      normalize(0, -1, 0),
    ],
    lonePairOrder: [0, 1, 2, 3, 4, 5],
  },
};

/** Unit directions for a centre's bonded atoms (in `bonded` order) and its lone pairs. */
export function idealDirections(center: VseprCenter): { bonds: Vec3[]; lonePairs: Vec3[] } {
  const polyhedron = POLYHEDRA[center.stericNumber];
  if (!polyhedron) {
    return { bonds: [], lonePairs: [] };
  }
  const lonePairSlots = polyhedron.lonePairOrder.slice(0, center.lonePairs);
  const lonePairs = lonePairSlots.map((slot) => polyhedron.directions[slot] as Vec3);
  const bonds = polyhedron.directions.filter((_, slot) => !lonePairSlots.includes(slot));
  return { bonds, lonePairs };
}
