/**
 * vsepr.test.ts
 *
 * VSEPR classes of the generated best structures, and the ideal directions of the 3D preview:
 * bond angles of each polyhedron and where lone pairs go.
 */

import { describe, expect, it } from "vitest";
import { generateStructures } from "../../src/common/model/generateStructures.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";
import { getSpecies } from "../../src/common/model/SpeciesCatalog.js";
import { idealDirections, singleCenter, type Vec3, vseprCenters } from "../../src/common/model/vsepr.js";

const centerOf = (id: string) => {
  const best = generateStructures(getSpecies(id).skeleton, OctetPolicy.ACCEPT_BOTH).best[0];
  return best ? singleCenter(best.data) : null;
};

const angle = (a: Vec3, b: Vec3) =>
  (Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) * 180) / Math.PI;

describe("vseprCenters", () => {
  it.each([
    ["methane", "AX4", "tetrahedral", "tetrahedral"],
    ["ammonia", "AX3E", "tetrahedral", "trigonalPyramidal"],
    ["water", "AX2E2", "tetrahedral", "bent"],
    ["carbonDioxide", "AX2", "linear", "linear"],
    ["boronTrifluoride", "AX3", "trigonalPlanar", "trigonalPlanar"],
    ["nitrate", "AX3", "trigonalPlanar", "trigonalPlanar"],
    ["ozone", "AX2E", "trigonalPlanar", "bent"],
    ["nitrogenDioxide", "AX2E", "trigonalPlanar", "bent"],
    ["phosphorusPentachloride", "AX5", "trigonalBipyramidal", "trigonalBipyramidal"],
    ["sulfurTetrafluoride", "AX4E", "trigonalBipyramidal", "seesaw"],
    ["chlorineTrifluoride", "AX3E2", "trigonalBipyramidal", "tShaped"],
    ["xenonDifluoride", "AX2E3", "trigonalBipyramidal", "linear"],
    ["triiodide", "AX2E3", "trigonalBipyramidal", "linear"],
    ["sulfurHexafluoride", "AX6", "octahedral", "octahedral"],
    ["xenonTetrafluoride", "AX4E2", "octahedral", "squarePlanar"],
    ["sulfate", "AX4", "tetrahedral", "tetrahedral"],
  ])("%s is %s: %s electron geometry, %s", (id, notation, electron, molecular) => {
    const center = centerOf(id);
    expect(center?.notation).toBe(notation);
    expect(center?.electronGeometry).toBe(electron);
    expect(center?.molecularGeometry).toBe(molecular);
  });

  it("finds every centre of a chain (ethene: two trigonal-planar carbons) and no single centre", () => {
    const best = generateStructures(getSpecies("ethene").skeleton, OctetPolicy.ACCEPT_BOTH).best[0];
    const data = best?.data ?? { atoms: [], bonds: [], charge: 0 };
    expect(vseprCenters(data).map((c) => c.molecularGeometry)).toEqual(["trigonalPlanar", "trigonalPlanar"]);
    expect(singleCenter(data)).toBeNull();
  });
});

describe("idealDirections", () => {
  it("gives 109.5° in a tetrahedron, 120° in a trigonal plane, 90° and 180° in an octahedron", () => {
    const ch4 = idealDirections(centerOf("methane") ?? ({} as never)).bonds;
    expect(angle(ch4[0] as Vec3, ch4[1] as Vec3)).toBeCloseTo(109.5, 0);
    const bf3 = idealDirections(centerOf("boronTrifluoride") ?? ({} as never)).bonds;
    expect(angle(bf3[0] as Vec3, bf3[1] as Vec3)).toBeCloseTo(120, 0);
    const sf6 = idealDirections(centerOf("sulfurHexafluoride") ?? ({} as never)).bonds;
    const angles = sf6.slice(1).map((d) => Math.round(angle(sf6[0] as Vec3, d)));
    expect(angles.sort((a, b) => a - b)).toEqual([90, 90, 90, 90, 180]);
  });

  it("puts lone pairs equatorial in a trigonal bipyramid and trans in an octahedron", () => {
    const xef2 = idealDirections(centerOf("xenonDifluoride") ?? ({} as never));
    expect(angle(xef2.bonds[0] as Vec3, xef2.bonds[1] as Vec3)).toBeCloseTo(180, 0);
    const xef4 = idealDirections(centerOf("xenonTetrafluoride") ?? ({} as never));
    expect(angle(xef4.lonePairs[0] as Vec3, xef4.lonePairs[1] as Vec3)).toBeCloseTo(180, 0);
    const sf4 = idealDirections(centerOf("sulfurTetrafluoride") ?? ({} as never));
    // The seesaw's lone pair is equatorial: 90° from both axial bonds.
    expect(angle(sf4.lonePairs[0] as Vec3, { x: 0, y: 1, z: 0 })).toBeCloseTo(90, 0);
  });
});
