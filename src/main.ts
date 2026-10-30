/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { BuildScreen } from "./build/BuildScreen.js";
import { ChallengeScreen } from "./challenge/ChallengeScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import LewisStructuresColors from "./LewisStructuresColors.js";
import { LewisStructuresPreferencesModel } from "./preferences/LewisStructuresPreferencesModel.js";
import { LewisStructuresPreferencesNode } from "./preferences/LewisStructuresPreferencesNode.js";
import { ResonanceScreen } from "./resonance/ResonanceScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from lewisStructuresQueryParameters.
  const simPreferences = new LewisStructuresPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new BuildScreen(simPreferences, {
      name: stringManager.getScreenNames().buildStringProperty,
      tandem: Tandem.ROOT.createTandem("buildScreen"),
      backgroundColorProperty: LewisStructuresColors.backgroundColorProperty,
    }),
    new ResonanceScreen(simPreferences, {
      name: stringManager.getScreenNames().resonanceStringProperty,
      tandem: Tandem.ROOT.createTandem("resonanceScreen"),
      backgroundColorProperty: LewisStructuresColors.backgroundColorProperty,
    }),
    new ChallengeScreen(simPreferences, {
      name: stringManager.getScreenNames().challengeStringProperty,
      tandem: Tandem.ROOT.createTandem("challengeScreen"),
      backgroundColorProperty: LewisStructuresColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new LewisStructuresPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
