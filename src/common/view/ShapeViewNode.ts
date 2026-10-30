/**
 * ShapeViewNode.ts
 *
 * A small rotatable ball-and-stick model of one VSEPR centre: the central atom, its bonded atoms on
 * the ideal polyhedron, and translucent lobes for its lone pairs. With at most seven atoms and six
 * lobes it is drawn with ordinary Scenery nodes, rebuilt and depth-sorted (painter's algorithm)
 * whenever it turns. Drag to rotate, or focus it and use the arrow keys.
 */

import { Multilink } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, KeyboardListener, Line, Node, Path, RadialGradient, Rectangle } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { PANEL_CORNER_RADIUS } from "../../LewisStructuresConstants.js";
import { type ElementSymbol, getElement } from "../model/ElementData.js";
import type { StructureData } from "../model/StructureData.js";
import { idealDirections, type Vec3, type VseprCenter } from "../model/vsepr.js";

/** Rotation per arrow-key press, radians. */
const KEY_STEP = Math.PI / 12;
/** Rotation per pixel dragged, radians. */
const DRAG_RATE = 0.012;
/** Ball radius = BALL_BASE + BALL_PER_PM × covalent radius, as a fraction of the bond length. */
const BALL_BASE = 0.12;
const BALL_PER_PM = 0.0013;
const LOBE_DISTANCE = 0.55;
const LOBE_LENGTH = 0.5;
const LOBE_WIDTH = 0.32;

const ELEMENT_COLORS: Record<ElementSymbol, (typeof LewisStructuresColors)["elementHColorProperty"]> = {
  H: LewisStructuresColors.elementHColorProperty,
  Be: LewisStructuresColors.elementBeColorProperty,
  B: LewisStructuresColors.elementBColorProperty,
  C: LewisStructuresColors.elementCColorProperty,
  N: LewisStructuresColors.elementNColorProperty,
  O: LewisStructuresColors.elementOColorProperty,
  F: LewisStructuresColors.elementFColorProperty,
  Al: LewisStructuresColors.elementAlColorProperty,
  Si: LewisStructuresColors.elementSiColorProperty,
  P: LewisStructuresColors.elementPColorProperty,
  S: LewisStructuresColors.elementSColorProperty,
  Cl: LewisStructuresColors.elementClColorProperty,
  Se: LewisStructuresColors.elementSeColorProperty,
  Br: LewisStructuresColors.elementBrColorProperty,
  I: LewisStructuresColors.elementIColorProperty,
  Xe: LewisStructuresColors.elementXeColorProperty,
};

type Ball = { readonly element: ElementSymbol; readonly position: Vec3 };

export class ShapeViewNode extends Node {
  private readonly scene = new Node();
  private readonly size: number;
  private balls: Ball[] = [];
  private lobes: Vec3[] = [];
  private yaw = 0.45;
  private pitch = 0.55;
  private readonly disposeShapeViewNode: () => void;

  public constructor(size: number) {
    const strings = StringManager.getInstance().getShapeStrings();
    const background = new Rectangle(0, 0, size, size, PANEL_CORNER_RADIUS, PANEL_CORNER_RADIUS, {
      fill: LewisStructuresColors.shapeBackgroundColorProperty,
      cursor: "grab",
    });
    super({
      tagName: "div",
      focusable: true,
      accessibleName: strings.modelNameStringProperty,
      accessibleHelpText: strings.rotateHelpStringProperty,
    });
    this.size = size;
    this.children = [background, this.scene];
    this.scene.pickable = false;

    let last = Vector2.ZERO;
    background.addInputListener(
      new DragListener({
        start: (event) => {
          last = event.pointer.point.copy();
        },
        drag: (event) => {
          const point = event.pointer.point;
          this.turn((point.x - last.x) * DRAG_RATE, (point.y - last.y) * DRAG_RATE);
          last = point.copy();
        },
      }),
    );
    const keyboardListener = new KeyboardListener({
      keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
      fire: (_event, key) => {
        const steps: Record<string, [number, number]> = {
          arrowLeft: [-KEY_STEP, 0],
          arrowRight: [KEY_STEP, 0],
          arrowUp: [0, -KEY_STEP],
          arrowDown: [0, KEY_STEP],
        };
        const [yaw, pitch] = steps[key] ?? [0, 0];
        this.turn(yaw, pitch);
      },
    });
    this.addInputListener(keyboardListener);

    // Shading is computed from colour values, so repaint when the colour profile changes.
    const colorMultilink = Multilink.multilinkAny(
      [
        ...Object.values(ELEMENT_COLORS),
        LewisStructuresColors.shapeBondColorProperty,
        LewisStructuresColors.electronColorProperty,
      ],
      () => this.render(),
    );
    this.disposeShapeViewNode = () => {
      colorMultilink.dispose();
      keyboardListener.dispose();
    };
  }

