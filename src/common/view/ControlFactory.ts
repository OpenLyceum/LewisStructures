import { CONTROL_FACTORY_SETTINGS } from "../../LewisStructuresConstants.js";
/**
 * ControlFactory.ts
 *
 * Themed builders for panel controls (copied from EquilibriumLab). `accessibleName` is a required
 * argument, so a control without one is a compile error rather than a silent gap.
 */

import type { PhetioProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import { type Node, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, ComboBox, type ComboBoxItem, TextPushButton } from "scenerystack/sun";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  LEWIS_STRUCTURES_COMBO_BOX_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../LewisStructuresButtonOptions.js";
import { LEWIS_STRUCTURES_CHECKBOX_OPTIONS } from "../LewisStructuresControlOptions.js";

export const CONTROL_FONT = new PhetFont(CONTROL_FACTORY_SETTINGS.CONTROL_FONT_SIZE);
export const SMALL_FONT = new PhetFont(CONTROL_FACTORY_SETTINGS.SMALL_FONT_SIZE);
export const HEADING_FONT = new PhetFont({ size: CONTROL_FACTORY_SETTINGS.HEADING_FONT_SIZE, weight: "bold" });

/** A panel label; RichText so labels can carry markup such as Z<sub>eff</sub>. */
export function label(text: TReadOnlyProperty<string> | string, maxWidth: number): RichText {
  return new RichText(text, { font: CONTROL_FONT, fill: LewisStructuresColors.textColorProperty, maxWidth });
}

/**
 * A menu or radio choice. `label` is plain text and names the item for screen readers; `display`,
 * if given, is RichText shown instead (e.g. a name with its chemical formula).
 */
export type ComboChoice<T> = {
  readonly value: T;
  readonly label: TReadOnlyProperty<string>;
  readonly display?: TReadOnlyProperty<string>;
};

export function comboBox<T>(
  property: PhetioProperty<T>,
  choices: readonly ComboChoice<T>[],
  listParent: Node,
  accessibleName: TReadOnlyProperty<string>,
  maxWidth: number,
): ComboBox<T> {
  const items: ComboBoxItem<T>[] = choices.map((choice) => ({
    value: choice.value,
    createNode: () =>
      new RichText(choice.display ?? choice.label, {
        font: CONTROL_FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: maxWidth - CONTROL_FACTORY_SETTINGS.ITEMS_MAX_WIDTH_OFFSET,
      }),
    accessibleName: choice.label,
  }));
  return new ComboBox(property, items, listParent, {
    ...LEWIS_STRUCTURES_COMBO_BOX_OPTIONS,
    xMargin: CONTROL_FACTORY_SETTINGS.COMBO_BOX_X_MARGIN,
    yMargin: CONTROL_FACTORY_SETTINGS.COMBO_BOX_Y_MARGIN,
    cornerRadius: CONTROL_FACTORY_SETTINGS.COMBO_BOX_CORNER_RADIUS,
    accessibleName,
  });
}

export function checkbox(
  property: Property<boolean>,
  text: TReadOnlyProperty<string>,
  maxWidth: number,
  accessibleName = text,
): Checkbox {
  return new Checkbox(property, label(text, maxWidth), {
    ...LEWIS_STRUCTURES_CHECKBOX_OPTIONS,
    accessibleName,
  });
}

export function pushButton(
  text: TReadOnlyProperty<string>,
  listener: () => void,
  accessibleName = text,
): TextPushButton {
  return new TextPushButton(text, {
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    font: CONTROL_FONT,
    textFill: LIGHT_SURFACE_TEXT_FILL,
    xMargin: CONTROL_FACTORY_SETTINGS.PUSH_BUTTON_X_MARGIN,
    yMargin: CONTROL_FACTORY_SETTINGS.PUSH_BUTTON_Y_MARGIN,
    maxTextWidth: 180,
    listener,
    accessibleName,
  });
}

export function radioGroup<T>(
  property: PhetioProperty<T>,
  choices: readonly ComboChoice<T>[],
  accessibleName: TReadOnlyProperty<string>,
  maxWidth: number,
  orientation: "vertical" | "horizontal" = "vertical",
): AquaRadioButtonGroup<T> {
  return new AquaRadioButtonGroup(
    property,
    choices.map((choice) => ({
      value: choice.value,
      createNode: () => label(choice.display ?? choice.label, maxWidth),
      options: { accessibleName: choice.label },
    })),
    {
      orientation,
      spacing: orientation === "vertical" ? CONTROL_FACTORY_SETTINGS.RADIO_GROUP_SPACING : 10,
      radioButtonOptions: {
        radius: CONTROL_FACTORY_SETTINGS.RADIO_GROUP_RADIUS,
        selectedColor: LewisStructuresColors.accentColorProperty,
      },
      accessibleName,
    },
  );
}
