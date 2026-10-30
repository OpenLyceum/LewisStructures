/**
 * FormCardNode.ts
 *
 * One resonance form in the gallery: a small drawing of it, its number and its rank. Clicking it
 * (or pressing Enter on it) shows that form large.
 */

import { PatternStringProperty, Property } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { FireListener, Node, Rectangle, RichText, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { GalleryForm } from "../../common/model/resonance.js";
import { StructureNode } from "../../common/view/StructureNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { PANEL_CORNER_RADIUS, PIXELS_PER_BOND } from "../../LewisStructuresConstants.js";
import { formDescription, rankLabel } from "./resonanceDescriptions.js";

const NUMBER_FONT = new PhetFont({ size: 11, weight: "bold" });
const RANK_FONT = new PhetFont(10);
const LABEL_HEIGHT = 30;

export class FormCardNode extends Node {
  private readonly frame: Rectangle;
  private readonly disposeFormCardNode: () => void;

  public constructor(form: GalleryForm, number: number, width: number, height: number, select: () => void) {
    const strings = StringManager.getInstance().getResonanceStrings();
    const a11y = StringManager.getInstance().getResonanceA11yStrings();
    const frame = new Rectangle(0, 0, width, height, PANEL_CORNER_RADIUS, PANEL_CORNER_RADIUS, {
      fill: LewisStructuresColors.boardColorProperty,
      stroke: LewisStructuresColors.boardBorderColorProperty,
      lineWidth: 1.5,
    });
    const structure = new StructureNode(form.form.data, { pixelsPerBond: PIXELS_PER_BOND });
    const room = { width: width - 10, height: height - LABEL_HEIGHT - 6 };
    structure.setScaleMagnitude(Math.min(1, room.width / structure.width, room.height / structure.height));
    structure.centerX = width / 2;
    structure.centerY = (height - LABEL_HEIGHT) / 2 + 2;

    const numberProperty = new PatternStringProperty(strings.formPatternStringProperty, { number });
    const title = new Text(numberProperty, {
      font: NUMBER_FONT,
      fill: LewisStructuresColors.textColorProperty,
      maxWidth: width - 8,
      left: 5,
      bottom: height - 16,
    });
    const rank = new RichText(rankLabel(form.rank), {
      font: RANK_FONT,
      fill: LewisStructuresColors.mutedTextColorProperty,
      maxWidth: width - 8,
      left: 5,
      bottom: height - 4,
    });

    const accessibleNameProperty = new Property(
      StringUtils.fillIn(a11y.cardPatternStringProperty.value, {
        number,
        rank: rankLabel(form.rank),
        description: formDescription(form.form),
      }),
    );
    super({
      children: [frame, structure, title, rank],
      cursor: "pointer",
      tagName: "button",
      accessibleName: accessibleNameProperty,
    });
    this.frame = frame;
    this.addInputListener(new FireListener({ fire: select }));
    this.addInputListener({ click: select });

    this.disposeFormCardNode = () => {
      numberProperty.dispose();
      accessibleNameProperty.dispose();
      structure.dispose();
    };
  }

  public setSelected(selected: boolean): void {
    this.frame.stroke = selected
      ? LewisStructuresColors.accentColorProperty
      : LewisStructuresColors.boardBorderColorProperty;
    this.frame.lineWidth = selected ? 2.5 : 1.5;
  }

  public override dispose(): void {
    this.disposeFormCardNode();
    super.dispose();
  }
}
