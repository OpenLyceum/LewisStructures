/**
 * BoardKeyboardHelpSection.ts
 *
 * Keyboard-help sections for the drawing board and the element palette, shared by every screen's
 * help dialog. Rows come from LewisStructuresHotkeyData, the same keys the board listens for.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import {
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  LetterKeyNode,
  TextKeyNode,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresHotkeyData from "../LewisStructuresHotkeyData.js";

/** A Ctrl+letter row, drawn by hand because the icon factory has no Ctrl key. */
function ctrlRow(label: TReadOnlyProperty<string>, letter: string): KeyboardHelpSectionRow {
  return KeyboardHelpSectionRow.labelWithIcon(
    label,
    KeyboardHelpIconFactory.iconPlusIcon(new TextKeyNode("Ctrl"), new LetterKeyNode(letter)),
  );
}

export function createBoardKeyboardHelpSection(): KeyboardHelpSection {
  const keyboardHelp = StringManager.getInstance().getKeyboardHelpStrings();
  return new KeyboardHelpSection(keyboardHelp.boardSectionStringProperty, [
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.MOVE_BETWEEN_ATOMS),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.ADD_LONE_PAIR),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.REMOVE_LONE_PAIR),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.TOGGLE_UNPAIRED),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.START_BOND),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.CONFIRM),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.SET_BOND_ORDER),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.CANCEL),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.GRAB_ATOM),
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.DELETE_ATOM),
    ctrlRow(keyboardHelp.undoStringProperty, "Z"),
    ctrlRow(keyboardHelp.redoStringProperty, "Y"),
  ]);
}

export function createPaletteKeyboardHelpSection(): KeyboardHelpSection {
  const keyboardHelp = StringManager.getInstance().getKeyboardHelpStrings();
  return new KeyboardHelpSection(keyboardHelp.paletteSectionStringProperty, [
    KeyboardHelpSectionRow.fromHotkeyData(LewisStructuresHotkeyData.ADD_ELEMENT),
  ]);
}
