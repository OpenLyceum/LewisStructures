/**
 * LewisStructure.ts
 *
 * The drawing being edited: atoms with a position, lone pairs and an unpaired electron, bonds of
 * order 1–3 between them, and the overall charge. Every edit goes through a method here, which
 * records an undo snapshot first and then fires `changedEmitter` (and the add/remove emitters for
 * atoms), so the view and the live analysis stay in step. Positions are cosmetic and change through
 * each atom's positionProperty; a drag records one undo step when it starts (`startMove`).
 *
 * Snapshots keep atom ids, so undo and redo reuse the same atom objects (and their nodes and
 * keyboard focus) wherever the atom still exists.
 */

import { BooleanProperty, Emitter, NumberProperty, Property } from "scenerystack/axon";
import { Vector2, Vector2Property } from "scenerystack/dot";
import { type AtomAnalysis, analyzeStructure, type StructureAnalysis } from "./analyzeStructure.js";
import type { ElementSymbol } from "./ElementData.js";
import { MAX_BOND_ORDER, MAX_LONE_PAIRS, type StructureData } from "./StructureData.js";

/** Undo steps kept; older ones are dropped. */
const MAX_HISTORY = 100;

export class LewisAtom {
  public readonly id: number;
  public readonly element: ElementSymbol;
  /** Position in bond lengths, y up. */
  public readonly positionProperty: Vector2Property;
  public lonePairs = 0;
  /** 0 or 1. */
  public unpaired = 0;

  public constructor(id: number, element: ElementSymbol, position: Vector2) {
    this.id = id;
    this.element = element;
    this.positionProperty = new Vector2Property(position);
  }

  public dispose(): void {
    this.positionProperty.dispose();
  }
}

export class LewisBond {
  public readonly atomA: LewisAtom;
  public readonly atomB: LewisAtom;
  public order: number;

  public constructor(atomA: LewisAtom, atomB: LewisAtom, order: number) {
    this.atomA = atomA;
    this.atomB = atomB;
    this.order = order;
  }

  public joins(atom: LewisAtom): boolean {
    return this.atomA === atom || this.atomB === atom;
  }

  public other(atom: LewisAtom): LewisAtom {
    return this.atomA === atom ? this.atomB : this.atomA;
  }
}

type Snapshot = {
  readonly atoms: readonly {
    readonly id: number;
    readonly element: ElementSymbol;
    readonly x: number;
    readonly y: number;
    readonly lonePairs: number;
    readonly unpaired: number;
  }[];
  readonly bonds: readonly { readonly a: number; readonly b: number; readonly order: number }[];
  readonly charge: number;
};

export class LewisStructure {
  private readonly atomList: LewisAtom[] = [];
  private readonly bondList: LewisBond[] = [];
  private nextId = 1;
  private readonly undoStack: Snapshot[] = [];
  private readonly redoStack: Snapshot[] = [];

  public readonly chargeProperty: NumberProperty;
  /** Fired after any change to atoms, bonds, electrons or charge (not on a position change). */
  public readonly changedEmitter = new Emitter();
  public readonly atomAddedEmitter = new Emitter<[LewisAtom]>({ parameters: [{ valueType: LewisAtom }] });
  public readonly atomRemovedEmitter = new Emitter<[LewisAtom]>({ parameters: [{ valueType: LewisAtom }] });
  /** The live analysis, recomputed after every change. */
  public readonly analysisProperty: Property<StructureAnalysis>;
  public readonly canUndoProperty = new BooleanProperty(false);
  public readonly canRedoProperty = new BooleanProperty(false);

  public constructor(charge = 0) {
    this.chargeProperty = new NumberProperty(charge, { numberType: "Integer" });
    this.analysisProperty = new Property(analyzeStructure(this.toData()));
    this.chargeProperty.lazyLink(() => this.changed());
  }

  public get atoms(): readonly LewisAtom[] {
    return this.atomList;
  }

  public get bonds(): readonly LewisBond[] {
    return this.bondList;
  }

  public indexOf(atom: LewisAtom): number {
    return this.atomList.indexOf(atom);
  }

  /** Analysis of one atom, from the current analysis. */
  public analysisOf(atom: LewisAtom): AtomAnalysis | null {
    return this.analysisProperty.value.atoms[this.indexOf(atom)] ?? null;
  }

  public bondsOf(atom: LewisAtom): LewisBond[] {
    return this.bondList.filter((bond) => bond.joins(atom));
  }

