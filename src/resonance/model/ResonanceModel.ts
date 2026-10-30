/**
 * ResonanceModel.ts
 *
 * The Resonance screen: a species with more than one reasonable Lewis structure, its gallery of
 * forms (equivalent major forms first, then the policy alternatives and minor forms), which form is
 * shown, and the view mode: the forms one at a time with curved arrows to the next, the hybrid, or
 * a skeleton the student completes and checks against the forms.
 */

import {
  BooleanProperty,
  DerivedProperty,
  Property,
  StringUnionProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { analyzeStructure } from "../../common/model/analyzeStructure.js";
import { checkAgainstSpecies } from "../../common/model/checkStructure.js";
import { boardBounds, DrawingModel } from "../../common/model/DrawingModel.js";
import { generateStructures } from "../../common/model/generateStructures.js";
import { sameStructure } from "../../common/model/moleculeGraph.js";
import { OctetPolicy } from "../../common/model/OctetPolicy.js";
import { type GalleryForm, resonanceGallery } from "../../common/model/resonance.js";
import { getAllSpecies, getSpecies, type Species } from "../../common/model/SpeciesCatalog.js";
import { BOARD_HEIGHT, PIXELS_PER_BOND, RESONANCE_BOARD_WIDTH } from "../../LewisStructuresConstants.js";

export const RESONANCE_MODES = ["forms", "hybrid", "draw"] as const;
export type ResonanceMode = (typeof RESONANCE_MODES)[number];

/** The result of checking a drawing against the gallery. */
export type ResonanceCheck =
  | { readonly kind: "incomplete" }
  | { readonly kind: "match"; readonly index: number }
  | { readonly kind: "other" }
  | { readonly kind: "wrongSkeleton" };

/** Species whose forms are worth comparing: the resonance set plus expanded and odd-electron ions. */
const EXTRA_SPECIES = ["sulfate", "phosphate", "perchlorate", "nitrogenDioxide"];

export function resonanceSpecies(): Species[] {
  return [...getAllSpecies().filter((species) => species.category === "resonance"), ...EXTRA_SPECIES.map(getSpecies)];
}

export class ResonanceModel implements TModel {
  public readonly speciesList = resonanceSpecies();
  public readonly speciesProperty: Property<Species>;
  public readonly modeProperty = new StringUnionProperty<ResonanceMode>("forms", { validValues: RESONANCE_MODES });
  public readonly galleryProperty: TReadOnlyProperty<GalleryForm[]>;
  /** Index into the gallery of the form shown. */
  public readonly selectedIndexProperty = new Property(0);
  public readonly showArrowsProperty = new BooleanProperty(true);
  /** The student's drawing in draw mode, started from the species' skeleton. */
  public readonly drawing: DrawingModel;
  public readonly checkProperty = new Property<ResonanceCheck | null>(null);

  public constructor(policyProperty: TReadOnlyProperty<OctetPolicy>) {
    this.speciesProperty = new Property<Species>(this.speciesList[1] ?? getSpecies("nitrate"));
    this.drawing = new DrawingModel(boardBounds(RESONANCE_BOARD_WIDTH, BOARD_HEIGHT, PIXELS_PER_BOND));
    this.galleryProperty = new DerivedProperty([this.speciesProperty, policyProperty], (species, policy) =>
      resonanceGallery(generateStructures(species.skeleton, policy)),
    );
    this.galleryProperty.link(() => {
      this.selectedIndexProperty.value = 0;
      this.startDrawing();
    });
    this.drawing.structure.changedEmitter.addListener(() => {
      this.checkProperty.value = null;
    });
  }

  /** The form shown (forms mode). */
  public get selectedForm(): GalleryForm | null {
    return this.galleryProperty.value[this.selectedIndexProperty.value] ?? null;
  }

  /** The equivalent best forms, which the hybrid averages. */
  public get bestForms(): GalleryForm[] {
    return this.galleryProperty.value.filter((form) => form.rank === "major" || form.rank === "equivalent");
  }

  public selectNext(step: 1 | -1): void {
    const count = this.galleryProperty.value.length;
    if (count > 0) {
      this.selectedIndexProperty.value = (this.selectedIndexProperty.value + step + count) % count;
    }
  }

  /** Puts the species' skeleton (single bonds, no lone pairs) on the board. */
  public startDrawing(): void {
    this.drawing.reset(this.speciesProperty.value.skeleton.charge);
    this.drawing.showData(this.speciesProperty.value.skeleton, false);
  }

  /** Which gallery form the drawing is, if any; selects it. */
  public check(): void {
    const data = this.drawing.structure.toData();
    const species = this.speciesProperty.value;
    if (!analyzeStructure(data).complete) {
      this.checkProperty.value = { kind: "incomplete" };
      return;
    }
    // Only the atoms and the skeleton are judged here, which no policy affects.
    const outcome = checkAgainstSpecies(data, species, OctetPolicy.ACCEPT_BOTH);
    if (outcome.kind === "wrongAtoms" || outcome.kind === "wrongSkeleton") {
      this.checkProperty.value = { kind: "wrongSkeleton" };
      return;
    }
    const index = this.galleryProperty.value.findIndex((form) => sameStructure(form.form.data, data));
    if (index >= 0) {
      this.selectedIndexProperty.value = index;
      this.checkProperty.value = { kind: "match", index };
    } else {
      this.checkProperty.value = { kind: "other" };
    }
  }

  public reset(): void {
    this.speciesProperty.reset();
    this.modeProperty.reset();
    this.showArrowsProperty.reset();
    this.selectedIndexProperty.reset();
    this.startDrawing();
    this.checkProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on its own.
  }
}
