/**
 * ChecklistNode.ts
 *
 * The rules a finished Lewis structure meets, ticked off live from the analysis, with one hint
 * naming the first thing still to fix. `describeHint` is shared with the spoken descriptions.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, RichText, Text, VBox } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import type { StructureAnalysis } from "../model/analyzeStructure.js";
import { checkAgainstSpecies } from "../model/checkStructure.js";
import { electronBudget } from "../model/electronBudget.js";
import type { LewisStructure } from "../model/LewisStructure.js";
import { OctetPolicy } from "../model/OctetPolicy.js";
import { OctetStatus } from "../model/OctetStatus.js";
import type { Species } from "../model/SpeciesCatalog.js";
import type { StructureData } from "../model/StructureData.js";
import { CONTROL_FONT, HEADING_FONT, SMALL_FONT } from "./ControlFactory.js";
import { countList, signedCharge } from "./formatValues.js";

const MARK_DONE = "✓";
const MARK_OPEN = "○";

/** The atoms still needed for, or extra to, the target's formula; null when they match. */
function atomMismatch(structure: LewisStructure, target: StructureData | null): string | null {
  if (!target) {
    return null;
  }
  const outcome = checkAgainstSpecies(structure.toData(), { skeleton: target } as Species, OctetPolicy.ACCEPT_BOTH);
  if (outcome.kind !== "wrongAtoms") {
    return null;
  }
  const feedback = StringManager.getInstance().getCommonStrings().feedback;
  const parts: string[] = [];
  if (outcome.missing.size > 0) {
    parts.push(StringUtils.fillIn(feedback.needPatternStringProperty.value, { list: countList(outcome.missing) }));
  }
  if (outcome.extra.size > 0) {
    parts.push(StringUtils.fillIn(feedback.removePatternStringProperty.value, { list: countList(outcome.extra) }));
  }
  return parts.join(" ");
}

/**
 * The one hint for the first unmet rule, in the order a student works. With a target (a catalog
 * species), the atoms are compared with its formula first.
 */
export function describeHint(
  structure: LewisStructure,
  analysis: StructureAnalysis,
  target: StructureData | null,
): string {
  const hints = StringManager.getInstance().getCommonStrings().hints;
  const atoms = structure.atoms;
  if (atoms.length === 0) {
    return hints.startStringProperty.value;
  }
  const mismatch = atomMismatch(structure, target);
  if (mismatch) {
    return StringUtils.fillIn(hints.atomsPatternStringProperty.value, { details: mismatch });
  }
  if (!analysis.connected) {
    return hints.connectStringProperty.value;
  }
  if (analysis.remaining > 0) {
    return StringUtils.fillIn(hints.placeRemainingPatternStringProperty.value, { count: analysis.remaining });
  }
  if (analysis.remaining < 0) {
    return StringUtils.fillIn(hints.tooManyPatternStringProperty.value, { count: -analysis.remaining });
  }
  const firstWith = (status: OctetStatus) => analysis.atoms.findIndex((atom) => atom.status === status);
  const over = firstWith(OctetStatus.OVER);
  if (over >= 0) {
    return StringUtils.fillIn(hints.overPatternStringProperty.value, {
      atom: structure.labelOf(atoms[over] as (typeof atoms)[number]),
      count: analysis.atoms[over]?.electrons ?? 0,
    });
  }
  const short = firstWith(OctetStatus.SHORT);
  if (short >= 0) {
    return StringUtils.fillIn(hints.shortPatternStringProperty.value, {
      atom: structure.labelOf(atoms[short] as (typeof atoms)[number]),
      count: analysis.atoms[short]?.electrons ?? 0,
    });
  }
  if (analysis.unpairedCount !== analysis.expectedUnpaired) {
    return StringUtils.fillIn(hints.unpairedPatternStringProperty.value, {
      expected: analysis.expectedUnpaired,
      count: analysis.unpairedCount,
    });
  }
  return hints.doneStringProperty.value;
}

export class ChecklistNode extends VBox {
  private readonly disposeChecklistNode: () => void;

  /**
   * @param targetProperty - the species being drawn (its formula sets the electron total), or null
   */
  public constructor(
    structure: LewisStructure,
    targetProperty: TReadOnlyProperty<StructureData | null>,
    width: number,
  ) {
    const common = StringManager.getInstance().getCommonStrings();
    const strings = common.checklist;
    const analysisProperty = structure.analysisProperty;

    const hasAtoms = (analysis: StructureAnalysis) => analysis.atoms.length > 0;
    const item = (labelProperty: TReadOnlyProperty<string>, isDone: (analysis: StructureAnalysis) => boolean) => {
      const mark = new Text(MARK_OPEN, { font: CONTROL_FONT });
      const labelText = new RichText(labelProperty, {
        font: CONTROL_FONT,
        fill: LewisStructuresColors.textColorProperty,
        maxWidth: width - 20,
      });
      const update = (analysis: StructureAnalysis) => {
        const done = hasAtoms(analysis) && isDone(analysis);
        mark.string = done ? MARK_DONE : MARK_OPEN;
        mark.fill = done ? LewisStructuresColors.goodColorProperty : LewisStructuresColors.mutedTextColorProperty;
      };
      analysisProperty.link(update);
      return {
        node: new HBox({ spacing: 6, children: [mark, labelText] }),
        dispose: () => analysisProperty.unlink(update),
      };
    };

    const unpairedLabelProperty = new DerivedProperty(
      [analysisProperty, strings.unpairedNoneStringProperty, strings.unpairedOneStringProperty],
      (analysis, none, one) => (analysis.expectedUnpaired === 1 && analysis.atoms.length > 0 ? one : none),
    );
    const formalChargeLabelProperty = new DerivedProperty(
      [structure.chargeProperty, strings.formalChargeSumPatternStringProperty],
      (charge, pattern) => StringUtils.fillIn(pattern, { charge: signedCharge(charge) }),
    );

    const items = [
      item(strings.allPlacedStringProperty, () => electronBudget(structure, targetProperty.value).left === 0),
      item(strings.connectedStringProperty, (a) => a.connected),
      item(strings.octetsStringProperty, (a) => a.atoms.every((atom) => atom.status.satisfied)),
      item(unpairedLabelProperty, (a) => a.unpairedCount === a.expectedUnpaired),
      item(formalChargeLabelProperty, (a) => a.formalChargeSum === structure.chargeProperty.value),
    ];

    const hintProperty = DerivedProperty.deriveAny(
      [analysisProperty, targetProperty, ...Object.values(common.hints)],
      () => describeHint(structure, analysisProperty.value, targetProperty.value),
    );
    const hint = new RichText(hintProperty, {
      font: SMALL_FONT,
      fill: LewisStructuresColors.mutedTextColorProperty,
      lineWrap: width,
    });

    super({
      align: "left",
      spacing: 4,
      children: [
        new Text(strings.titleStringProperty, {
          font: HEADING_FONT,
          fill: LewisStructuresColors.textColorProperty,
          maxWidth: width,
        }),
        ...items.map((i) => i.node),
        hint,
      ],
    });

    this.disposeChecklistNode = () => {
      for (const i of items) {
        i.dispose();
      }
      unpairedLabelProperty.dispose();
      formalChargeLabelProperty.dispose();
      hintProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposeChecklistNode();
    super.dispose();
  }
}
