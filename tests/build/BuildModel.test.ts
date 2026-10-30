import { Property } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import { BuildModel } from "../../src/build/model/BuildModel.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";
import { getSpecies } from "../../src/common/model/SpeciesCatalog.js";

describe("BuildModel", () => {
  it("preserves the free-build layout when a catalog answer has already populated the cache", () => {
    const policy = new Property(OctetPolicy.ACCEPT_BOTH);
    const model = new BuildModel(policy);
    model.speciesProperty.value = getSpecies("water");
    model.showAnswer();
    model.categoryProperty.value = "freeBuild";
    const skeleton = getSpecies("water").skeleton;
    model.drawing.structure.setData({
      ...skeleton,
      atoms: skeleton.atoms.map((atom) => ({ ...atom, x: atom.x + 1, y: atom.y + 0.5 })),
    });
    const before = model.drawing.structure.toData();
    model.showAnswer();
    const answer = model.drawing.structure.toData();
    expect(answer.atoms.map(({ x, y }) => [x, y])).toEqual(before.atoms.map(({ x, y }) => [x, y]));
    expect(model.drawing.structure.analysisProperty.value.complete).toBe(true);
    model.check();
    expect(model.outcomeProperty.value?.kind).toBe("best");
    model.drawing.structure.undo();
    expect(model.drawing.structure.toData()).toEqual(before);
    model.drawing.structure.redo();
    expect(model.drawing.structure.toData()).toEqual(answer);
    model.reset();
    expect(model.drawing.structure.atoms).toHaveLength(0);
    expect(model.drawing.structure.canUndoProperty.value).toBe(false);
  });
});
