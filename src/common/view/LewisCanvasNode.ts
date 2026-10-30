/**
 * LewisCanvasNode.ts
 *
 * The drawing board. It keeps one AtomNode per atom and one BondNode per bond in step with the
 * DrawingModel, and turns pointer input into edits:
 *
 *   - drag an atom's disc to move it; drop it on the palette to delete it; click it to select it
 *   - drag from an atom's bonding ring to another atom: a single bond, or the next order if bonded
 *   - click a bond to step its order (1 → 2 → 3 → 1) and select it
 *   - click the empty board to clear the selection
 *
 * Model coordinates are bond lengths with y up; a ModelViewTransform2 maps them to the board.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DragListener, FireListener, Line, Node, Rectangle, RichText, type SceneryEvent } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { CLICK_TOLERANCE, PANEL_CORNER_RADIUS, PIXELS_PER_BOND } from "../../LewisStructuresConstants.js";
import type { DrawingModel } from "../model/DrawingModel.js";
import type { LewisAtom, LewisBond } from "../model/LewisStructure.js";
import type { StructureData } from "../model/StructureData.js";
import { AtomNode } from "./AtomNode.js";
import { BoardKeyboardController } from "./BoardKeyboardController.js";
import { BondNode } from "./BondNode.js";

/** How close (bond lengths) a drop must be to an atom's centre to bond to it. */
const DROP_RADIUS = 0.45;

export type LewisCanvasDisplayOptions = {
  readonly showAllFormalChargesProperty: TReadOnlyProperty<boolean>;
  readonly showOctetRingsProperty: TReadOnlyProperty<boolean>;
  /** Text shown in the middle of an empty board. */
  readonly hintStringProperty: TReadOnlyProperty<string>;
  /** The species being drawn (its formula sets the electron total), or null in free build. */
  readonly targetProperty: TReadOnlyProperty<StructureData | null>;
};

export class LewisCanvasNode extends Node {
  public readonly drawing: DrawingModel;
  public readonly modelViewTransform: ModelViewTransform2;
  private readonly atomNodes = new Map<LewisAtom, AtomNode>();
  private readonly bondNodes = new Map<LewisBond, BondNode>();
  private readonly positionListeners = new Map<LewisAtom, () => void>();
  private readonly atomLayer = new Node();
  private readonly bondLayer = new Node();
  private readonly rubberBand: Line;
  private readonly display: LewisCanvasDisplayOptions;
  /** The keyboard path through the board; its partner is the other end of a bond in bond mode. */
  public readonly keyboardController: BoardKeyboardController;
  /** Returns true when a global point is over the delete zone (the element palette). */
  private isOverDeleteZone: (globalPoint: Vector2) => boolean = () => false;
  private readonly disposeLewisCanvasNode: () => void;

  public constructor(drawing: DrawingModel, width: number, height: number, display: LewisCanvasDisplayOptions) {
    const a11y = StringManager.getInstance().getBoardA11yStrings();
    super({
      tagName: "div",
      focusable: true,
      accessibleName: a11y.nameStringProperty,
      accessibleHelpText: a11y.helpTextStringProperty,
    });
    this.drawing = drawing;
    this.display = display;
    this.modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      drawing.bounds.center,
      new Vector2(width / 2, height / 2),
      PIXELS_PER_BOND,
    );

    const board = new Rectangle(0, 0, width, height, PANEL_CORNER_RADIUS, PANEL_CORNER_RADIUS, {
      fill: LewisStructuresColors.boardColorProperty,
      stroke: LewisStructuresColors.boardBorderColorProperty,
    });
    board.addInputListener(new FireListener({ fire: () => drawing.selectAtom(null) }));

    const hint = new RichText(display.hintStringProperty, {
      font: new PhetFont(14),
      fill: LewisStructuresColors.mutedTextColorProperty,
      lineWrap: width * 0.7,
      align: "center",
      pickable: false,
    });
    hint.boundsProperty.link(() => {
      hint.center = new Vector2(width / 2, height / 2);
    });

    this.rubberBand = new Line(0, 0, 0, 0, {
      stroke: LewisStructuresColors.accentColorProperty,
      lineWidth: 2,
      lineDash: [5, 4],
      visible: false,
      pickable: false,
    });

    this.children = [board, hint, this.bondLayer, this.rubberBand, this.atomLayer];
    this.clipArea = Shape.bounds(new Bounds2(0, 0, width, height));

    // ── Keyboard ────────────────────────────────────────────────────────────
    const keyboardController = new BoardKeyboardController(drawing, this, display.targetProperty);
    this.keyboardController = keyboardController;
    this.addInputListener(keyboardController.listener);
    const focusListener = {
      focus: () => keyboardController.onFocus(),
      blur: () => keyboardController.onBlur(),
    };
    this.addInputListener(focusListener);

