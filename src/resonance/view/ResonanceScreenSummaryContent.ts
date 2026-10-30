/**
 * ResonanceScreenSummaryContent.ts
 *
 * The accessible screen summary for the Resonance screen. Its current-details paragraph is live:
 * the form shown with its rank, multiple bonds, formal charges and the arrows to the next form; or
 * the hybrid's bond orders and charges; or the drawing in progress.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { resonanceArrows, resonanceHybrid } from "../../common/model/resonance.js";
import { budgetSentence } from "../../common/view/boardDescriptions.js";
import { describeHint } from "../../common/view/ChecklistNode.js";
import { speciesName } from "../../common/view/speciesLabels.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ResonanceModel } from "../model/ResonanceModel.js";
import { arrowsDescription, formDescription, hybridParts, rankLabel } from "./resonanceDescriptions.js";

export class ResonanceScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ResonanceModel) {
    const a11y = StringManager.getInstance().getResonanceA11yStrings();
    const structure = model.drawing.structure;
    const detailsProperty = DerivedProperty.deriveAny(
      [
        model.speciesProperty,
        model.modeProperty,
        model.galleryProperty,
        model.selectedIndexProperty,
        structure.analysisProperty,
      ],
      () => {
        const species = model.speciesProperty.value;
        const gallery = model.galleryProperty.value;
        const index = model.selectedIndexProperty.value;
        const named = { name: speciesName(species).value, formula: species.spokenFormula };
        const mode = model.modeProperty.value;
        if (mode === "hybrid") {
          const best = model.bestForms.map((f) => f.form);
          const first = best[0];
          if (!first) {
            return "";
          }
          return StringUtils.fillIn(a11y.detailsHybridPatternStringProperty.value, {
            ...named,
            ...hybridParts(first.data, resonanceHybrid(best)),
          });
        }
        if (mode === "draw") {
          return StringUtils.fillIn(a11y.detailsDrawPatternStringProperty.value, {
            ...named,
            budget: budgetSentence(structure, species.skeleton),
            hint: describeHint(structure, structure.analysisProperty.value, species.skeleton),
          });
        }
        const form = gallery[index];
        if (!form) {
          return "";
        }
        const next = gallery.length > 1 ? gallery[(index + 1) % gallery.length] : undefined;
        return StringUtils.fillIn(a11y.detailsFormPatternStringProperty.value, {
          ...named,
          number: index + 1,
          count: gallery.length,
          rank: rankLabel(form.rank),
          description: formDescription(form.form),
          arrows: next
            ? arrowsDescription(
                form.form.data,
                resonanceArrows(form.form.data, next.form.data),
                ((index + 1) % gallery.length) + 1,
              )
            : "",
        });
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: detailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
