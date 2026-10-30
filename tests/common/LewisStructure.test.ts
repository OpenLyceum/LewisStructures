/**
 * LewisStructure.test.ts
 *
 * The editable drawing (edits, live analysis, undo/redo keeping atom identity) and the answer check.
 */

import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { checkAgainstSpecies, checkFreeBuild, isCorrect } from "../../src/common/model/checkStructure.js";
import { generateStructures } from "../../src/common/model/generateStructures.js";
import { LewisStructure } from "../../src/common/model/LewisStructure.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";
import { getSpecies } from "../../src/common/model/SpeciesCatalog.js";
import { structureKey } from "../../src/common/model/StructureData.js";

/** Draws water by hand: O with two H, then `pairs` lone pairs on O. */
function drawWater(structure: LewisStructure, pairs = 2) {
  const o = structure.addAtom("O", new Vector2(0, 0));
  const h1 = structure.addAtom("H", new Vector2(-1, 0));
  const h2 = structure.addAtom("H", new Vector2(1, 0));
  structure.setBondOrder(o, h1, 1);
  structure.setBondOrder(o, h2, 1);
  for (let i = 0; i < pairs; i++) {
    structure.addLonePair(o);
  }
  return { o, h1, h2 };
}

describe("LewisStructure", () => {
  it("updates the analysis after every edit", () => {
    const structure = new LewisStructure();
    const { o } = drawWater(structure, 1);
    expect(structure.analysisProperty.value.remaining).toBe(2);
    structure.addLonePair(o);
    expect(structure.analysisProperty.value.complete).toBe(true);
  });

  it("cycles bond orders 1 → 2 → 3 → 1 and removes with order 0", () => {
    const structure = new LewisStructure();
    const c = structure.addAtom("C", Vector2.ZERO);
    const o = structure.addAtom("O", new Vector2(1, 0));
    structure.setBondOrder(c, o, 1);
    const bond = structure.bondBetween(c, o);
    expect(bond).not.toBeNull();
    const orders = [1, 2, 3].map(() => {
      structure.cycleBondOrder(bond as NonNullable<typeof bond>);
      return bond?.order;
    });
    expect(orders).toEqual([2, 3, 1]);
    structure.setBondOrder(c, o, 0);
    expect(structure.bonds).toHaveLength(0);
  });

  it("labels repeated elements in the order added", () => {
    const structure = new LewisStructure();
    const { o, h1, h2 } = drawWater(structure);
    expect([structure.labelOf(o), structure.labelOf(h1), structure.labelOf(h2)]).toEqual(["O", "H1", "H2"]);
  });

  it("undo and redo round-trip and keep the same atom objects", () => {
    const structure = new LewisStructure();
    const { o } = drawWater(structure);
    const complete = structureKey(structure.toData());
    structure.removeAtom(structure.atoms[1] as NonNullable<(typeof structure.atoms)[number]>);
    expect(structure.atoms).toHaveLength(2);
    structure.undo();
    expect(structureKey(structure.toData())).toBe(complete);
    expect(structure.atoms[0]).toBe(o);
    structure.redo();
    expect(structure.atoms).toHaveLength(2);
    expect(structure.canRedoProperty.value).toBe(false);
  });

  it("clears the redo stack on a new edit", () => {
    const structure = new LewisStructure();
    const { o } = drawWater(structure);
    structure.undo();
    expect(structure.canRedoProperty.value).toBe(true);
    structure.addLonePair(o);
    expect(structure.canRedoProperty.value).toBe(false);
  });
});

describe("checkStructure", () => {
  it("names missing and extra atoms first", () => {
    const structure = new LewisStructure();
    drawWater(structure);
    const outcome = checkAgainstSpecies(structure.toData(), getSpecies("ammonia"), OctetPolicy.ACCEPT_BOTH);
    expect(outcome.kind).toBe("wrongAtoms");
  });

  it("reports an incomplete drawing before judging it", () => {
    const structure = new LewisStructure();
    drawWater(structure, 1);
    expect(checkAgainstSpecies(structure.toData(), getSpecies("water"), OctetPolicy.ACCEPT_BOTH).kind).toBe(
      "incomplete",
    );
  });

  it("accepts a hand-drawn water as best", () => {
    const structure = new LewisStructure();
    drawWater(structure);
    const outcome = checkAgainstSpecies(structure.toData(), getSpecies("water"), OctetPolicy.ACCEPT_BOTH);
    expect(outcome.kind).toBe("best");
    expect(isCorrect(outcome)).toBe(true);
  });

  it("ranks each generated SO4²− structure by policy", () => {
    const species = getSpecies("sulfate");
    const octet = generateStructures(species.skeleton, OctetPolicy.OCTET_FIRST).best[0];
    expect(octet).toBeDefined();
    const data = octet?.data as NonNullable<typeof octet>["data"];
    expect(checkAgainstSpecies(data, species, OctetPolicy.ACCEPT_BOTH).kind).toBe("alternative");
    expect(checkAgainstSpecies(data, species, OctetPolicy.OCTET_FIRST).kind).toBe("best");
    // Σ|FC| = 6 against the best 2: valid, but outside the minor-contributor window.
    expect(checkAgainstSpecies(data, species, OctetPolicy.MINIMIZE_FORMAL_CHARGE).kind).toBe("notBest");
  });

  it("flags SCN− with −1 on S as acceptable, not correct", () => {
    const species = getSpecies("thiocyanate");
    const set = generateStructures(species.skeleton, OctetPolicy.ACCEPT_BOTH);
    const outcome = checkAgainstSpecies(
      set.acceptable[0]?.data as NonNullable<(typeof set.acceptable)[number]>["data"],
      species,
      OctetPolicy.ACCEPT_BOTH,
    );
    expect(outcome.kind).toBe("acceptable");
    expect(isCorrect(outcome)).toBe(false);
  });

  it("detects a wrong skeleton (H–N≡C for HCN)", () => {
    const structure = new LewisStructure();
    const h = structure.addAtom("H", Vector2.ZERO);
    const n = structure.addAtom("N", new Vector2(1, 0));
    const c = structure.addAtom("C", new Vector2(2, 0));
    structure.setBondOrder(h, n, 1);
    structure.setBondOrder(n, c, 3);
    structure.addLonePair(c);
    expect(structure.analysisProperty.value.complete).toBe(true);
    expect(checkAgainstSpecies(structure.toData(), getSpecies("hydrogenCyanide"), OctetPolicy.ACCEPT_BOTH).kind).toBe(
      "wrongSkeleton",
    );
  });

  it("checks a free drawing against its own skeleton", () => {
    const structure = new LewisStructure();
    const c = structure.addAtom("C", Vector2.ZERO);
    const o1 = structure.addAtom("O", new Vector2(-1, 0));
    const o2 = structure.addAtom("O", new Vector2(1, 0));
    structure.setBondOrder(c, o1, 1);
    structure.setBondOrder(c, o2, 3);
    structure.addLonePair(o1);
    structure.addLonePair(o1);
    structure.addLonePair(o1);
    structure.addLonePair(o2);
    // O–C≡O: complete, but formal charges −1/0/+1 instead of zero.
    expect(checkFreeBuild(structure.toData(), OctetPolicy.ACCEPT_BOTH).kind).toBe("minor");
  });
});
