/**
 * ChallengeModel.ts
 *
 * The Challenge screen: three levels of five problems each, drawn at random from the catalog by
 * difficulty (1: single bonds and simple ions; 2: multiple bonds and resonance; 3: expanded and
 * incomplete octets, odd-electron molecules). The student draws each species from scratch and
 * presses Check, as often as needed.
 *
 * Hints come in a fixed order, each costing a point: (1) the valence-electron total, (2) the
 * central atom, (3) the skeleton laid out, (4) where the multiple bonds or unusual octets are,
 * (5) the answer itself, which scores nothing. A correct answer is one Check accepts under the
 * current OctetPolicy (the best structure or a policy alternative).
 */

import { BooleanProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { dotRandom } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { type CheckOutcome, checkAgainstSpecies, isCorrect } from "../../common/model/checkStructure.js";
import { boardBounds, DrawingModel } from "../../common/model/DrawingModel.js";
import { generateStructures } from "../../common/model/generateStructures.js";
import type { OctetPolicy } from "../../common/model/OctetPolicy.js";
import { getAllSpecies, type Species } from "../../common/model/SpeciesCatalog.js";
import { BOARD_WIDTH, CHALLENGE_BOARD_HEIGHT, PIXELS_PER_BOND } from "../../LewisStructuresConstants.js";
import { CHALLENGE_LEVEL_COUNT } from "../../preferences/lewisStructuresQueryParameters.js";

export const LEVEL_COUNT = CHALLENGE_LEVEL_COUNT;
export const PROBLEMS_PER_ROUND = 5;
export const POINTS_PER_PROBLEM = 4;
export const PERFECT_SCORE = PROBLEMS_PER_ROUND * POINTS_PER_PROBLEM;
export const NUMBER_OF_STARS = 3;

/** Hints in order; the last one shows the answer. */
export const HINTS = ["electrons", "central", "skeleton", "bonding", "answer"] as const;
export type Hint = (typeof HINTS)[number];

export class ChallengeModel implements TModel {
  /** The level being played (1–3), or null on the level-selection screen. */
  public readonly levelProperty = new Property<number | null>(null);
  /** For the status bar: the level number (1–3) and the problem number (1–5). */
  public readonly levelNumberProperty = new NumberProperty(1);
  public readonly challengeNumberProperty = new NumberProperty(1);
  public readonly numberOfChallengesProperty = new NumberProperty(PROBLEMS_PER_ROUND);
  public readonly scoreProperty = new NumberProperty(0);
  /** Best score reached on each level, shown as stars on its button. */
  public readonly bestScoreProperties = Array.from({ length: LEVEL_COUNT }, () => new NumberProperty(0));
  public readonly speciesProperty = new Property<Species | null>(null);
  public readonly hintsUsedProperty = new NumberProperty(0);
  public readonly solvedProperty = new BooleanProperty(false);
  public readonly revealedProperty = new BooleanProperty(false);
  public readonly outcomeProperty = new Property<CheckOutcome | null>(null);
  /** Points earned on the problem just solved (for the feedback line). */
  public readonly lastPointsProperty = new NumberProperty(0);
  public readonly roundCompleteProperty = new BooleanProperty(false);
  /** Whether the VSEPR shape inset is shown once a problem is solved. */
  public readonly showShapeProperty = new BooleanProperty(false);
  public readonly drawing: DrawingModel;
  public readonly policyProperty: TReadOnlyProperty<OctetPolicy>;
  private problems: Species[] = [];

  public constructor(policyProperty: TReadOnlyProperty<OctetPolicy>) {
    this.policyProperty = policyProperty;
    this.drawing = new DrawingModel(boardBounds(BOARD_WIDTH, CHALLENGE_BOARD_HEIGHT, PIXELS_PER_BOND));
    this.drawing.structure.changedEmitter.addListener(() => {
      if (!this.solvedProperty.value) {
        this.outcomeProperty.value = null;
      }
    });
  }

  /** The species available at a level (1–3). */
  public static speciesForLevel(level: number): Species[] {
    return getAllSpecies().filter((species) => species.difficulty === level);
  }

  public startLevel(level: number): void {
    this.problems = dotRandom.shuffle(ChallengeModel.speciesForLevel(level)).slice(0, PROBLEMS_PER_ROUND);
    this.numberOfChallengesProperty.value = this.problems.length;
    this.levelNumberProperty.value = level;
    this.scoreProperty.value = 0;
    this.roundCompleteProperty.value = false;
    this.loadProblem(0);
    this.levelProperty.value = level;
  }

  /** Back to the level-selection screen. */
  public leaveLevel(): void {
    this.levelProperty.value = null;
    this.roundCompleteProperty.value = false;
  }

  /** Grades the drawing; the first correct answer scores what the hints left. */
  public check(): void {
    const species = this.speciesProperty.value;
    if (!species || this.solvedProperty.value) {
      return;
    }
    const outcome = checkAgainstSpecies(this.drawing.structure.toData(), species, this.policyProperty.value);
    if (isCorrect(outcome)) {
      const points = this.revealedProperty.value ? 0 : Math.max(0, POINTS_PER_PROBLEM - this.hintsUsedProperty.value);
      this.lastPointsProperty.value = points;
      this.scoreProperty.value += points;
      this.solvedProperty.value = true;
    }
    this.outcomeProperty.value = outcome;
  }

  /** The next hint; the third lays out the skeleton and the last shows the answer. */
  public takeHint(): void {
    const species = this.speciesProperty.value;
    if (!species || this.solvedProperty.value || this.hintsUsedProperty.value >= HINTS.length) {
      return;
    }
    this.hintsUsedProperty.value++;
    const hint = HINTS[this.hintsUsedProperty.value - 1];
    if (hint === "skeleton") {
      this.drawing.showData(species.skeleton);
    } else if (hint === "answer") {
      this.revealedProperty.value = true;
      const best = generateStructures(species.skeleton, this.policyProperty.value).best[0];
      if (best) {
        this.drawing.showData(best.data);
      }
    }
  }

  /** On to the next problem, or the end of the round. */
  public nextProblem(): void {
    const next = this.challengeNumberProperty.value;
    if (next < this.problems.length) {
      this.loadProblem(next);
    } else {
      const level = this.levelProperty.value;
      const best = level ? this.bestScoreProperties[level - 1] : undefined;
      if (best && this.scoreProperty.value > best.value) {
        best.value = this.scoreProperty.value;
      }
      this.roundCompleteProperty.value = true;
    }
  }

  public reset(): void {
    this.leaveLevel();
    this.showShapeProperty.reset();
    for (const best of this.bestScoreProperties) {
      best.reset();
    }
    this.scoreProperty.reset();
    this.drawing.reset();
    this.speciesProperty.value = null;
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }

  private loadProblem(index: number): void {
    const species = this.problems[index] ?? null;
    this.challengeNumberProperty.value = index + 1;
    this.hintsUsedProperty.value = 0;
    this.solvedProperty.value = false;
    this.revealedProperty.value = false;
    this.lastPointsProperty.value = 0;
    this.speciesProperty.value = species;
    this.drawing.reset(species?.skeleton.charge ?? 0);
    this.outcomeProperty.value = null;
  }
}
