/**
 * AtomNode.ts
 *
 * One atom on the drawing board: its element symbol on a disc you can drag, its lone pairs and
 * unpaired electron as dots in the widest gaps between its bonds, a formal-charge badge, an octet
 * ring coloured by OctetStatus, and the bonding ring (shown on hover or selection) that you drag
 * from to make a bond. The node holds no state of its own: LewisCanvasNode calls update() after
 * every change, and the board's listeners handle input.
 */

import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import {
  ATOM_RADIUS,
  BOND_HANDLE_RADIUS,
  CHARGE_BADGE_RADIUS,
  ELECTRON_DISTANCE,
  ELECTRON_DOT_RADIUS,
  OCTET_RING_RADIUS,
  PAIR_GAP,
} from "../../LewisStructuresConstants.js";
import type { AtomAnalysis } from "../model/analyzeStructure.js";
import type { LewisAtom } from "../model/LewisStructure.js";
import { electronAngles } from "../model/layoutStructure.js";
import { OctetStatus } from "../model/OctetStatus.js";
import { badgeCharge } from "./formatValues.js";

const SYMBOL_FONT = new PhetFont({ size: 21, weight: "bold" });
const BADGE_FONT = new PhetFont({ size: 11, weight: "bold" });
const RING_DASH = [4, 3];
/** How far out the formal-charge badge sits, px. */
const BADGE_DISTANCE = 26;
/** The badge sits on a diagonal, upper right first, clear of the textbook electron positions. */
const DIAGONALS = [45, 135, 315, 225].map((degrees) => (degrees * Math.PI) / 180);

export type AtomDisplay = {
  readonly analysis: AtomAnalysis | null;
  /** Directions of the atom's bonds, radians, y up (model convention). */
  readonly bondAngles: readonly number[];
  readonly selected: boolean;
  /** The keyboard bond partner (drawn with a second dashed ring). */
  readonly partner: boolean;
  readonly showAllFormalCharges: boolean;
  readonly showOctetRing: boolean;
};

export class AtomNode extends Node {
  public readonly atom: LewisAtom;
  /** The disc and symbol: press here to move or select the atom. */
  public readonly coreNode: Node;
  /** The ring outside the disc: press here to drag out a bond. */
  public readonly bondHandleNode: Circle;
  private readonly octetRing: Circle;
  private readonly selectionRing: Circle;
  private readonly partnerRing: Circle;
  private readonly electronsPath: Path;
  private readonly badge: Node;
  private readonly badgeCircle: Circle;
  private readonly badgeText: Text;
  private hovered = false;
  private selected = false;

  public constructor(atom: LewisAtom) {
    // Always pickable (a transparent fill still hits), so hovering over it can reveal it.
    const bondHandleNode = new Circle(BOND_HANDLE_RADIUS, { fill: "transparent", cursor: "crosshair" });
    const octetRing = new Circle(OCTET_RING_RADIUS, { lineWidth: 1.5, opacity: 0.75, pickable: false });
    const disc = new Circle(ATOM_RADIUS, {
      fill: LewisStructuresColors.atomDiscColorProperty,
      stroke: LewisStructuresColors.boardBorderColorProperty,
    });
    const symbol = new Text(atom.element, {
      font: SYMBOL_FONT,
      fill: LewisStructuresColors.atomSymbolColorProperty,
      center: Vector2.ZERO,
      maxWidth: 2 * ATOM_RADIUS - 2,
    });
    const coreNode = new Node({ children: [disc, symbol], cursor: "pointer" });
    const selectionRing = new Circle(ATOM_RADIUS + 4, {
      stroke: LewisStructuresColors.accentColorProperty,
      lineWidth: 2,
      lineDash: RING_DASH,
      visible: false,
      pickable: false,
    });
    const partnerRing = new Circle(ATOM_RADIUS + 8, {
      stroke: LewisStructuresColors.accentColorProperty,
      lineWidth: 2,
      lineDash: [2, 3],
      visible: false,
      pickable: false,
    });
    const electronsPath = new Path(null, { fill: LewisStructuresColors.electronColorProperty, pickable: false });
    const badgeCircle = new Circle(CHARGE_BADGE_RADIUS);
    const badgeText = new Text("", {
      font: BADGE_FONT,
      fill: LewisStructuresColors.chargeTextColorProperty,
      maxWidth: 2 * CHARGE_BADGE_RADIUS,
    });
    const badge = new Node({ children: [badgeCircle, badgeText], pickable: false, visible: false });

    super({
      children: [bondHandleNode, octetRing, coreNode, selectionRing, partnerRing, electronsPath, badge],
    });

    this.atom = atom;
    this.coreNode = coreNode;
    this.bondHandleNode = bondHandleNode;
    this.octetRing = octetRing;
    this.selectionRing = selectionRing;
    this.partnerRing = partnerRing;
    this.electronsPath = electronsPath;
    this.badge = badge;
    this.badgeCircle = badgeCircle;
    this.badgeText = badgeText;

    this.addInputListener({
      enter: () => {
        this.hovered = true;
        this.updateHandle();
      },
      exit: () => {
        this.hovered = false;
        this.updateHandle();
      },
    });
  }

