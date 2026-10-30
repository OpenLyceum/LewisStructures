/**
 * ShapePreviewNode.ts
 *
 * The VSEPR shape of a finished structure, as an inset on the board: AXₙEₘ with the molecular
 * shape, the electron-domain geometry and the bond angles, over a rotatable 3D model of the
 * central atom. A structure with several centres (C₂H₄, CH₃OH) lists the shape around each one
 * instead; an unfinished one asks to be finished first. The text is also the model's accessible
 * description.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { RichText, VBox } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { LewisStructuresPanel } from "../LewisStructuresPanel.js";
import { analyzeStructure } from "../model/analyzeStructure.js";
import type { StructureData } from "../model/StructureData.js";
import { type AngleText, singleCenter, type VseprCenter, vseprCenters } from "../model/vsepr.js";
import { atomLabels } from "./boardDescriptions.js";
import { HEADING_FONT, SMALL_FONT } from "./ControlFactory.js";
import { ShapeViewNode } from "./ShapeViewNode.js";

const VIEW_SIZE = 150;

function geometryName(geometry: string): string {
  const geometries = StringManager.getInstance().getShapeStrings().geometries as unknown as Record<
    string,
    { value: string } | undefined
  >;
  return geometries[`${geometry}StringProperty`]?.value ?? geometry;
}

function anglesName(angles: AngleText): string {
  const strings = StringManager.getInstance().getShapeStrings().angles;
  const byAngles: Record<AngleText, { value: string }> = {
    "180": strings.a180StringProperty,
    "120": strings.a120StringProperty,
    lessThan120: strings.lessThan120StringProperty,
    "109.5": strings.a109StringProperty,
    "lessThan109.5": strings.lessThan109StringProperty,
    "90And120": strings.a90And120StringProperty,
    lessThan90And120: strings.lessThan90And120StringProperty,
    lessThan90: strings.lessThan90StringProperty,
    "90": strings.a90StringProperty,
  };
  return byAngles[angles].value;
}

/** The lines describing a structure's shape, for display and for speech. */
export function shapeDescription(data: StructureData): { lines: string[]; center: VseprCenter | null } {
  const strings = StringManager.getInstance().getShapeStrings();
  if (data.atoms.length === 0 || !analyzeStructure(data).complete) {
    return { lines: [strings.finishFirstStringProperty.value], center: null };
  }
  if (data.atoms.length === 2) {
    return { lines: [strings.twoAtomsStringProperty.value], center: null };
  }
  const center = singleCenter(data);
  if (center) {
    return {
      center,
      lines: [
        StringUtils.fillIn(strings.notationPatternStringProperty.value, {
          notation: center.notation,
          geometry: geometryName(center.molecularGeometry),
        }),
        StringUtils.fillIn(strings.electronGeometryPatternStringProperty.value, {
          geometry: geometryName(center.electronGeometry),
        }),
        StringUtils.fillIn(strings.anglesPatternStringProperty.value, { angles: anglesName(center.angles) }),
      ],
    };
  }
  const labels = atomLabels(data);
  return {
    center: null,
    lines: [
      strings.manyCentersStringProperty.value,
      ...vseprCenters(data).map((c) =>
        StringUtils.fillIn(strings.centerPatternStringProperty.value, {
          atom: labels[c.atom],
          geometry: geometryName(c.molecularGeometry),
          notation: c.notation,
        }),
      ),
    ],
  };
}

export class ShapePreviewNode extends LewisStructuresPanel {
  private readonly view: ShapeViewNode;
  private readonly text: RichText;

  public constructor(width: number) {
    const strings = StringManager.getInstance().getShapeStrings();
    const view = new ShapeViewNode(VIEW_SIZE);
    const text = new RichText("", { font: SMALL_FONT, fill: LewisStructuresColors.textColorProperty, lineWrap: width });
    super(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new RichText(strings.titleStringProperty, {
            font: HEADING_FONT,
            fill: LewisStructuresColors.textColorProperty,
          }),
          view,
          text,
        ],
      }),
      { xMargin: 12, yMargin: 10, minWidth: width + 24, align: "left" },
    );
    this.view = view;
    this.text = text;
  }

  /** Shows the shape of `data` (or a request to finish it). */
  public update(data: StructureData): void {
    const { lines, center } = shapeDescription(data);
    this.text.string = lines.join("<br>");
    this.view.visible = center !== null;
    this.view.showCenter(center ? data : null, center);
    this.view.accessibleParagraph = lines.join(" ");
  }

  public override dispose(): void {
    this.view.dispose();
    super.dispose();
  }
}
