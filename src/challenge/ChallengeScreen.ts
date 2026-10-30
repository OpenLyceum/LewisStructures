/**
 * ChallengeScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createChallengeIcon() in src/common/LewisStructuresScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createChallengeIcon } from "../common/LewisStructuresScreenIcons.js";
import LewisStructuresColors from "../LewisStructuresColors.js";
import type { LewisStructuresPreferencesModel } from "../preferences/LewisStructuresPreferencesModel.js";
import { ChallengeModel } from "./model/ChallengeModel.js";
import { ChallengeKeyboardHelpContent } from "./view/ChallengeKeyboardHelpContent.js";
import { ChallengeScreenView } from "./view/ChallengeScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ChallengeScreenOptions = ScreenOptions & { tandem: Tandem };

export class ChallengeScreen extends Screen<ChallengeModel, ChallengeScreenView> {
  public constructor(preferences: LewisStructuresPreferencesModel, options: ChallengeScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ChallengeModel(preferences.octetPolicyProperty),
      // View factory — receives the model instance
      (model) =>
        new ChallengeScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ChallengeScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LewisStructuresColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ChallengeKeyboardHelpContent(),
          homeScreenIcon: createChallengeIcon(),
          navigationBarIcon: createChallengeIcon(),
        },
        options,
      ),
    );
  }
}
