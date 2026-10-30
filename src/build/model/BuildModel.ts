/**
 * BuildModel.ts
 *
 * The Build screen: one drawing board, the species being drawn (or free build), and the result of
 * the last Check. Choosing a species clears the board and sets the charge; any edit clears the
 * result, so feedback never describes a drawing that has since changed.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { type CheckOutcome, checkAgainstSpecies, checkFreeBuild } from "../../common/model/checkStructure.js";
import { boardBounds, DrawingModel } from "../../common/model/DrawingModel.js";
import { generateStructures } from "../../common/model/generateStructures.js";
import type { OctetPolicy } from "../../common/model/OctetPolicy.js";
import type { Species } from "../../common/model/SpeciesCatalog.js";
import { type CategoryChoice, firstSpeciesOf } from "../../common/model/SpeciesChoice.js";
import { isConnected } from "../../common/model/StructureData.js";
import { BOARD_HEIGHT, BOARD_WIDTH, PIXELS_PER_BOND } from "../../LewisStructuresConstants.js";

const INITIAL_CATEGORY: CategoryChoice = "simple";

export class BuildModel implements TModel {
  public readonly drawing: DrawingModel;
  public readonly categoryProperty = new Property<CategoryChoice>(INITIAL_CATEGORY);
  public readonly speciesProperty = new Property<Species | null>(firstSpeciesOf(INITIAL_CATEGORY));
  public readonly outcomeProperty = new Property<CheckOutcome | null>(null);
  public readonly policyProperty: TReadOnlyProperty<OctetPolicy>;

  public constructor(policyProperty: TReadOnlyProperty<OctetPolicy>) {
    this.policyProperty = policyProperty;
    this.drawing = new DrawingModel(boardBounds(BOARD_WIDTH, BOARD_HEIGHT, PIXELS_PER_BOND));

    this.categoryProperty.lazyLink((category) => {
      this.speciesProperty.value = firstSpeciesOf(category);
    });
    this.speciesProperty.link((species) => {
      this.drawing.reset(species?.skeleton.charge ?? 0);
    });
    this.drawing.structure.changedEmitter.addListener(() => {
      this.outcomeProperty.value = null;
    });
    policyProperty.lazyLink(() => {
      this.outcomeProperty.value = null;
    });
  }

  /** Grades the drawing against the species (or, in free build, against its own skeleton). */
  public check(): void {
    const data = this.drawing.structure.toData();
    const species = this.speciesProperty.value;
    const policy = this.policyProperty.value;
    this.outcomeProperty.value = species ? checkAgainstSpecies(data, species, policy) : checkFreeBuild(data, policy);
  }

  /** Lays out the best structure: the species', or, in free build, the best on the drawn skeleton. */
  public showAnswer(): void {
    const species = this.speciesProperty.value;
    const drawn = this.drawing.structure.toData();
    const skeleton = species ? species.skeleton : drawn;
    if (!(species || isConnected(drawn))) {
      return;
    }
    const best = generateStructures(skeleton, this.policyProperty.value).best[0];
    if (best) {
      if (species) {
        this.drawing.showData(best.data);
      } else {
        // Keep the student's own layout in free build.
        this.drawing.structure.setData(best.data);
      }
    }
  }

  /** Lays out the species' atoms joined by single bonds, with no lone pairs. */
  public showSkeleton(): void {
    const species = this.speciesProperty.value;
    if (species) {
      this.drawing.showData(species.skeleton);
    }
  }

  public reset(): void {
    this.categoryProperty.reset();
    this.speciesProperty.reset();
    this.drawing.reset(this.speciesProperty.value?.skeleton.charge ?? 0);
    this.outcomeProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