  public bondBetween(a: LewisAtom, b: LewisAtom): LewisBond | null {
    return this.bondList.find((bond) => bond.joins(a) && bond.joins(b)) ?? null;
  }

  /** "O" when the atom is the only one of its element, else "O2" (numbered in the order added). */
  public labelOf(atom: LewisAtom): string {
    const same = this.atomList.filter((other) => other.element === atom.element);
    return same.length > 1 ? `${atom.element}${same.indexOf(atom) + 1}` : atom.element;
  }

  // ── Edits ──────────────────────────────────────────────────────────────────

  public addAtom(element: ElementSymbol, position: Vector2): LewisAtom {
    this.recordUndo();
    const atom = this.createAtom(this.nextId++, element, position);
    this.changed();
    return atom;
  }

  public removeAtom(atom: LewisAtom): void {
    if (!this.atomList.includes(atom)) {
      return;
    }
    this.recordUndo();
    this.detachAtom(atom);
    this.changed();
  }

  /** Sets the bond between two atoms to `order` (0 removes it). */
  public setBondOrder(a: LewisAtom, b: LewisAtom, order: number): void {
    if (a === b || order < 0 || order > MAX_BOND_ORDER) {
      return;
    }
    const bond = this.bondBetween(a, b);
    if ((bond?.order ?? 0) === order) {
      return;
    }
    this.recordUndo();
    if (order === 0) {
      this.bondList.splice(this.bondList.indexOf(bond as LewisBond), 1);
    } else if (bond) {
      bond.order = order;
    } else {
      this.bondList.push(new LewisBond(a, b, order));
    }
    this.changed();
  }

  /** Single → double → triple → single. */
  public cycleBondOrder(bond: LewisBond): void {
    this.setBondOrder(bond.atomA, bond.atomB, (bond.order % MAX_BOND_ORDER) + 1);
  }

  /** Adds a lone pair; false when the atom already holds the most allowed. */
  public addLonePair(atom: LewisAtom): boolean {
    if (atom.lonePairs >= MAX_LONE_PAIRS) {
      return false;
    }
    this.recordUndo();
    atom.lonePairs++;
    this.changed();
    return true;
  }

  public removeLonePair(atom: LewisAtom): boolean {
    if (atom.lonePairs === 0) {
      return false;
    }
    this.recordUndo();
    atom.lonePairs--;
    this.changed();
    return true;
  }

  public toggleUnpaired(atom: LewisAtom): void {
    this.recordUndo();
    atom.unpaired = 1 - atom.unpaired;
    this.changed();
  }

  /** Call when a drag starts, so the whole drag is one undo step. */
  public startMove(): void {
    this.recordUndo();
  }

  /** Replaces the whole drawing (an answer, a new problem, a skeleton hint). */
  public setData(data: StructureData, record = true): void {
    if (record) {
      this.recordUndo();
    }
    this.clearAtoms();
    const atoms = data.atoms.map((atomData) => {
      const atom = this.createAtom(this.nextId++, atomData.element, new Vector2(atomData.x, atomData.y));
      atom.lonePairs = atomData.lonePairs;
      atom.unpaired = atomData.unpaired;
      return atom;
    });
    for (const bond of data.bonds) {
      this.bondList.push(new LewisBond(atoms[bond.a] as LewisAtom, atoms[bond.b] as LewisAtom, bond.order));
    }
    this.setChargeSilently(data.charge);
    this.changed();
  }

  /** Removes everything (one undo step). */
  public clear(): void {
    if (this.atomList.length === 0) {
      return;
    }
    this.recordUndo();
    this.clearAtoms();
    this.changed();
  }

  /** Empties the drawing and the history, for Reset All and a new problem. */
  public reset(charge = 0): void {
    this.clearAtoms();
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.updateHistoryProperties();
    this.setChargeSilently(charge);
    this.changed();
  }

  /** Moves every atom (positions only, no undo step), e.g. after an automatic layout. */
  public setPositions(positions: readonly Vector2[]): void {
    this.atomList.forEach((atom, i) => {
      const position = positions[i];
      if (position) {
        atom.positionProperty.value = position;
      }
    });
  }

  // ── Undo / redo ────────────────────────────────────────────────────────────

  public undo(): void {
    const snapshot = this.undoStack.pop();
    if (snapshot) {
      this.redoStack.push(this.snapshot());
      this.restore(snapshot);
    }
  }

