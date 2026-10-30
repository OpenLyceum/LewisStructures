/**
 * challenge.test.ts
 *
 * The Challenge round: problems by level, hints and their cost, scoring a correct answer once,
 * and the end of the round.
 */

import { Property } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import {
  ChallengeModel,
  HINTS,
  POINTS_PER_PROBLEM,
  PROBLEMS_PER_ROUND,
} from "../../src/challenge/model/ChallengeModel.js";
import { generateStructures } from "../../src/common/model/generateStructures.js";
import { OctetPolicy } from "../../src/common/model/OctetPolicy.js";

function solve(model: ChallengeModel): void {
  const species = model.speciesProperty.value;
  const best = species ? generateStructures(species.skeleton, model.policyProperty.value).best[0] : undefined;
  if (best) {
    model.drawing.showData(best.data);
  }
  model.check();
}

describe("ChallengeModel", () => {
  it("every level has enough species for a round, all of that difficulty", () => {
    for (const level of [1, 2, 3]) {
      const species = ChallengeModel.speciesForLevel(level);
      expect(species.length).toBeGreaterThanOrEqual(PROBLEMS_PER_ROUND);
      expect(species.every((s) => s.difficulty === level)).toBe(true);
    }
  });

  it("scores a correct answer once, less one point per hint", () => {
    const model = new ChallengeModel(new Property(OctetPolicy.ACCEPT_BOTH));
    model.startLevel(1);
    solve(model);
    expect(model.solvedProperty.value).toBe(true);
    expect(model.scoreProperty.value).toBe(POINTS_PER_PROBLEM);
    model.check();
    expect(model.scoreProperty.value).toBe(POINTS_PER_PROBLEM);

    model.nextProblem();
    model.takeHint();
    model.takeHint();
    solve(model);
    expect(model.scoreProperty.value).toBe(2 * POINTS_PER_PROBLEM - 2);
  });

  it("the skeleton hint lays out the atoms; the answer hint scores nothing", () => {
    const model = new ChallengeModel(new Property(OctetPolicy.ACCEPT_BOTH));
    model.startLevel(2);
    model.takeHint();
    model.takeHint();
    model.takeHint();
    expect(model.drawing.structure.atoms.length).toBe(model.speciesProperty.value?.skeleton.atoms.length);
    while (model.hintsUsedProperty.value < HINTS.length) {
      model.takeHint();
    }
    expect(model.revealedProperty.value).toBe(true);
    model.check();
    expect(model.solvedProperty.value).toBe(true);
    expect(model.scoreProperty.value).toBe(0);
  });

  it("ends the round after five problems and keeps the best score", () => {
    const model = new ChallengeModel(new Property(OctetPolicy.ACCEPT_BOTH));
    model.startLevel(3);
    for (let i = 0; i < PROBLEMS_PER_ROUND; i++) {
      solve(model);
      model.nextProblem();
    }
    expect(model.roundCompleteProperty.value).toBe(true);
    expect(model.bestScoreProperties[2]?.value).toBe(PROBLEMS_PER_ROUND * POINTS_PER_PROBLEM);
  });
});
