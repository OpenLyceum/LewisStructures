/**
 * BoardKeyboardController.ts
 *
 * Everything the pointer can do on the drawing board, from the keyboard. The board is one focus
 * stop and the selected atom is its cursor:
 *
 *   arrows        move to the nearest atom in that direction
 *   L / Shift+L   add / remove a lone pair          D   toggle the unpaired electron ("dot")
 *   B             bond mode: arrows choose a partner, Enter bonds (or steps the order),
 *                 1/2/3 set the order, 0 removes the bond, Escape cancels
 *   G             move mode: arrows move the atom, Enter, G or Escape drops it
 *   Delete        delete the atom (the cursor moves to the nearest one left)
 *   Ctrl+Z / Ctrl+Y   undo / redo
 *
 * Every action is announced: what changed, the atom's electrons and status, and how many electrons
 * are left to place. Keys come from LewisStructuresHotkeyData, shared with the help dialog.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { KeyboardListener, type Node, type OneKeyStroke } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresHotkeyData from "../LewisStructuresHotkeyData.js";
import type { DrawingModel } from "../model/DrawingModel.js";
import type { LewisAtom } from "../model/LewisStructure.js";
import type { StructureData } from "../model/StructureData.js";
import { atomBrief, atomDescription, budgetSentence, orderName } from "./boardDescriptions.js";
import { describeHint } from "./ChecklistNode.js";

/** How far one arrow press moves a grabbed atom, bond lengths. */
const MOVE_STEP = 0.25;

const DIRECTIONS: Record<string, Vector2> = {
  arrowUp: new Vector2(0, 1),
  arrowDown: new Vector2(0, -1),
  arrowLeft: new Vector2(-1, 0),
  arrowRight: new Vector2(1, 0),
};

type Mode = "navigate" | "bond" | "move";

const HOTKEYS = [
  LewisStructuresHotkeyData.MOVE_BETWEEN_ATOMS,
  LewisStructuresHotkeyData.ADD_LONE_PAIR,
  LewisStructuresHotkeyData.REMOVE_LONE_PAIR,
  LewisStructuresHotkeyData.TOGGLE_UNPAIRED,
  LewisStructuresHotkeyData.START_BOND,
  LewisStructuresHotkeyData.CONFIRM,
  LewisStructuresHotkeyData.SET_BOND_ORDER,
  LewisStructuresHotkeyData.CANCEL,
  LewisStructuresHotkeyData.GRAB_ATOM,
  LewisStructuresHotkeyData.DELETE_ATOM,
  LewisStructuresHotkeyData.UNDO,
  LewisStructuresHotkeyData.REDO,
];

/**
 * The atom nearest `from` in `direction` (within 60° of it), weighting sideways offset so that
 * "up" prefers the atom straight above over a closer one off to the side.
 */
export function nearestInDirection(
  atoms: readonly LewisAtom[],
  from: Vector2,
  direction: Vector2,
  except: readonly LewisAtom[],
): LewisAtom | null {
  let best: LewisAtom | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const atom of atoms) {
    if (except.includes(atom)) {
      continue;
    }
    const delta = atom.positionProperty.value.minus(from);
    const along = delta.dot(direction);
    const distance = delta.magnitude;
    if (distance < 1e-6 || along < distance * 0.5) {
      continue;
    }
    const sideways = Math.abs(delta.crossScalar(direction));
    const score = along + 2 * sideways;
    if (score < bestScore) {
      bestScore = score;
      best = atom;
    }
  }
  return best;
}

export class BoardKeyboardController {
  /** The atom chosen as the other end of a bond in bond mode (drawn with a dashed ring). */
  public readonly partnerProperty = new Property<LewisAtom | null>(null);
  private mode: Mode = "navigate";
  private readonly drawing: DrawingModel;
  private readonly speaker: Node;
  private readonly targetProperty: TReadOnlyProperty<StructureData | null>;
  public readonly listener: KeyboardListener<readonly OneKeyStroke[]>;

  /**
   * @param speaker - the focusable board node that announces responses
   * @param targetProperty - the species being drawn (its formula sets the electron total), or null
   */
  public constructor(drawing: DrawingModel, speaker: Node, targetProperty: TReadOnlyProperty<StructureData | null>) {
    this.drawing = drawing;
    this.speaker = speaker;
    this.targetProperty = targetProperty;
    this.listener = new KeyboardListener({
      keyStringProperties: HOTKEYS.flatMap((hotkey) => hotkey.keyStringProperties),
      fire: (_event, keysPressed) => this.handleKey(keysPressed),
    });
  }

