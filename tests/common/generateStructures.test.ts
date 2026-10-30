/**
 * generateStructures.test.ts
 *
 * The generated answers against textbook Lewis structures (OpenStax Chemistry 2e §7.3–7.4), the
 * expanded-octet policies, and invariants that must hold for every species in the catalog.
 */

import { describe, expect, it } from "vitest";
import { analyzeStructure } from "../../src/common/model/analyzeStructure.js";
import { generateStructures, type ScoredStructure } from "../../src/common/model/generateStructures.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";
import { getAllSpecies, getSpecies } from "../../src/common/model/SpeciesCatalog.js";
import { bondOrderBetween, type StructureData } from "../../src/common/model/StructureData.js";

const best = (id: string, policy = OctetPolicy.ACCEPT_BOTH) => generateStructures(getSpecies(id).skeleton, policy).best;

/** Bond orders from the central atom (index `center`) to each other atom, sorted descending. */
function ordersFrom(data: StructureData, center: number): number[] {
  return data.atoms
    .map((_, i) => (i === center ? 0 : bondOrderBetween(data, center, i)))
    .filter((order) => order > 0)
    .sort((a, b) => b - a);
}

function only(structures: readonly ScoredStructure[]): ScoredStructure {
  expect(structures).toHaveLength(1);
  return structures[0] as ScoredStructure;
}

describe("generateStructures: textbook answers", () => {
  it("CO2 has two double bonds and no formal charges", () => {
    const co2 = only(best("carbonDioxide"));
    expect(ordersFrom(co2.data, 1)).toEqual([2, 2]);
    expect(co2.formalCharges).toEqual([0, 0, 0]);
  });

  it("HCN has a C≡N triple bond and one lone pair on N", () => {
    const hcn = only(best("hydrogenCyanide"));
    expect(bondOrderBetween(hcn.data, 1, 2)).toBe(3);
    expect(hcn.data.atoms[2]?.lonePairs).toBe(1);
  });

  it("CO is C≡O with −1 on C and +1 on O", () => {
    expect(only(best("carbonMonoxide")).formalCharges).toEqual([-1, 1]);
  });

  it("O3 has two equivalent resonance forms with +1 on the central O", () => {
    const forms = best("ozone");
    expect(forms).toHaveLength(2);
    for (const form of forms) {
      expect(form.formalCharges[1]).toBe(1);
      expect(ordersFrom(form.data, 1)).toEqual([2, 1]);
    }
  });

  it("NO3− and CO3²− have three equivalent forms with one double bond each", () => {
    for (const id of ["nitrate", "carbonate"]) {
      const forms = best(id);
      expect(forms).toHaveLength(3);
      for (const form of forms) {
        expect(ordersFrom(form.data, 0)).toEqual([2, 1, 1]);
      }
    }
  });

  it("benzene has the two Kekulé structures", () => {
    const forms = best("benzene");
    expect(forms).toHaveLength(2);
    for (const form of forms) {
      const ringOrders = [0, 1, 2, 3, 4, 5].map((i) => bondOrderBetween(form.data, i, (i + 1) % 6));
      expect(ringOrders.filter((o) => o === 2)).toHaveLength(3);
    }
  });

  it("SCN− puts −1 on N (the more electronegative end); the S−1 form is acceptable", () => {
    const set = generateStructures(getSpecies("thiocyanate").skeleton, OctetPolicy.ACCEPT_BOTH);
    expect(only(set.best).formalCharges).toEqual([0, 0, -1]);
    expect(set.acceptable.map((s) => s.formalCharges)).toEqual([[-1, 0, 0]]);
  });

  it("OCN− puts −1 on O", () => {
    expect(only(best("cyanate")).formalCharges).toEqual([-1, 0, 0]);
  });

  it("N3− prefers N=N=N over forms with −2 on one atom", () => {
    const azide = only(best("azide"));
    expect(azide.formalCharges).toEqual([-1, 1, -1]);
    expect(ordersFrom(azide.data, 1)).toEqual([2, 2]);
  });

  it("BF3, BeCl2 and AlCl3 keep the incomplete octet with zero formal charges", () => {
    for (const id of ["boronTrifluoride", "berylliumChloride", "aluminumChloride"]) {
      const structure = only(best(id));
      expect(structure.absoluteSum).toBe(0);
      expect(structure.data.bonds.every((bond) => bond.order === 1)).toBe(true);
    }
  });

  it("SF6, PCl5, XeF4, XeF2 and I3− expand the central atom under every policy", () => {
    const expected: [string, number, number][] = [
      ["sulfurHexafluoride", 0, 12],
      ["phosphorusPentachloride", 0, 10],
      ["xenonTetrafluoride", 0, 12],
      ["xenonDifluoride", 1, 10],
      ["triiodide", 1, 10],
      ["sulfurTetrafluoride", 0, 10],
      ["chlorineTrifluoride", 0, 10],
    ];
    for (const policy of OctetPolicy.enumeration.values) {
      for (const [id, center, electrons] of expected) {
        const structure = only(best(id, policy));
        expect(analyzeStructure(structure.data).atoms[center]?.electrons).toBe(electrons);
      }
    }
  });

  it("NO and NO2 put the unpaired electron on N; ClO2 on Cl", () => {
    expect(only(best("nitricOxide")).data.atoms[0]?.unpaired).toBe(1);
    for (const form of best("nitrogenDioxide")) {
      expect(form.data.atoms[1]?.unpaired).toBe(1);
    }
    expect(only(best("chlorineDioxide")).data.atoms[1]?.unpaired).toBe(1);
  });
});

