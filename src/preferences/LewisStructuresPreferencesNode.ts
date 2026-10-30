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

const FONT = new PhetFont(14);
const NOTE_WIDTH = 520;

export class LewisStructuresPreferencesNode extends VBox {
  public constructor(preferencesModel: LewisStructuresPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const fill = LewisStructuresColors.controlSurfaceTextColorProperty;
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill,
    });

    const policyTitle = new Text(prefStrings.octetPolicyStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
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
        spacing: 6,
        radioButtonOptions: { radius: 7 },
        accessibleName: prefStrings.octetPolicyStringProperty,
      },
    );
    const policyNote = new RichText(prefStrings.octetPolicyNoteStringProperty, {
      font: new PhetFont(12),
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
        spacing: 8,
        accessibleName: label,
        ...(tandem && { tandem: tandem.createTandem(name) }),
      });

    super({
      align: "left",
      spacing: 12,
      children: [
        header,
        new VBox({ align: "left", spacing: 6, children: [policyTitle, policyGroup, policyNote] }),
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
