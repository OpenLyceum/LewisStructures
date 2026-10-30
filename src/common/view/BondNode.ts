/**
 * BondNode.ts
 *
 * One bond on the drawing board: one to three parallel lines between the two atoms, stopping at
 * their discs, with a wide invisible strip around them so the bond is easy to click.
 */

import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path } from "scenerystack/scenery";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { ATOM_RADIUS, BOND_LINE_SPACING, BOND_LINE_WIDTH } from "../../LewisStructuresConstants.js";
import type { LewisBond } from "../model/LewisStructure.js";

/** Width of the clickable strip around a bond, px. */
const HIT_WIDTH = 14;
/** Extra gap between a bond line and the disc it meets, px. */
const END_GAP = 3;

export class BondNode extends Node {
  public readonly bond: LewisBond;
  private readonly linesPath: Path;
  private readonly hitLine: Line;
  private readonly selectionPath: Path;

  public constructor(bond: LewisBond) {
    const hitLine = new Line(0, 0, 0, 0, { stroke: "transparent", lineWidth: HIT_WIDTH, lineCap: "round" });
    const selectionPath = new Path(null, {
      stroke: LewisStructuresColors.accentColorProperty,
      lineWidth: HIT_WIDTH - 4,
      lineCap: "round",
      opacity: 0.35,
      visible: false,
      pickable: false,
    });
    const linesPath = new Path(null, {
      stroke: LewisStructuresColors.atomSymbolColorProperty,
      lineWidth: BOND_LINE_WIDTH,
      lineCap: "round",
      pickable: false,
    });
    super({ children: [hitLine, selectionPath, linesPath], cursor: "pointer" });
    this.bond = bond;
    this.linesPath = linesPath;
    this.hitLine = hitLine;
    this.selectionPath = selectionPath;
  }

  /** Redraws between two view points (the atom centres). */
  public update(a: Vector2, b: Vector2, selected: boolean): void {
    const delta = b.minus(a);
    const length = delta.magnitude;
    const shape = new Shape();
    const trim = ATOM_RADIUS + END_GAP;
    if (length > 2 * trim) {
      const direction = delta.normalized();
      const start = a.plus(direction.timesScalar(trim));
      const end = b.minus(direction.timesScalar(trim));
      const normal = direction.perpendicular;
      const order = this.bond.order;
      for (let k = 0; k < order; k++) {
        const offset = normal.timesScalar((k - (order - 1) / 2) * BOND_LINE_SPACING);
        shape.moveToPoint(start.plus(offset)).lineToPoint(end.plus(offset));
      }
      this.hitLine.setPoint1(start);
      this.hitLine.setPoint2(end);
      this.selectionPath.shape = new Shape().moveToPoint(start).lineToPoint(end);
    }
    this.linesPath.shape = shape;
    this.selectionPath.visible = selected;
  }
}
