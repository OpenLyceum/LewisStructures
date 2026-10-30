/**
 * analyzeStructure.test.ts
 *
 * Electron bookkeeping and octet statuses on hand-built drawings, and the graph comparisons used to
 * check a drawing against the generated answers.
 */

import { describe, expect, it } from "vitest";
import { analyzeStructure } from "../../src/common/model/analyzeStructure.js";
import { sameSkeleton, sameStructure } from "../../src/common/model/moleculeGraph.js";
import { OctetStatus } from "../../src/common/model/OctetStatus.js";
import type { AtomData, StructureData } from "../../src/common/model/StructureData.js";

const atom = (element: AtomData["element"], lonePairs = 0, unpaired = 0, x = 0, y = 0): AtomData => ({
  element,
  x,
  y,
  lonePairs,
  unpaired,
});

/** Water drawn H–O–H with `oxygenPairs` lone pairs on O. */
const water = (oxygenPairs: number): StructureData => ({
  atoms: [atom("H"), atom("O", oxygenPairs), atom("H")],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
  ],
  charge: 0,
});

describe("analyzeStructure", () => {
  it("counts the valence electrons and what is left to place", () => {
    const analysis = analyzeStructure(water(1));
    expect(analysis.totalValence).toBe(8);
    expect(analysis.placed).toBe(6);
    expect(analysis.remaining).toBe(2);
    expect(analysis.complete).toBe(false);
    expect(analysis.atoms[1]?.status).toBe(OctetStatus.SHORT);
  });

  it("finishes water with two lone pairs, duets on H and zero formal charges", () => {
    const analysis = analyzeStructure(water(2));
    expect(analysis.remaining).toBe(0);
    expect(analysis.complete).toBe(true);
    expect(analysis.atoms.map((a) => a.status)).toEqual([OctetStatus.DUET, OctetStatus.OCTET, OctetStatus.DUET]);
    expect(analysis.atoms.map((a) => a.formalCharge)).toEqual([0, 0, 0]);
  });

  it("flags too many electrons and an over-full oxygen", () => {
    const analysis = analyzeStructure(water(3));
    expect(analysis.remaining).toBe(-2);
    expect(analysis.atoms[1]?.status).toBe(OctetStatus.OVER);
  });

  it("subtracts the charge from the electron total (NO3− has 24)", () => {
    const nitrate: StructureData = {
      atoms: [atom("N"), atom("O", 2), atom("O", 3), atom("O", 3)],
      bonds: [
        { a: 0, b: 1, order: 2 },
        { a: 0, b: 2, order: 1 },
        { a: 0, b: 3, order: 1 },
      ],
      charge: -1,
    };
    const analysis = analyzeStructure(nitrate);
    expect(analysis.totalValence).toBe(24);
    expect(analysis.complete).toBe(true);
    expect(analysis.atoms.map((a) => a.formalCharge)).toEqual([1, 0, -1, -1]);
    expect(analysis.formalChargeSum).toBe(-1);
  });

  it("allows B with six and expanded S, but not expanded N", () => {
    const bf3: StructureData = {
      atoms: [atom("B"), atom("F", 3), atom("F", 3), atom("F", 3)],
      bonds: [1, 2, 3].map((b) => ({ a: 0, b, order: 1 })),
      charge: 0,
    };
    expect(analyzeStructure(bf3).atoms[0]?.status).toBe(OctetStatus.INCOMPLETE_ALLOWED);
    expect(analyzeStructure(bf3).complete).toBe(true);

    const sf4: StructureData = {
      atoms: [atom("S", 1), atom("F", 3), atom("F", 3), atom("F", 3), atom("F", 3)],
      bonds: [1, 2, 3, 4].map((b) => ({ a: 0, b, order: 1 })),
      charge: 0,
    };
    expect(analyzeStructure(sf4).atoms[0]?.status).toBe(OctetStatus.EXPANDED);

    const nf4: StructureData = { ...sf4, atoms: [atom("N", 1), ...sf4.atoms.slice(1)] };
    expect(analyzeStructure(nf4).atoms[0]?.status).toBe(OctetStatus.OVER);
  });

  it("expects exactly one unpaired electron for an odd total (NO)", () => {
    const no = (nPairs: number, nUnpaired: number): StructureData => ({
      atoms: [atom("N", nPairs, nUnpaired), atom("O", 2)],
      bonds: [{ a: 0, b: 1, order: 2 }],
      charge: 0,
    });
    const radical = analyzeStructure(no(1, 1));
    expect(radical.expectedUnpaired).toBe(1);
    expect(radical.atoms[0]?.status).toBe(OctetStatus.RADICAL);
    expect(radical.complete).toBe(true);
    expect(analyzeStructure(no(1, 0)).complete).toBe(false);
  });

  it("requires a connected drawing", () => {
    const apart: StructureData = { atoms: [atom("H", 0, 1), atom("H", 0, 1)], bonds: [], charge: 0 };
    expect(analyzeStructure(apart).connected).toBe(false);
    expect(analyzeStructure(apart).complete).toBe(false);
  });
});

describe("moleculeGraph", () => {
  const nitrateForm = (doubleTo: number, order: number[] = [0, 1, 2, 3]): StructureData => {
    const atoms = [atom("N"), atom("O", 3), atom("O", 3), atom("O", 3)].map((a, i) =>
      i === doubleTo ? { ...a, lonePairs: 2 } : a,
    );
    const permuted = order.map((i) => atoms[i] as AtomData);
    const index = (i: number) => order.indexOf(i);
    return {
      atoms: permuted,
      bonds: [1, 2, 3].map((o) => ({ a: index(0), b: index(o), order: o === doubleTo ? 2 : 1 })),
      charge: -1,
    };
  };

  it("matches regardless of atom order and position", () => {
    const moved = { ...nitrateForm(1), atoms: nitrateForm(1).atoms.map((a) => ({ ...a, x: a.x + 5 })) };
    expect(sameStructure(nitrateForm(1), nitrateForm(2, [3, 1, 0, 2]))).toBe(true);
    expect(sameStructure(nitrateForm(1), moved)).toBe(true);
  });

  it("tells apart different lone pairs, bond orders and charges", () => {
    const wrong = {
      ...nitrateForm(1),
      atoms: nitrateForm(1).atoms.map((a, i) => (i === 2 ? { ...a, lonePairs: 2 } : a)),
    };
    expect(sameStructure(nitrateForm(1), wrong)).toBe(false);
    expect(sameStructure(nitrateForm(1), { ...nitrateForm(1), charge: 0 })).toBe(false);
  });

  it("compares skeletons: H–C–N is not C–H–N", () => {
    const hcn: StructureData = {
      atoms: [atom("H"), atom("C"), atom("N")],
      bonds: [
        { a: 0, b: 1, order: 1 },
        { a: 1, b: 2, order: 3 },
      ],
      charge: 0,
    };
    const chn: StructureData = { ...hcn, atoms: [atom("C"), atom("H"), atom("N")] };
    expect(sameSkeleton(hcn, { ...hcn, bonds: hcn.bonds.map((b) => ({ ...b, order: 1 })) })).toBe(true);
    expect(sameSkeleton(hcn, chn)).toBe(false);
  });
});
