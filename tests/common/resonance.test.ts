/**
 * resonance.test.ts
 *
 * Curved arrows between resonance forms, the hybrid's average bond orders and charges, and the
 * gallery of forms shown on the Resonance screen.
 */

import { describe, expect, it } from "vitest";
import { generateStructures } from "../../src/common/model/generateStructures.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";
import { resonanceArrows, resonanceGallery, resonanceHybrid } from "../../src/common/model/resonance.js";
import { getSpecies } from "../../src/common/model/SpeciesCatalog.js";

const setOf = (id: string, policy = OctetPolicy.ACCEPT_BOTH) => generateStructures(getSpecies(id).skeleton, policy);

describe("resonanceArrows", () => {
  it("NO3−: a lone pair on O forms the new π bond and the old π pair returns to its O", () => {
    const [first, second] = setOf("nitrate").best;
    const arrows = resonanceArrows(
      first?.data ?? { atoms: [], bonds: [], charge: 0 },
      second?.data ?? { atoms: [], bonds: [], charge: 0 },
    );
    expect(arrows).toHaveLength(2);
    expect(arrows.map((a) => `${a.from.kind}→${a.to.kind}`).sort((x, y) => x.localeCompare(y))).toEqual([
      "bond→lonePair",
      "lonePair→bond",
    ]);
  });

  it("benzene: three π pairs slide bond to bond", () => {
    const [first, second] = setOf("benzene").best;
    const arrows = resonanceArrows(
      first?.data ?? { atoms: [], bonds: [], charge: 0 },
      second?.data ?? { atoms: [], bonds: [], charge: 0 },
    );
    expect(arrows).toHaveLength(3);
    expect(arrows.every((a) => a.from.kind === "bond" && a.to.kind === "bond")).toBe(true);
  });

  it("every pair of best forms is connected by arrows that account for every change", () => {
    for (const id of ["ozone", "nitrate", "carbonate", "formate", "nitrite", "nitricAcid", "nitrogenDioxide"]) {
      const forms = setOf(id).best;
      for (let i = 0; i + 1 < forms.length; i++) {
        const from = forms[i]?.data;
        const to = forms[i + 1]?.data;
        if (from && to) {
          const changes = from.bonds.reduce(
            (sum, bond, k) => sum + Math.abs((to.bonds[k]?.order ?? 0) - bond.order),
            0,
          );
          // Each arrow moves one pair and changes one bond order by one at one or both ends.
          expect(resonanceArrows(from, to).length).toBe(changes);
        }
      }
    }
  });
});

describe("resonanceHybrid", () => {
  it("NO3− has bond order 4/3 and −2/3 on each O", () => {
    const hybrid = resonanceHybrid(setOf("nitrate").best);
    for (const order of hybrid.bondOrders) {
      expect(order).toBeCloseTo(4 / 3);
    }
    expect(hybrid.formalCharges[0]).toBeCloseTo(1);
    for (const charge of hybrid.formalCharges.slice(1)) {
      expect(charge).toBeCloseTo(-2 / 3);
    }
  });

  it("benzene's ring bonds average 1.5; O3's bonds average 1.5 with −½ on each end", () => {
    const benzene = resonanceHybrid(setOf("benzene").best);
    const ring = benzene.bondOrders.filter((order) => order > 1);
    expect(ring).toHaveLength(6);
    for (const order of ring) {
      expect(order).toBeCloseTo(1.5);
    }
    const ozone = resonanceHybrid(setOf("ozone").best);
    expect(ozone.formalCharges).toEqual([-0.5, 1, -0.5]);
  });

  it("SO4²− (minimum formal charge) averages S–O to 1.5 and −½ on each O", () => {
    const hybrid = resonanceHybrid(setOf("sulfate", OctetPolicy.MINIMIZE_FORMAL_CHARGE).best);
    for (const order of hybrid.bondOrders) {
      expect(order).toBeCloseTo(1.5);
    }
  });
});

describe("resonanceGallery", () => {
  it("lists every best form first, then distinct alternatives and minor forms", () => {
    const nitrate = resonanceGallery(setOf("nitrate"));
    expect(nitrate.filter((f) => f.rank === "equivalent")).toHaveLength(3);

    const thiocyanate = resonanceGallery(setOf("thiocyanate"));
    expect(thiocyanate.map((f) => f.rank)).toEqual(["major", "acceptable", "minor"]);

    const sulfate = resonanceGallery(setOf("sulfate"));
    expect(sulfate.length).toBeLessThanOrEqual(9);
    expect(sulfate.filter((f) => f.rank === "alternative")).toHaveLength(1);
    // The four acceptable forms of SO4²− are symmetry copies: only one is shown.
    expect(sulfate.filter((f) => f.rank === "acceptable")).toHaveLength(1);
  });
});