  /** Called when the board gains focus: put the cursor on an atom and say where it is. */
  public onFocus(): void {
    const structure = this.drawing.structure;
    if (!this.drawing.selectedAtomProperty.value && structure.atoms.length > 0) {
      this.drawing.selectAtom(structure.atoms[0] ?? null);
    }
    const atom = this.drawing.selectedAtomProperty.value;
    this.say(atom ? atomDescription(structure, atom) : this.strings().emptyStringProperty.value);
  }

  /** Called when the board loses focus: leave any bond or move mode. */
  public onBlur(): void {
    this.setMode("navigate");
  }

  public dispose(): void {
    this.listener.dispose();
    this.partnerProperty.dispose();
  }

  // ── Keys ───────────────────────────────────────────────────────────────────

  private handleKey(keys: string): void {
    const structure = this.drawing.structure;
    if (keys === "ctrl+z") {
      this.setMode("navigate");
      const could = structure.canUndoProperty.value;
      structure.undo();
      this.say(
        could
          ? `${this.strings().undoneStringProperty.value} ${this.budget()}`
          : this.strings().nothingToUndoStringProperty.value,
      );
      return;
    }
    if (keys === "ctrl+y" || keys === "ctrl+shift+z") {
      this.setMode("navigate");
      const could = structure.canRedoProperty.value;
      structure.redo();
      this.say(
        could
          ? `${this.strings().redoneStringProperty.value} ${this.budget()}`
          : this.strings().nothingToRedoStringProperty.value,
      );
      return;
    }

    const atom = this.drawing.selectedAtomProperty.value;
    const direction = DIRECTIONS[keys];
    if (!atom) {
      // Nothing to act on yet: the first arrow press picks an atom, anything else explains.
      if (structure.atoms.length > 0 && direction) {
        this.drawing.selectAtom(structure.atoms[0] ?? null);
        this.onFocus();
      } else if (structure.atoms.length === 0) {
        this.say(this.strings().emptyStringProperty.value);
      }
      return;
    }

    if (this.mode === "bond") {
      this.handleBondKey(atom, keys, direction);
    } else if (this.mode === "move") {
      this.handleMoveKey(atom, keys, direction);
    } else {
      this.handleNavigateKey(atom, keys, direction);
    }
  }

  private handleNavigateKey(atom: LewisAtom, keys: string, direction: Vector2 | undefined): void {
    const structure = this.drawing.structure;
    const strings = this.strings();
    const label = () => structure.labelOf(atom);
    if (direction) {
      const next = nearestInDirection(structure.atoms, atom.positionProperty.value, direction, [atom]);
      if (next) {
        this.drawing.selectAtom(next);
        this.say(atomDescription(structure, next));
      } else {
        this.say(strings.edgeStringProperty.value);
      }
    } else if (keys === "l") {
      const added = structure.addLonePair(atom);
      const pattern = added ? strings.lonePairAddedPatternStringProperty : strings.lonePairLimitPatternStringProperty;
      this.sayEdit(StringUtils.fillIn(pattern.value, { atom: label() }), atom);
    } else if (keys === "shift+l") {
      const removed = structure.removeLonePair(atom);
      const pattern = removed ? strings.lonePairRemovedPatternStringProperty : strings.noLonePairPatternStringProperty;
      this.sayEdit(StringUtils.fillIn(pattern.value, { atom: label() }), atom);
    } else if (keys === "d") {
      structure.toggleUnpaired(atom);
      const pattern = atom.unpaired
        ? strings.unpairedAddedPatternStringProperty
        : strings.unpairedRemovedPatternStringProperty;
      this.sayEdit(StringUtils.fillIn(pattern.value, { atom: label() }), atom);
    } else if (keys === "b") {
      this.startBond(atom);
    } else if (keys === "g") {
      structure.startMove();
      this.setMode("move");
      this.say(StringUtils.fillIn(strings.grabbedPatternStringProperty.value, { atom: label() }));
    } else if (keys === "delete" || keys === "backspace") {
      const name = label();
      const position = atom.positionProperty.value;
      structure.removeAtom(atom);
      const remaining = [...structure.atoms].sort(
        (a, b) => a.positionProperty.value.distance(position) - b.positionProperty.value.distance(position),
      );
      this.drawing.selectAtom(remaining[0] ?? null);
      this.say(
        `${StringUtils.fillIn(strings.atomDeletedPatternStringProperty.value, { atom: name })} ${this.budget()}`,
      );
    } else if (keys === "enter" || keys === "space") {
      this.say(atomDescription(structure, atom));
    }
  }

