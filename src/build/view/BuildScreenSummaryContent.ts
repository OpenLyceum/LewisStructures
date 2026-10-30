/**
 * BuildScreenSummaryContent.ts
 *
 * The accessible screen summary for the Build screen. Its current-details paragraph is live: what
 * is being drawn, each atom with its bonds, electrons, formal charge and octet status, how many
 * electrons are left, and the next step from the checklist.
 */

import { DerivedProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { drawingDetails } from "../../common/view/boardDescriptions.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BuildModel } from "../model/BuildModel.js";

export class BuildScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: BuildModel) {
    const a11y = StringManager.getInstance().getBuildA11yStrings();
    const structure = model.drawing.structure;
    const detailsProperty = DerivedProperty.deriveAny([structure.analysisProperty, model.speciesProperty], () =>
      drawingDetails(structure, model.speciesProperty.value),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: detailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
