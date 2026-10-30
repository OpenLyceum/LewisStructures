/**
 * ChallengeScreenSummaryContent.ts
 *
 * The accessible screen summary for the Challenge screen. Its current-details paragraph is live:
 * the level, problem and score, the species to draw, the hints used, and the drawing so far.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { budgetSentence } from "../../common/view/boardDescriptions.js";
import { describeHint } from "../../common/view/ChecklistNode.js";
import { speciesName } from "../../common/view/speciesLabels.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ChallengeModel } from "../model/ChallengeModel.js";

export class ChallengeScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ChallengeModel) {
    const a11y = StringManager.getInstance().getChallengeA11yStrings();
    const structure = model.drawing.structure;
    const detailsProperty = DerivedProperty.deriveAny(
      [
        model.levelProperty,
        model.speciesProperty,
        model.challengeNumberProperty,
        model.scoreProperty,
        model.hintsUsedProperty,
        model.solvedProperty,
        model.roundCompleteProperty,
        structure.analysisProperty,
      ],
      () => {
        const level = model.levelProperty.value;
        const species = model.speciesProperty.value;
        if (level === null || !species) {
          return a11y.selectingLevelStringProperty.value;
        }
        const state = model.roundCompleteProperty.value
          ? a11y.roundCompleteStringProperty.value
          : model.solvedProperty.value
            ? a11y.solvedStringProperty.value
            : `${budgetSentence(structure, model.hintsUsedProperty.value > 0 ? species.skeleton : null)} ${describeHint(structure, structure.analysisProperty.value, species.skeleton)}`;
        return StringUtils.fillIn(a11y.detailsPatternStringProperty.value, {
          level,
          number: model.challengeNumberProperty.value,
          count: model.numberOfChallengesProperty.value,
          score: model.scoreProperty.value,
          name: speciesName(species).value,
          formula: species.spokenFormula,
          hints: model.hintsUsedProperty.value,
          state,
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
