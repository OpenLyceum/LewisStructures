/**
 * CurvedArrowsNode.ts
 *
 * Electron-pushing arrows drawn over a StructureNode: each arrow starts at a lone pair or a bond
 * and ends at a bond or a new lone pair, bowing away from the middle of the molecule so arrows do
 * not cross the bonds they describe.
 */

import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import type { ArrowEnd, ResonanceArrow } from "../model/resonance.js";
import type { StructureNode } from "./StructureNode.js";

const HEAD_LENGTH = 9;
const HEAD_WIDTH = 8;
const BOW = 0.45;

export class CurvedArrowsNode extends Node {
  public constructor(structureNode: StructureNode, arrows: readonly ResonanceArrow[]) {
    super({ pickable: false });
    const data = structureNode.data;
    const centroid = structureNode.centroid();

    // The other atom of a bond, seen from `atom`: where a lone pair heads to make that bond.
    const angleToward = (atom: number, bondIndex: number) => {
      const bond = data.bonds[bondIndex];
      const other = bond ? (bond.a === atom ? bond.b : bond.a) : atom;
      const delta = structureNode.atomPoint(other).minus(structureNode.atomPoint(atom));
      return Math.atan2(-delta.y, delta.x);
    };
    const point = (end: ArrowEnd, partner: ArrowEnd, isDestination: boolean): Vector2 => {
      if (end.kind === "bond") {
        return structureNode.bondPoint(end.bond);
      }
      const bondIndex = partner.kind === "bond" ? partner.bond : -1;
      return structureNode.lonePairPoint(
        end.atom,
        bondIndex >= 0 ? angleToward(end.atom, bondIndex) : 0,
        isDestination,
      );
    };

    for (const arrow of arrows) {
      const start = point(arrow.from, arrow.to, false);
      const end = point(arrow.to, arrow.from, true);
      const middle = start.average(end);
      let normal = end.minus(start).perpendicular.normalized();
      // Bow outward, away from the middle of the molecule.
      if (normal.dot(middle.minus(centroid)) < 0) {
        normal = normal.negated();
      }
      const length = Math.max(end.distance(start), 1);
      const control = middle.plus(normal.timesScalar(BOW * length + 6));
      const tangent = end.minus(control).normalized();
      const tip = end.minus(tangent.timesScalar(2));
      const base = tip.minus(tangent.timesScalar(HEAD_LENGTH));
      const side = tangent.perpendicular.timesScalar(HEAD_WIDTH / 2);

      this.addChild(
        new Path(new Shape().moveToPoint(start).quadraticCurveToPoint(control, base), {
          stroke: LewisStructuresColors.accentColorProperty,
          lineWidth: 2.5,
        }),
      );
      this.addChild(
        new Path(new Shape().moveToPoint(tip).lineToPoint(base.plus(side)).lineToPoint(base.minus(side)).close(), {
          fill: LewisStructuresColors.accentColorProperty,
        }),
      );
    }
  }
}
