/**
 * LewisStructuresHotkeyData.ts
 *
 * Keys of the drawing board and the element palette. The board's KeyboardListener uses these keys,
 * and the keyboard-help dialogs label them with the sim's own wording. Only letters that the help
 * dialog has key icons for are used (hence D, "dot", for the unpaired electron). UNDO and REDO use
 * Ctrl, which has no icon, so their help rows are drawn by BoardKeyboardHelpSection.
 */

import { HotkeyData } from "scenerystack/scenery";
import { StringManager } from "../i18n/StringManager.js";

const REPO_NAME = "lewis-structures";
const keyboardHelp = StringManager.getInstance().getKeyboardHelpStrings();

const LewisStructuresHotkeyData = {
  MOVE_BETWEEN_ATOMS: new HotkeyData({
    keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.moveBetweenAtomsStringProperty,
  }),
  ADD_LONE_PAIR: new HotkeyData({
    keys: ["l"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.addLonePairStringProperty,
  }),
  REMOVE_LONE_PAIR: new HotkeyData({
    keys: ["shift+l"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.removeLonePairStringProperty,
  }),
  TOGGLE_UNPAIRED: new HotkeyData({
    keys: ["d"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.toggleUnpairedStringProperty,
  }),
  START_BOND: new HotkeyData({
    keys: ["b"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.startBondStringProperty,
  }),
  CONFIRM: new HotkeyData({
    keys: ["enter", "space"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.confirmStringProperty,
  }),
  SET_BOND_ORDER: new HotkeyData({
    keys: ["0", "1", "2", "3"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.setBondOrderStringProperty,
  }),
  CANCEL: new HotkeyData({
    keys: ["escape"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.cancelStringProperty,
  }),
  GRAB_ATOM: new HotkeyData({
    keys: ["g"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.grabAtomStringProperty,
  }),
  DELETE_ATOM: new HotkeyData({
    keys: ["delete", "backspace"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.deleteAtomStringProperty,
  }),
  UNDO: new HotkeyData({
    keys: ["ctrl+z"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.undoStringProperty,
  }),
  REDO: new HotkeyData({
    keys: ["ctrl+y", "ctrl+shift+z"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.redoStringProperty,
  }),
  ADD_ELEMENT: new HotkeyData({
    keys: ["enter", "space"],
    repoName: REPO_NAME,
    keyboardHelpDialogLabelStringProperty: keyboardHelp.addElementStringProperty,
  }),
};

export default LewisStructuresHotkeyData;