  public redo(): void {
    const snapshot = this.redoStack.pop();
    if (snapshot) {
      this.undoStack.push(this.snapshot());
      this.restore(snapshot);
    }
  }

  // ── Conversion ─────────────────────────────────────────────────────────────

  public toData(): StructureData {
    return {
      atoms: this.atomList.map((atom) => {
        const position = atom.positionProperty.value;
        return {
          element: atom.element,
          x: position.x,
          y: position.y,
          lonePairs: atom.lonePairs,
          unpaired: atom.unpaired,
        };
      }),
      bonds: this.bondList.map((bond) => ({
        a: this.atomList.indexOf(bond.atomA),
        b: this.atomList.indexOf(bond.atomB),
        order: bond.order,
      })),
      charge: this.chargeProperty.value,
    };
  }

  public dispose(): void {
    this.clearAtoms();
    this.chargeProperty.dispose();
    this.changedEmitter.dispose();
    this.atomAddedEmitter.dispose();
    this.atomRemovedEmitter.dispose();
    this.canUndoProperty.dispose();
    this.canRedoProperty.dispose();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private createAtom(id: number, element: ElementSymbol, position: Vector2): LewisAtom {
    const atom = new LewisAtom(id, element, position);
    this.atomList.push(atom);
    this.atomAddedEmitter.emit(atom);
    return atom;
  }

  private detachAtom(atom: LewisAtom): void {
    for (let i = this.bondList.length - 1; i >= 0; i--) {
      if (this.bondList[i]?.joins(atom)) {
        this.bondList.splice(i, 1);
      }
    }
    this.atomList.splice(this.atomList.indexOf(atom), 1);
    this.atomRemovedEmitter.emit(atom);
    atom.dispose();
  }

  private clearAtoms(): void {
    this.bondList.length = 0;
    for (const atom of [...this.atomList]) {
      this.detachAtom(atom);
    }
  }

  private setChargeSilently(charge: number): void {
    if (this.chargeProperty.value !== charge) {
      // changed() follows, so the charge listener's own changed() is harmless but redundant.
      this.chargeProperty.value = charge;
    }
  }

  private snapshot(): Snapshot {
    return {
      atoms: this.atomList.map((atom) => ({
        id: atom.id,
        element: atom.element,
        x: atom.positionProperty.value.x,
        y: atom.positionProperty.value.y,
        lonePairs: atom.lonePairs,
        unpaired: atom.unpaired,
      })),
      bonds: this.bondList.map((bond) => ({ a: bond.atomA.id, b: bond.atomB.id, order: bond.order })),
      charge: this.chargeProperty.value,
    };
  }

  private restore(snapshot: Snapshot): void {
    const keep = new Set(snapshot.atoms.map((atom) => atom.id));
    this.bondList.length = 0;
    for (const atom of [...this.atomList]) {
      if (!keep.has(atom.id)) {
        this.detachAtom(atom);
      }
    }
    const byId = new Map(this.atomList.map((atom) => [atom.id, atom]));
    const ordered = snapshot.atoms.map((saved) => {
      let atom = byId.get(saved.id);
      if (!atom) {
        atom = this.createAtom(saved.id, saved.element, new Vector2(saved.x, saved.y));
      }
      atom.positionProperty.value = new Vector2(saved.x, saved.y);
      atom.lonePairs = saved.lonePairs;
      atom.unpaired = saved.unpaired;
      return atom;
    });
    // Keep the saved order, so labels such as "O2" mean the same atom after undo.
    this.atomList.splice(0, this.atomList.length, ...ordered);
    const atomsById = new Map(ordered.map((atom) => [atom.id, atom]));
    for (const bond of snapshot.bonds) {
      this.bondList.push(
        new LewisBond(atomsById.get(bond.a) as LewisAtom, atomsById.get(bond.b) as LewisAtom, bond.order),
      );
    }
    this.setChargeSilently(snapshot.charge);
    this.updateHistoryProperties();
    this.changed();
  }

  private recordUndo(): void {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
    this.updateHistoryProperties();
  }

  private updateHistoryProperties(): void {
    this.canUndoProperty.value = this.undoStack.length > 0;
    this.canRedoProperty.value = this.redoStack.length > 0;
  }

  private changed(): void {
    this.analysisProperty.value = analyzeStructure(this.toData());
    this.changedEmitter.emit();
  }
}