  /** Shows a centre of `data`, or nothing. */
  public showCenter(data: StructureData | null, center: VseprCenter | null): void {
    if (!(data && center)) {
      this.balls = [];
      this.lobes = [];
    } else {
      const directions = idealDirections(center);
      const centralAtom = data.atoms[center.atom];
      this.balls = centralAtom ? [{ element: centralAtom.element, position: { x: 0, y: 0, z: 0 } }] : [];
      center.bonded.forEach((neighbor, i) => {
        const atom = data.atoms[neighbor];
        const direction = directions.bonds[i];
        if (atom && direction) {
          this.balls.push({ element: atom.element, position: direction });
        }
      });
      this.lobes = directions.lonePairs;
    }
    this.render();
  }

  public override dispose(): void {
    this.disposeShapeViewNode();
    super.dispose();
  }

  private turn(yaw: number, pitch: number): void {
    this.yaw += yaw;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch + pitch));
    this.render();
  }

  /** Rotates by yaw about y, then pitch about x; z points at the viewer. */
  private rotatePoint(p: Vec3): Vec3 {
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const x1 = cy * p.x + sy * p.z;
    const z1 = -sy * p.x + cy * p.z;
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    return { x: x1, y: cp * p.y - sp * z1, z: sp * p.y + cp * z1 };
  }

  private render(): void {
    for (const child of this.scene.children) {
      child.dispose();
    }
    this.scene.removeAllChildren();
    if (this.balls.length === 0) {
      return;
    }
    const scale = this.size * 0.3;
    const center = new Vector2(this.size / 2, this.size / 2);
    const toView = (p: Vec3) => center.plusXY(p.x * scale, -p.y * scale);
    const items: { z: number; node: Node }[] = [];

    const centralView = this.rotatePoint({ x: 0, y: 0, z: 0 });
    for (const ball of this.balls.slice(1)) {
      const end = this.rotatePoint(ball.position);
      const a = toView(centralView);
      const b = toView(end);
      items.push({
        z: end.z / 2 - 0.01,
        node: new Line(a.x, a.y, b.x, b.y, {
          stroke: LewisStructuresColors.shapeBondColorProperty,
          lineWidth: 6,
          lineCap: "round",
        }),
      });
    }

    for (const lobe of this.lobes) {
      const tip = this.rotatePoint({ x: lobe.x * LOBE_DISTANCE, y: lobe.y * LOBE_DISTANCE, z: lobe.z * LOBE_DISTANCE });
      const viewTip = toView(tip);
      const along = viewTip.minus(center);
      // A lobe seen end-on is round; side-on it is long.
      const length = Math.max(LOBE_WIDTH, (LOBE_LENGTH * Math.hypot(tip.x, tip.y)) / LOBE_DISTANCE) * scale;
      const shape = Shape.ellipse(0, 0, length / 2, (LOBE_WIDTH * scale) / 2, 0);
      items.push({
        z: tip.z,
        node: new Path(shape, {
          fill: LewisStructuresColors.electronColorProperty,
          opacity: 0.6,
          rotation: along.magnitude > 1e-6 ? along.angle : 0,
          translation: viewTip,
        }),
      });
    }

    for (const ball of this.balls) {
      const p = this.rotatePoint(ball.position);
      const view = toView(p);
      const radius = (BALL_BASE + BALL_PER_PM * getElement(ball.element).radius) * scale;
      const color = ELEMENT_COLORS[ball.element].value;
      const gradient = new RadialGradient(-radius * 0.35, -radius * 0.35, 0, 0, 0, radius)
        .addColorStop(0, color.colorUtilsBrighter(0.6))
        .addColorStop(1, color.colorUtilsDarker(0.25));
      items.push({ z: p.z, node: new Path(Shape.circle(0, 0, radius), { fill: gradient, translation: view }) });
    }

    items.sort((a, b) => a.z - b.z);
    this.scene.children = items.map((item) => item.node);
  }
}
