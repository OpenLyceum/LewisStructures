/**
 * ChallengeKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Challenge screen: the drawing board's keys on the left; the element
 * palette, the 3D shape model and the buttons on the right.
 */

import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";
import {
  createBoardKeyboardHelpSection,
  createPaletteKeyboardHelpSection,
  createShapeKeyboardHelpSection,
} from "../../common/view/BoardKeyboardHelpSection.js";

export class ChallengeKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [createBoardKeyboardHelpSection()],
      [createPaletteKeyboardHelpSection(), createShapeKeyboardHelpSection(), new BasicActionsKeyboardHelpSection()],
    );
  }
}
