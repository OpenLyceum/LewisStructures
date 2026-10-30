/**
 * DrawingModel.ts
 *
 * A drawing board shared by the three screens: the LewisStructure being edited, what is selected,
 * the board's extent in bond lengths, and the higher-level edits the palette, the selection bar and
 * the keyboard need (add an atom next to the selected one and bond it, bond or cycle between two
 * atoms, tidy the layout, lay out a structure from data).
 */

import { Property } from "scenerystack/axon";
import { Bounds2, type Vector2 } from "scenerystack/dot";
import type { ElementSymbol } from "./ElementData.js";
import { type LewisAtom, type LewisBond, LewisStructure } from "./LewisStructure.js";
import { freeSpotNear, tidyLayout } from "./layoutStructure.js";
import type { StructureData } from "./StructureData.js";

export class DrawingModel {
  public readonly structure: LewisStructure;
  public readonly selectedAtomProperty = new Property<LewisAtom | null>(null);
  public readonly selectedBondProperty = new Property<LewisBond | null>(null);
  /** The board in bond lengths, centred on the origin, y up. */
  public readonly bounds: Bounds2;

  public constructor(bounds: Bounds2) {
    this.bounds = bounds;
    this.structure = new LewisStructure();

    // Drop a selection whose atom or bond no longer exists (deleted, undone, replaced).
    this.structure.changedEmitter.addListener(() => {
      const atom = this.selectedAtomProperty.value;
      if (atom && !this.structure.atoms.includes(atom)) {
        this.selectedAtomProperty.value = null;
      }
      const bond = this.selectedBondProperty.value;
      if (bond && !this.structure.bonds.includes(bond)) {
        this.selectedBondProperty.value = null;
      }
    });
  }

  public selectAtom(atom: LewisAtom | null): void {
    this.selectedBondProperty.value = null;
    this.selectedAtomProperty.value = atom;
  }

  public selectBond(bond: LewisBond | null): void {
    this.selectedAtomProperty.value = null;
    this.selectedBondProperty.value = bond;
  }

  /** Bond directions (radians) leaving an atom. */
  public bondAnglesOf(atom: LewisAtom): number[] {
    const position = atom.positionProperty.value;
    return this.structure.bondsOf(atom).map((bond) => bond.other(atom).positionProperty.value.minus(position).angle);
  }

  /**
   * Adds an atom next to `anchor` (default: the selected atom) and bonds it to the anchor with a
   * single bond; with no anchor, near the middle of the board. The anchor stays selected, so
   * adding H four times to a selected C builds CH₄; with no anchor the new atom is selected.
   */
  public addAtomNear(element: ElementSymbol, anchor: LewisAtom | null = this.selectedAtomProperty.value): LewisAtom {
    const position = freeSpotNear(
      anchor?.positionProperty.value ?? null,
      anchor ? this.bondAnglesOf(anchor) : [],
      this.structure.atoms.map((other) => other.positionProperty.value),
      this.bounds.center,
      (point) => this.bounds.eroded(0.4).containsPoint(point),
    );
    const atom = this.structure.addAtom(element, position);
    if (anchor) {
      this.structure.setBondOrder(anchor, atom, 1);
      this.selectAtom(anchor);
    } else {
      this.selectAtom(atom);
    }
    return atom;
  }

  /** Bonds two atoms with a single bond, or steps an existing bond to the next order. */
  public bondOrCycle(a: LewisAtom, b: LewisAtom): LewisBond | null {
    if (a === b) {
      return null;
    }
    const existing = this.structure.bondBetween(a, b);
    if (existing) {
      this.structure.cycleBondOrder(existing);
      return existing;
    }
    this.structure.setBondOrder(a, b, 1);
    return this.structure.bondBetween(a, b);
  }

  /** Relaxes the layout (one undo step). */
  public tidy(): void {
    const atoms = this.structure.atoms;
    if (atoms.length === 0) {
      return;
    }
    const bonds = this.structure.bonds.map((bond) => [atoms.indexOf(bond.atomA), atoms.indexOf(bond.atomB)] as const);
    const positions = tidyLayout(
      atoms.map((atom) => atom.positionProperty.value),
      bonds,
      this.bounds.center,
    );
    this.structure.startMove();
    this.structure.setPositions(positions.map((p) => this.bounds.eroded(0.3).closestPointTo(p)));
  }

  /** Replaces the drawing with `data`, centred on the board. */
  public showData(data: StructureData, record = true): void {
    const xs = data.atoms.map((a) => a.x);
    const ys = data.atoms.map((a) => a.y);
    const cx = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
    const cy = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
    const center = this.bounds.center;
    this.structure.setData(
      {
        ...data,
        atoms: data.atoms.map((a) => ({ ...a, x: a.x - cx + center.x, y: a.y - cy + center.y })),
      },
      record,
    );
    this.selectAtom(null);
  }

  public reset(charge = 0): void {
    this.selectAtom(null);
    this.structure.reset(charge);
  }

  /** Whether a model point lies on the board. */
  public contains(point: Vector2): boolean {
    return this.bounds.containsPoint(point);
  }

  /** The nearest point on the board, a little inside the edge. */
  public clamp(point: Vector2): Vector2 {
    return this.bounds.eroded(0.25).closestPointTo(point);
  }

  public dispose(): void {
    this.structure.dispose();
    this.selectedAtomProperty.dispose();
    this.selectedBondProperty.dispose();
  }
}

/** The board extent for a view rectangle of `width` × `height` pixels at `pixelsPerBond`. */
export function boardBounds(width: number, height: number, pixelsPerBond: number): Bounds2 {
  const halfWidth = width / 2 / pixelsPerBond;
  const halfHeight = height / 2 / pixelsPerBond;
  return new Bounds2(-halfWidth, -halfHeight, halfWidth, halfHeight);
}
