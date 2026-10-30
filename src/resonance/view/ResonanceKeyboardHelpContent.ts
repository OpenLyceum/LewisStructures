/**
 * ResonanceKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Resonance screen: the drawing board's keys (used in Draw one mode)
 * on the left; menus, radio buttons, checkboxes and buttons on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { createBoardKeyboardHelpSection } from "../../common/view/BoardKeyboardHelpSection.js";

export class ResonanceKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [createBoardKeyboardHelpSection()],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