  public update(display: AtomDisplay): void {
    const atom = this.atom;
    this.selected = display.selected;
    this.selectionRing.visible = display.selected;
    this.partnerRing.visible = display.partner;
    this.updateHandle();

    // Electrons: lone pairs first, then the unpaired electron, in the widest gaps between bonds.
    const groups = atom.lonePairs + atom.unpaired;
    const angles = electronAngles(display.bondAngles, groups);
    const shape = new Shape();
    angles.forEach((angle, i) => {
      // Model angles are y up; the view is y down.
      const direction = Vector2.createPolar(1, -angle);
      const center = direction.timesScalar(ELECTRON_DISTANCE);
      if (i < atom.lonePairs) {
        const offset = direction.perpendicular.timesScalar(PAIR_GAP / 2);
        shape.circle(center.plus(offset), ELECTRON_DOT_RADIUS).newSubpath();
        shape.circle(center.minus(offset), ELECTRON_DOT_RADIUS).newSubpath();
      } else {
        shape.circle(center, ELECTRON_DOT_RADIUS).newSubpath();
      }
    });
    this.electronsPath.shape = shape;

    const analysis = display.analysis;
    const formalCharge = analysis?.formalCharge ?? 0;
    this.badge.visible = analysis !== null && (formalCharge !== 0 || display.showAllFormalCharges);
    if (this.badge.visible) {
      this.badgeCircle.fill =
        formalCharge > 0
          ? LewisStructuresColors.positiveChargeColorProperty
          : formalCharge < 0
            ? LewisStructuresColors.negativeChargeColorProperty
            : LewisStructuresColors.zeroChargeColorProperty;
      this.badgeText.string = badgeCharge(formalCharge);
      this.badgeText.center = Vector2.ZERO;
      // The badge takes the free diagonal farthest from the bonds and electrons.
      const badgeAngle = electronAngles([...display.bondAngles, ...angles], 1, DIAGONALS)[0] ?? Math.PI / 4;
      this.badge.translation = Vector2.createPolar(BADGE_DISTANCE, -badgeAngle);
    }

    const status = analysis?.status ?? null;
    this.octetRing.visible = display.showOctetRing && status !== null;
    if (status) {
      this.octetRing.stroke = !status.satisfied
        ? status === OctetStatus.OVER
          ? LewisStructuresColors.poorColorProperty
          : LewisStructuresColors.warningColorProperty
        : LewisStructuresColors.goodColorProperty;
      const exception =
        status === OctetStatus.INCOMPLETE_ALLOWED || status === OctetStatus.EXPANDED || status === OctetStatus.RADICAL;
      this.octetRing.lineDash = exception ? RING_DASH : [];
    }
  }

  private updateHandle(): void {
    this.bondHandleNode.fill =
      this.hovered || this.selected ? LewisStructuresColors.bondHandleColorProperty : "transparent";
  }
}
