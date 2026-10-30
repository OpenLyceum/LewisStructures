/**
 * describeOutcome.ts
 *
 * The feedback sentence for a CheckOutcome, and whether it counts as good news.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { StringManager } from "../../i18n/StringManager.js";
import type { CheckOutcome } from "../model/checkStructure.js";
import type { Species } from "../model/SpeciesCatalog.js";
import { countList } from "./formatValues.js";

export type OutcomeText = {
  readonly text: string;
  /** true: correct; false: wrong; null: neutral (not finished, or valid but improvable). */
  readonly good: boolean | null;
};

export function describeOutcome(outcome: CheckOutcome, species: Species | null): OutcomeText {
  const strings = StringManager.getInstance().getCommonStrings().feedback;
  switch (outcome.kind) {
    case "empty":
      return { text: strings.emptyStringProperty.value, good: null };
    case "wrongAtoms": {
      const parts: string[] = [];
      if (outcome.missing.size > 0) {
        parts.push(StringUtils.fillIn(strings.needPatternStringProperty.value, { list: countList(outcome.missing) }));
      }
      if (outcome.extra.size > 0) {
        parts.push(StringUtils.fillIn(strings.removePatternStringProperty.value, { list: countList(outcome.extra) }));
      }
      return {
        text: StringUtils.fillIn(strings.wrongAtomsPatternStringProperty.value, {
          formula: species?.formula ?? "",
          details: parts.join(" "),
        }),
        good: false,
      };
    }
    case "incomplete":
      return { text: strings.incompleteStringProperty.value, good: null };
    case "wrongSkeleton": {
      const central = species && species.central !== null ? species.skeleton.atoms[species.central]?.element : null;
      const centralHint = central
        ? ` ${StringUtils.fillIn(strings.centralPatternStringProperty.value, { element: central })}`
        : "";
      return { text: `${strings.wrongSkeletonStringProperty.value}${centralHint}`, good: false };
    }
    case "best":
      return {
        text:
          outcome.formCount > 1
            ? StringUtils.fillIn(strings.bestResonancePatternStringProperty.value, { count: outcome.formCount })
            : strings.bestStringProperty.value,
        good: true,
      };
    case "alternative":
      return { text: strings.alternativeStringProperty.value, good: true };
    case "acceptable":
      return { text: strings.acceptableStringProperty.value, good: null };
    case "minor":
      return { text: strings.minorStringProperty.value, good: null };
    case "notBest":
      return { text: strings.notBestStringProperty.value, good: false };
    case "tooLarge":
      return { text: strings.tooLargeStringProperty.value, good: null };
  }
}
