/**
 * StructureNode.ts
 *
 * A Lewis structure drawn from StructureData, not editable: the gallery cards and the large form on
 * the Resonance screen, and the answer previews. It reuses AtomNode and BondNode so a static form
 * looks exactly like a drawn one, and is centred on its own origin.
 *
 * With a hybrid, bonds are drawn as solid lines for the whole part of the average order and a
 * dashed line for the fraction (4/3 → one solid, one dashed), each labelled with its order, and
 * atoms carry their average formal charge; lone pairs are left out, as in textbook hybrids.
 *
 * `lonePairPoint` and `bondPoint` give view positions for the curved arrows drawn over it.
 */

import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { ATOM_RADIUS, BOND_LINE_SPACING, BOND_LINE_WIDTH, ELECTRON_DISTANCE } from "../../LewisStructuresConstants.js";
import { analyzeStructure } from "../model/analyzeStructure.js";
import { LewisAtom, LewisBond } from "../model/LewisStructure.js";
import { electronAngles } from "../model/layoutStructure.js";
import type { ResonanceHybrid } from "../model/resonance.js";
import type { StructureData } from "../model/StructureData.js";
import { AtomNode } from "./AtomNode.js";
import { BondNode } from "./BondNode.js";
import { fractionText } from "./formatValues.js";

const LABEL_FONT = new PhetFont({ size: 12, weight: "bold" });
const INDEX_FONT = new PhetFont({ size: 10, weight: "bold" });
const END_GAP = 3;

export type StructureNodeOptions = {
  readonly pixelsPerBond: number;
  readonly hybrid?: ResonanceHybrid | null;
  readonly showAllFormalCharges?: boolean;
  readonly showOctetRings?: boolean;
  /** Number repeated elements (O1, O2, …) so descriptions that name them can be followed. */
  readonly showLabels?: boolean;
};

export class StructureNode extends Node {
  public readonly data: StructureData;
  private readonly viewPositions: Vector2[];
  private readonly atoms: LewisAtom[];

  public constructor(data: StructureData, options: StructureNodeOptions) {
    super({ pickable: false });
    this.data = data;
    const scale = options.pixelsPerBond;
    const xs = data.atoms.map((a) => a.x);
    const ys = data.atoms.map((a) => a.y);
    const cx = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
    const cy = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
    this.viewPositions = data.atoms.map((a) => new Vector2((a.x - cx) * scale, -(a.y - cy) * scale));

    const hybrid = options.hybrid ?? null;
    this.atoms = data.atoms.map((a, i) => {
      const atom = new LewisAtom(i, a.element, new Vector2(a.x, a.y));
      atom.lonePairs = hybrid ? 0 : a.lonePairs;
      atom.unpaired = hybrid ? 0 : a.unpaired;
      return atom;
    });

    const bondLayer = new Node();
    const atomLayer = new Node();
    const labelLayer = new Node();
    this.children = [bondLayer, atomLayer, labelLayer];

    data.bonds.forEach((bond, i) => {
      const a = this.viewPositions[bond.a] as Vector2;
      const b = this.viewPositions[bond.b] as Vector2;
      if (hybrid) {
        const order = hybrid.bondOrders[i] ?? bond.order;
        bondLayer.addChild(hybridBond(a, b, order));
        if (Math.abs(order - Math.round(order)) > 1e-6) {
          const normal = b.minus(a).normalized().perpendicular;
          labelLayer.addChild(
            new Text(fractionText(order), {
              font: LABEL_FONT,
              fill: LewisStructuresColors.accentColorProperty,
              center: a.average(b).plus(normal.timesScalar(14)),
            }),
          );
        }
      } else {
        const node = new BondNode(
          new LewisBond(this.atoms[bond.a] as LewisAtom, this.atoms[bond.b] as LewisAtom, bond.order),
        );
        node.update(a, b, false);
        bondLayer.addChild(node);
      }
    });

    const analysis = analyzeStructure(data);
    this.atoms.forEach((atom, i) => {
      const node = new AtomNode(atom);
      node.translation = this.viewPositions[i] as Vector2;
      node.update({
        analysis: hybrid ? null : (analysis.atoms[i] ?? null),
        bondAngles: this.bondAngles(i),
        selected: false,
        partner: false,
        showAllFormalCharges: options.showAllFormalCharges ?? false,
        showOctetRing: !hybrid && (options.showOctetRings ?? false),
      });
      atomLayer.addChild(node);

      if (options.showLabels && data.atoms.filter((other) => other.element === atom.element).length > 1) {
        const number = data.atoms.slice(0, i + 1).filter((other) => other.element === atom.element).length;
        labelLayer.addChild(
          new Text(`${number}`, {
            font: INDEX_FONT,
            fill: LewisStructuresColors.mutedTextColorProperty,
            left: (this.viewPositions[i] as Vector2).x + ATOM_RADIUS * 0.55,
            top: (this.viewPositions[i] as Vector2).y + ATOM_RADIUS * 0.25,
          }),
        );
      }

      const charge = hybrid?.formalCharges[i] ?? 0;
      if (hybrid && Math.abs(charge) > 1e-6) {
        const angle =
          electronAngles(this.bondAngles(i), 1, [
            Math.PI / 4,
            (3 * Math.PI) / 4,
            -Math.PI / 4,
            (-3 * Math.PI) / 4,
          ])[0] ?? 0;
        labelLayer.addChild(
          new Text(fractionText(charge, true), {
            font: LABEL_FONT,
            fill:
              charge > 0
                ? LewisStructuresColors.positiveChargeColorProperty
                : LewisStructuresColors.negativeChargeColorProperty,
            center: (this.viewPositions[i] as Vector2).plus(Vector2.createPolar(ATOM_RADIUS + 12, -angle)),
          }),
        );
      }
    });
  }

