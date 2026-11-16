import { LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS } from "../LewisStructuresConstants.js";
/**
 * LewisStructuresPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to LewisStructuresPreferencesModel Properties (whose initial values come from
 * lewisStructuresQueryParameters).
 */

import { RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { OctetPolicy } from "../common/model/OctetPolicy.js";
import { StringManager } from "../i18n/StringManager.js";
import LewisStructuresColors from "../LewisStructuresColors.js";
import LewisStructuresNamespace from "../LewisStructuresNamespace.js";
import type { LewisStructuresPreferencesModel } from "./LewisStructuresPreferencesModel.js";

const FONT = new PhetFont(LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.FONT_SIZE);
const NOTE_WIDTH: number = LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.NOTE_WIDTH;

export class LewisStructuresPreferencesNode extends VBox {
  public constructor(preferencesModel: LewisStructuresPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const fill = LewisStructuresColors.controlSurfaceTextColorProperty;
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.HEADER_FONT_SIZE, weight: "bold" }),
      fill,
    });

    const policyTitle = new Text(prefStrings.octetPolicyStringProperty, {
      font: new PhetFont({ size: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.POLICY_TITLE_FONT_SIZE, weight: "bold" }),
      fill,
    });
    const policyChoices: [OctetPolicy, (typeof prefStrings)["acceptBothStringProperty"]][] = [
      [OctetPolicy.ACCEPT_BOTH, prefStrings.acceptBothStringProperty],
      [OctetPolicy.OCTET_FIRST, prefStrings.octetFirstStringProperty],
      [OctetPolicy.MINIMIZE_FORMAL_CHARGE, prefStrings.minimizeFormalChargeStringProperty],
    ];
    const policyGroup = new AquaRadioButtonGroup(
      preferencesModel.octetPolicyProperty,
      policyChoices.map(([value, label]) => ({
        value,
        createNode: () => new Text(label, { font: FONT, fill, maxWidth: NOTE_WIDTH }),
        options: { accessibleName: label },
      })),
      {
        spacing: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.POLICY_GROUP_SPACING,
        radioButtonOptions: { radius: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.POLICY_GROUP_RADIUS },
        accessibleName: prefStrings.octetPolicyStringProperty,
      },
    );
    const policyNote = new RichText(prefStrings.octetPolicyNoteStringProperty, {
      font: new PhetFont(LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.POLICY_NOTE_FONT_SIZE),
      fill,
      lineWrap: NOTE_WIDTH,
    });

    const checkbox = (
      property: typeof preferencesModel.showOctetRingsProperty,
      label: typeof policyTitle.stringProperty,
      name: string,
    ) =>
      new Checkbox(property, new Text(label, { font: FONT, fill, maxWidth: NOTE_WIDTH }), {
        checkboxColor: fill,
        checkboxColorBackground: LewisStructuresColors.controlSurfaceColorProperty,
        spacing: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.CHECKBOX_SPACING,
        accessibleName: label,
        ...(tandem && { tandem: tandem.createTandem(name) }),
      });

    super({
      align: "left",
      spacing: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        header,
        new VBox({
          align: "left",
          spacing: LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS.ITEM_2_SPACING,
          children: [policyTitle, policyGroup, policyNote],
        }),
        checkbox(preferencesModel.showOctetRingsProperty, prefStrings.octetRingsStringProperty, "octetRingsCheckbox"),
        checkbox(
          preferencesModel.showAllFormalChargesProperty,
          prefStrings.allFormalChargesStringProperty,
          "allFormalChargesCheckbox",
        ),
      ],
    });
  }
}

LewisStructuresNamespace.register("LewisStructuresPreferencesNode", LewisStructuresPreferencesNode);
