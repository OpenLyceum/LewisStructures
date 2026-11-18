/**
 * BuildKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Build screen: the drawing board's keys on the left; the element
 * palette, the 3D shape model, menus, checkboxes and buttons on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import {
  createBoardKeyboardHelpSection,
  createPaletteKeyboardHelpSection,
  createShapeKeyboardHelpSection,
} from "../../common/view/BoardKeyboardHelpSection.js";

export class BuildKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [createBoardKeyboardHelpSection()],
      [
        createPaletteKeyboardHelpSection(),
        createShapeKeyboardHelpSection(),
        new ComboBoxKeyboardHelpSection(),
        new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }),
      ],
    );
  }
}
