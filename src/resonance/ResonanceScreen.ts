/**
 * ResonanceScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createResonanceIcon() in src/common/LewisStructuresScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createResonanceIcon } from "../common/LewisStructuresScreenIcons.js";
import LewisStructuresColors from "../LewisStructuresColors.js";
import type { LewisStructuresPreferencesModel } from "../preferences/LewisStructuresPreferencesModel.js";
import { ResonanceModel } from "./model/ResonanceModel.js";
import { ResonanceKeyboardHelpContent } from "./view/ResonanceKeyboardHelpContent.js";
import { ResonanceScreenView } from "./view/ResonanceScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ResonanceScreenOptions = ScreenOptions & { tandem: Tandem };

export class ResonanceScreen extends Screen<ResonanceModel, ResonanceScreenView> {
  public constructor(preferences: LewisStructuresPreferencesModel, options: ResonanceScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ResonanceModel(preferences.octetPolicyProperty),
      // View factory — receives the model instance
      (model) =>
        new ResonanceScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ResonanceScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LewisStructuresColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ResonanceKeyboardHelpContent(),
          homeScreenIcon: createResonanceIcon(),
          navigationBarIcon: createResonanceIcon(),
        },
        options,
      ),
    );
  }
}