  /** View position of atom i. */
  public atomPoint(i: number): Vector2 {
    return this.viewPositions[i] ?? Vector2.ZERO;
  }

  /** Bond directions (radians, y up) at atom i. */
  public bondAngles(i: number): number[] {
    const angles: number[] = [];
    for (const bond of this.data.bonds) {
      const other = bond.a === i ? bond.b : bond.b === i ? bond.a : -1;
      if (other >= 0) {
        const delta = (this.viewPositions[other] as Vector2).minus(this.viewPositions[i] as Vector2);
        angles.push(Math.atan2(-delta.y, delta.x));
      }
    }
    return angles;
  }

  /**
   * Where a lone pair of atom i sits, choosing the drawn pair nearest the direction `towardAngle`
   * (radians, y up); with `extra`, the spot a new lone pair would take.
   */
  public lonePairPoint(i: number, towardAngle: number, extra = false): Vector2 {
    const atom = this.atoms[i];
    const pairs = atom ? atom.lonePairs : 0;
    const groups = pairs + (atom?.unpaired ?? 0);
    let angle = towardAngle;
    if (extra) {
      const angles = electronAngles(this.bondAngles(i), groups + 1);
      angle = angles[angles.length - 1] ?? towardAngle;
    } else if (pairs > 0) {
      const angles = electronAngles(this.bondAngles(i), groups).slice(0, pairs);
      const distance = (a: number) => Math.abs(Math.atan2(Math.sin(a - towardAngle), Math.cos(a - towardAngle)));
      angle = angles.reduce((best, a) => (distance(a) < distance(best) ? a : best), angles[0] ?? towardAngle);
    }
    return this.atomPoint(i).plus(Vector2.createPolar(ELECTRON_DISTANCE + 3, -angle));
  }

  /** The middle of bond k. */
  public bondPoint(k: number): Vector2 {
    const bond = this.data.bonds[k];
    return bond ? this.atomPoint(bond.a).average(this.atomPoint(bond.b)) : Vector2.ZERO;
  }

  /** The centre of the drawing (the average atom position), for bowing arrows outward. */
  public centroid(): Vector2 {
    const n = this.viewPositions.length;
    return n === 0 ? Vector2.ZERO : this.viewPositions.reduce((sum, p) => sum.plus(p), Vector2.ZERO).timesScalar(1 / n);
  }

  public override dispose(): void {
    for (const atom of this.atoms) {
      atom.dispose();
    }
    super.dispose();
  }
}

/** Solid lines for the whole part of the order, a dashed line for the fraction. */
function hybridBond(a: Vector2, b: Vector2, order: number): Node {
  const direction = b.minus(a).normalized();
  const start = a.plus(direction.timesScalar(ATOM_RADIUS + END_GAP));
  const end = b.minus(direction.timesScalar(ATOM_RADIUS + END_GAP));
  const normal = direction.perpendicular;
  const whole = Math.floor(order + 1e-6);
  const fractional = order - whole > 1e-6;
  const lines = whole + (fractional ? 1 : 0);
  const solid = new Shape();
  const dashed = new Shape();
  for (let k = 0; k < lines; k++) {
    const offset = normal.timesScalar((k - (lines - 1) / 2) * BOND_LINE_SPACING);
    (k < whole ? solid : dashed).moveToPoint(start.plus(offset)).lineToPoint(end.plus(offset));
  }
  return new Node({
    children: [
      new Path(solid, { stroke: LewisStructuresColors.atomSymbolColorProperty, lineWidth: BOND_LINE_WIDTH }),
      new Path(dashed, {
        stroke: LewisStructuresColors.atomSymbolColorProperty,
        lineWidth: BOND_LINE_WIDTH,
        lineDash: [4, 3],
      }),
    ],
  });
}