describe("generateStructures: expanded-octet policies", () => {
  it("SO4²− is two S=O when minimising formal charge, four S–O when octet first", () => {
    const minimised = best("sulfate", OctetPolicy.MINIMIZE_FORMAL_CHARGE);
    expect(minimised).toHaveLength(6);
    expect(ordersFrom(minimised[0]?.data as StructureData, 0)).toEqual([2, 2, 1, 1]);

    const octet = only(best("sulfate", OctetPolicy.OCTET_FIRST));
    expect(ordersFrom(octet.data, 0)).toEqual([1, 1, 1, 1]);
    expect(octet.formalCharges[0]).toBe(2);
  });

  it("ACCEPT_BOTH keeps the minimum-formal-charge set as best and the octet form as an alternative", () => {
    const set = generateStructures(getSpecies("sulfate").skeleton, OctetPolicy.ACCEPT_BOTH);
    expect(set.best).toHaveLength(6);
    expect(set.alternatives).toHaveLength(1);
    expect(ordersFrom(set.alternatives[0]?.data as StructureData, 0)).toEqual([1, 1, 1, 1]);
  });

  it("PO4³− has one P=O (four forms) or four P–O", () => {
    expect(best("phosphate", OctetPolicy.MINIMIZE_FORMAL_CHARGE)).toHaveLength(4);
    expect(ordersFrom(only(best("phosphate", OctetPolicy.OCTET_FIRST)).data, 0)).toEqual([1, 1, 1, 1]);
  });

  it("SO2 is O=S=O or the two octet forms", () => {
    expect(ordersFrom(only(best("sulfurDioxide", OctetPolicy.MINIMIZE_FORMAL_CHARGE)).data, 1)).toEqual([2, 2]);
    expect(best("sulfurDioxide", OctetPolicy.OCTET_FIRST)).toHaveLength(2);
  });
});

describe("generateStructures: every species", () => {
  for (const species of getAllSpecies()) {
    it(`${species.id}: best structures are complete, charge-balanced and unique`, () => {
      for (const policy of OctetPolicy.enumeration.values) {
        const set = generateStructures(species.skeleton, policy);
        expect(set.truncated).toBe(false);
        expect(set.best.length).toBeGreaterThan(0);
        for (const structure of set.all) {
          const analysis = analyzeStructure(structure.data);
          expect(analysis.complete).toBe(true);
          expect(analysis.formalChargeSum).toBe(species.skeleton.charge);
        }
      }
    });
  }

  it("difficulty matches the category", () => {
    for (const species of getAllSpecies()) {
      if (species.category === "expanded" || species.category === "incomplete" || species.category === "radicals") {
        expect(species.difficulty).toBe(3);
      }
    }
  });
});
