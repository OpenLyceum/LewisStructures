/**
 * ElectronBudgetNode.ts
 *
 * The valence-electron count, the first step of every Lewis structure: electrons from the atoms,
 * the adjustment for the charge, the total, how many are placed, and how many are left, with a tray
 * of electron pairs that empties as they are placed. Too many placed turns the count red.
 *
 * With a target (a catalog species) the count comes from its formula, so it is there before any
 * atom is drawn; in free build it comes from the atoms on the board.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Path, RichText, VBox } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { ELECTRON_DOT_RADIUS } from "../../LewisStructuresConstants.js";
import { type ElectronBudget, electronBudget } from "../model/electronBudget.js";
import type { LewisStructure } from "../model/LewisStructure.js";
import type { StructureData } from "../model/StructureData.js";
import { CONTROL_FONT, HEADING_FONT } from "./ControlFactory.js";
import { signedCharge } from "./formatValues.js";

/** Pairs per row in the tray, and the most rows drawn. */
const TRAY_COLUMNS = 12;
const TRAY_MAX_ROWS = 3;
const TRAY_PITCH = 14;

export class ElectronBudgetNode extends VBox {
  private readonly disposeElectronBudgetNode: () => void;

  /**
   * @param targetProperty - the species being drawn, whose formula sets the count; null in free build
   */
  public constructor(
    structure: LewisStructure,
    targetProperty: TReadOnlyProperty<StructureData | null>,
    width: number,
  ) {
    const strings = StringManager.getInstance().getCommonStrings().budget;

    const budgetProperty = new DerivedProperty(
      [structure.analysisProperty, targetProperty, structure.chargeProperty],
      (_analysis, target) => electronBudget(structure, target),
    );

    const line = (textProperty: TReadOnlyProperty<string>) =>
      new RichText(textProperty, {
        font: CONTROL_FONT,
        fill: LewisStructuresColors.textColorProperty,
        maxWidth: width,
      });
    const texts = [
      new DerivedProperty([budgetProperty, strings.fromAtomsPatternStringProperty], (budget, pattern) =>
        StringUtils.fillIn(pattern, { count: budget.fromAtoms }),
      ),
      new DerivedProperty([budgetProperty, strings.chargePatternStringProperty], (budget, pattern) =>
        StringUtils.fillIn(pattern, { charge: signedCharge(budget.charge), change: signedCharge(-budget.charge) }),
      ),
      new DerivedProperty([budgetProperty, strings.totalPatternStringProperty], (budget, pattern) =>
        StringUtils.fillIn(pattern, { count: budget.total }),
      ),
      new DerivedProperty([budgetProperty, strings.placedPatternStringProperty], (budget, pattern) =>
        StringUtils.fillIn(pattern, { count: budget.placed }),
      ),
      new DerivedProperty(
        [budgetProperty, strings.leftPatternStringProperty, strings.overPatternStringProperty],
        (budget, leftPattern, overPattern) =>
          budget.left >= 0
            ? StringUtils.fillIn(leftPattern, { count: budget.left })
            : StringUtils.fillIn(overPattern, { count: -budget.left }),
      ),
    ];
    const [fromAtomsLine, chargeLine, totalLine, placedLine] = texts.slice(0, 4).map(line) as [
      RichText,
      RichText,
      RichText,
      RichText,
    ];
    const leftLine = new RichText(texts[4] as TReadOnlyProperty<string>, { font: CONTROL_FONT, maxWidth: width });
    const tray = new Path(null, { fill: LewisStructuresColors.electronColorProperty });

    const update = (budget: ElectronBudget) => {
      chargeLine.visible = budget.charge !== 0;
      const drawn = structure.atoms.length > 0;
      leftLine.fill =
        budget.left < 0
          ? LewisStructuresColors.poorColorProperty
          : budget.left === 0 && drawn
            ? LewisStructuresColors.goodColorProperty
            : LewisStructuresColors.textColorProperty;
      // One dot pair per two electrons left (a lone dot for an odd one), capped at the tray size.
      const shape = new Shape();
      const left = Math.max(0, budget.left);
      const groups = Math.min(Math.ceil(left / 2), TRAY_COLUMNS * TRAY_MAX_ROWS);
      for (let g = 0; g < groups; g++) {
        const x = (g % TRAY_COLUMNS) * TRAY_PITCH + ELECTRON_DOT_RADIUS;
        const y = Math.floor(g / TRAY_COLUMNS) * (TRAY_PITCH - 4) + ELECTRON_DOT_RADIUS;
        shape.circle(x, y, ELECTRON_DOT_RADIUS).newSubpath();
        if (2 * g + 1 < left) {
          shape.circle(x + 2 * ELECTRON_DOT_RADIUS + 1, y, ELECTRON_DOT_RADIUS).newSubpath();
        }
      }
      tray.shape = groups > 0 ? shape : null;
      tray.visible = groups > 0;
    };
    budgetProperty.link(update);

    super({
      align: "left",
      spacing: 4,
      children: [
        new RichText(strings.titleStringProperty, {
          font: HEADING_FONT,
          fill: LewisStructuresColors.textColorProperty,
          maxWidth: width,
        }),
        fromAtomsLine,
        chargeLine,
        totalLine,
        placedLine,
        leftLine,
        tray,
      ],
    });

    this.disposeElectronBudgetNode = () => {
      budgetProperty.unlink(update);
      for (const text of texts) {
        text.dispose();
      }
      budgetProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposeElectronBudgetNode();
    super.dispose();
  }
}