  private startBond(atom: LewisAtom): void {
    const structure = this.drawing.structure;
    const strings = this.strings();
    const others = structure.atoms.filter((other) => other !== atom);
    if (others.length === 0) {
      this.say(strings.noPartnerStringProperty.value);
      return;
    }
    // Start on a bonded neighbour if there is one (to change its order), else the nearest atom.
    const position = atom.positionProperty.value;
    const neighbour = structure.bondsOf(atom)[0]?.other(atom) ?? null;
    const nearest = [...others].sort(
      (a, b) => a.positionProperty.value.distance(position) - b.positionProperty.value.distance(position),
    )[0] as LewisAtom;
    this.partnerProperty.value = neighbour ?? nearest;
    this.setMode("bond");
    this.say(
      `${StringUtils.fillIn(strings.bondModePatternStringProperty.value, { atom: structure.labelOf(atom) })} ${this.partnerSentence(atom)}`,
    );
  }

  private handleBondKey(atom: LewisAtom, keys: string, direction: Vector2 | undefined): void {
    const structure = this.drawing.structure;
    const strings = this.strings();
    const partner = this.partnerProperty.value;
    if (direction) {
      const from = (partner ?? atom).positionProperty.value;
      const next = nearestInDirection(structure.atoms, from, direction, [atom, ...(partner ? [partner] : [])]);
      if (next) {
        this.partnerProperty.value = next;
        this.say(this.partnerSentence(atom));
      } else {
        this.say(strings.edgeStringProperty.value);
      }
      return;
    }
    if (keys === "escape") {
      this.setMode("navigate");
      this.say(strings.bondCancelledStringProperty.value);
      return;
    }
    if (!partner) {
      return;
    }
    const names = { a: structure.labelOf(atom), b: structure.labelOf(partner) };
    if (keys === "enter" || keys === "space") {
      const bond = this.drawing.bondOrCycle(atom, partner);
      this.finishBond(
        atom,
        StringUtils.fillIn(strings.bondSetPatternStringProperty.value, {
          ...names,
          order: orderName(bond?.order ?? 1),
        }),
      );
    } else if (keys === "0") {
      structure.setBondOrder(atom, partner, 0);
      this.finishBond(atom, StringUtils.fillIn(strings.bondRemovedPatternStringProperty.value, names));
    } else if (keys === "1" || keys === "2" || keys === "3") {
      const order = Number(keys);
      structure.setBondOrder(atom, partner, order);
      this.finishBond(
        atom,
        StringUtils.fillIn(strings.bondSetPatternStringProperty.value, { ...names, order: orderName(order) }),
      );
    }
  }

  private finishBond(atom: LewisAtom, sentence: string): void {
    this.setMode("navigate");
    this.drawing.selectAtom(atom);
    this.sayEdit(sentence, atom);
  }

  private handleMoveKey(atom: LewisAtom, keys: string, direction: Vector2 | undefined): void {
    if (direction) {
      atom.positionProperty.value = this.drawing.clamp(
        atom.positionProperty.value.plus(direction.timesScalar(MOVE_STEP)),
      );
      return;
    }
    if (keys === "enter" || keys === "space" || keys === "escape" || keys === "g") {
      this.setMode("navigate");
      this.say(
        StringUtils.fillIn(this.strings().droppedPatternStringProperty.value, {
          atom: this.drawing.structure.labelOf(atom),
        }),
      );
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setMode(mode: Mode): void {
    this.mode = mode;
    if (mode !== "bond") {
      this.partnerProperty.value = null;
    }
  }

  private partnerSentence(atom: LewisAtom): string {
    const structure = this.drawing.structure;
    const strings = this.strings();
    const partner = this.partnerProperty.value;
    if (!partner) {
      return "";
    }
    const bond = structure.bondBetween(atom, partner);
    return StringUtils.fillIn(strings.partnerPatternStringProperty.value, {
      atom: structure.labelOf(partner),
      bond: bond
        ? StringUtils.fillIn(strings.currentBondPatternStringProperty.value, { order: orderName(bond.order) })
        : strings.notBondedStringProperty.value,
    });
  }

  private budget(): string {
    return budgetSentence(this.drawing.structure, this.targetProperty.value);
  }

  /** An edit: what changed, the atom's electrons and status, and the electrons left. */
  private sayEdit(sentence: string, atom: LewisAtom): void {
    const structure = this.drawing.structure;
    const done = structure.analysisProperty.value.complete
      ? describeHint(structure, structure.analysisProperty.value, this.targetProperty.value)
      : "";
    this.say([sentence, atomBrief(structure, atom), this.budget(), done].filter((part) => part !== "").join(" "));
  }

  private say(text: string): void {
    this.speaker.addAccessibleResponse(text);
  }

  private strings() {
    return StringManager.getInstance().getBoardA11yStrings();
  }
}