    const structure = drawing.structure;
    const onAdded = (atom: LewisAtom) => this.addAtomNode(atom);
    const onRemoved = (atom: LewisAtom) => this.removeAtomNode(atom);
    const onChanged = () => {
      hint.visible = structure.atoms.length === 0;
      this.syncBonds();
      this.updateAll();
    };
    structure.atomAddedEmitter.addListener(onAdded);
    structure.atomRemovedEmitter.addListener(onRemoved);
    structure.changedEmitter.addListener(onChanged);
    for (const atom of structure.atoms) {
      this.addAtomNode(atom);
    }
    const displayMultilink = Multilink.multilink(
      [
        drawing.selectedAtomProperty,
        drawing.selectedBondProperty,
        display.showAllFormalChargesProperty,
        display.showOctetRingsProperty,
        keyboardController.partnerProperty,
      ],
      () => this.updateAll(),
    );
    onChanged();

    this.disposeLewisCanvasNode = () => {
      structure.atomAddedEmitter.removeListener(onAdded);
      structure.atomRemovedEmitter.removeListener(onRemoved);
      structure.changedEmitter.removeListener(onChanged);
      displayMultilink.dispose();
      this.removeInputListener(focusListener);
      this.removeInputListener(keyboardController.listener);
      keyboardController.dispose();
      for (const atom of [...this.atomNodes.keys()]) {
        this.removeAtomNode(atom);
      }
    };
  }

  /** The species being drawn, or null in free build. */
  public get targetProperty(): TReadOnlyProperty<StructureData | null> {
    return this.display.targetProperty;
  }

  /** Sets what counts as the delete zone for dragged atoms (the element palette). */
  public setDeleteZone(isOverDeleteZone: (globalPoint: Vector2) => boolean): void {
    this.isOverDeleteZone = isOverDeleteZone;
  }

  public getAtomNode(atom: LewisAtom): AtomNode | null {
    return this.atomNodes.get(atom) ?? null;
  }

  /** Model point (bond lengths) under a global point. */
  public globalToModel(globalPoint: Vector2): Vector2 {
    return this.modelViewTransform.viewToModelPosition(this.globalToLocalPoint(globalPoint));
  }

  /** Whether a global point is over the board. */
  public containsGlobal(globalPoint: Vector2): boolean {
    return this.drawing.contains(this.globalToModel(globalPoint));
  }

  /** The atom whose centre is within reach of a model point, other than `except`. */
  public atomAt(point: Vector2, except: LewisAtom | null = null): LewisAtom | null {
    let nearest: LewisAtom | null = null;
    let nearestDistance = DROP_RADIUS;
    for (const atom of this.drawing.structure.atoms) {
      const distance = atom.positionProperty.value.distance(point);
      if (atom !== except && distance < nearestDistance) {
        nearest = atom;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  public override dispose(): void {
    this.disposeLewisCanvasNode();
    super.dispose();
  }

  // ── Atoms ──────────────────────────────────────────────────────────────────

  private addAtomNode(atom: LewisAtom): void {
    const node = new AtomNode(atom);
    this.atomNodes.set(atom, node);
    this.atomLayer.addChild(node);

    const onPosition = () => this.onAtomMoved(atom);
    atom.positionProperty.link(onPosition);
    this.positionListeners.set(atom, onPosition);

    node.coreNode.addInputListener(this.createMoveListener(atom));
    node.bondHandleNode.addInputListener(this.createBondListener(atom));
  }

  private removeAtomNode(atom: LewisAtom): void {
    const node = this.atomNodes.get(atom);
    const onPosition = this.positionListeners.get(atom);
    if (onPosition && atom.positionProperty.hasListener(onPosition)) {
      atom.positionProperty.unlink(onPosition);
    }
    this.positionListeners.delete(atom);
    if (node) {
      this.atomNodes.delete(atom);
      this.atomLayer.removeChild(node);
      node.dispose();
    }
  }

  /** Moves the atom, or selects it when the pointer barely moved; deletes it when dropped on the palette. */
  private createMoveListener(atom: LewisAtom): DragListener {
    const structure = this.drawing.structure;
    let startGlobal = Vector2.ZERO;
    let offset = Vector2.ZERO;
    let moved = false;
    const pointerModel = (event: SceneryEvent) => this.globalToModel(event.pointer.point);
    return new DragListener({
      start: (event) => {
        startGlobal = event.pointer.point.copy();
        offset = atom.positionProperty.value.minus(pointerModel(event));
        moved = false;
      },
      drag: (event) => {
        if (!moved) {
          if (event.pointer.point.distance(startGlobal) < CLICK_TOLERANCE) {
            return;
          }
          moved = true;
          structure.startMove();
        }
        atom.positionProperty.value = this.drawing.clamp(pointerModel(event).plus(offset));
      },
      end: (event) => {
        if (moved && event && this.isOverDeleteZone(event.pointer.point)) {
          structure.removeAtom(atom);
        } else {
          this.drawing.selectAtom(atom);
        }
      },
    });
  }

  /** Drags a rubber band from the atom; dropping on another atom bonds them. */
  private createBondListener(atom: LewisAtom): DragListener {
    let startGlobal = Vector2.ZERO;
    let moved = false;
    return new DragListener({
      start: (event) => {
        startGlobal = event.pointer.point.copy();
        moved = false;
        const start = this.modelViewTransform.modelToViewPosition(atom.positionProperty.value);
        this.rubberBand.setLine(start.x, start.y, start.x, start.y);
        this.rubberBand.visible = true;
      },
      drag: (event) => {
        moved = moved || event.pointer.point.distance(startGlobal) >= CLICK_TOLERANCE;
        this.rubberBand.setPoint2(this.globalToLocalPoint(event.pointer.point));
      },
      end: (event) => {
        this.rubberBand.visible = false;
        if (!(event && moved)) {
          this.drawing.selectAtom(atom);
          return;
        }
        const target = this.atomAt(this.globalToModel(event.pointer.point), atom);
        if (target) {
          const bond = this.drawing.bondOrCycle(atom, target);
          this.drawing.selectBond(bond);
        }
      },
    });
  }

  private onAtomMoved(atom: LewisAtom): void {
    const node = this.atomNodes.get(atom);
    if (node) {
      node.translation = this.modelViewTransform.modelToViewPosition(atom.positionProperty.value);
    }
    // The bond directions of the atom and its neighbours changed, so their electrons move too.
    const structure = this.drawing.structure;
    this.updateAtom(atom);
    for (const bond of structure.bondsOf(atom)) {
      this.updateAtom(bond.other(atom));
      this.updateBond(bond);
    }
  }

  // ── Bonds ──────────────────────────────────────────────────────────────────

  private syncBonds(): void {
    const bonds = new Set(this.drawing.structure.bonds);
    for (const [bond, node] of this.bondNodes) {
      if (!bonds.has(bond)) {
        this.bondNodes.delete(bond);
        this.bondLayer.removeChild(node);
        node.dispose();
      }
    }
    for (const bond of bonds) {
      if (!this.bondNodes.has(bond)) {
        const node = new BondNode(bond);
        node.addInputListener(
          new FireListener({
            fire: () => {
              this.drawing.structure.cycleBondOrder(bond);
              this.drawing.selectBond(bond);
            },
          }),
        );
        this.bondNodes.set(bond, node);
        this.bondLayer.addChild(node);
      }
    }
  }

  // ── Updates ────────────────────────────────────────────────────────────────

  private updateAll(): void {
    // In bond mode, a dashed line joins the selected atom to the chosen partner.
    const partner = this.keyboardController.partnerProperty.value;
    const selected = this.drawing.selectedAtomProperty.value;
    if (partner && selected) {
      const a = this.modelViewTransform.modelToViewPosition(selected.positionProperty.value);
      const b = this.modelViewTransform.modelToViewPosition(partner.positionProperty.value);
      this.rubberBand.setLine(a.x, a.y, b.x, b.y);
    }
    this.rubberBand.visible = partner !== null && selected !== null;

    for (const atom of this.drawing.structure.atoms) {
      const node = this.atomNodes.get(atom);
      if (node) {
        node.translation = this.modelViewTransform.modelToViewPosition(atom.positionProperty.value);
      }
      this.updateAtom(atom);
    }
    for (const bond of this.drawing.structure.bonds) {
      this.updateBond(bond);
    }
  }

  private updateAtom(atom: LewisAtom): void {
    const node = this.atomNodes.get(atom);
    if (!node) {
      return;
    }
    node.update({
      analysis: this.drawing.structure.analysisOf(atom),
      bondAngles: this.drawing.bondAnglesOf(atom),
      selected: this.drawing.selectedAtomProperty.value === atom,
      partner: this.keyboardController.partnerProperty.value === atom,
      showAllFormalCharges: this.display.showAllFormalChargesProperty.value,
      showOctetRing: this.display.showOctetRingsProperty.value,
    });
  }

  private updateBond(bond: LewisBond): void {
    const node = this.bondNodes.get(bond);
    if (node) {
      node.update(
        this.modelViewTransform.modelToViewPosition(bond.atomA.positionProperty.value),
        this.modelViewTransform.modelToViewPosition(bond.atomB.positionProperty.value),
        this.drawing.selectedBondProperty.value === bond,
      );
    }
  }
}
