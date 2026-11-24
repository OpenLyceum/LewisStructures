/**
 * Memory-leak regression suite (fleet standard).
 *
 * List every model/view object that links Properties, adds listeners, or owns child
 * nodes, with a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles
 * (idempotentDispose: true also checks a second dispose()). Add sim-specific leak
 * tests below using forceGC().
 */

import { NumberProperty, Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import { Tandem } from "scenerystack/tandem";
import { VegasStrings } from "scenerystack/vegas";
import { describe, it } from "vitest";
import { ChallengeModel } from "../src/challenge/model/ChallengeModel.js";
import { ChallengeScreenView } from "../src/challenge/view/ChallengeScreenView.js";
import { RoundCompletedPanel } from "../src/challenge/view/RoundCompletedPanel.js";
import { boardBounds, DrawingModel } from "../src/common/model/DrawingModel.js";
import { generateStructures } from "../src/common/model/generateStructures.js";
import { LewisAtom, LewisStructure } from "../src/common/model/LewisStructure.js";
import { OctetPolicy } from "../src/common/model/OctetPolicy.js";
import { resonanceGallery } from "../src/common/model/resonance.js";
import { getSpecies, type Species } from "../src/common/model/SpeciesCatalog.js";
import type { CategoryChoice } from "../src/common/model/SpeciesChoice.js";
import type { StructureData } from "../src/common/model/StructureData.js";
import { BoardKeyboardController } from "../src/common/view/BoardKeyboardController.js";
import { ChecklistNode } from "../src/common/view/ChecklistNode.js";
import { ElectronBudgetNode } from "../src/common/view/ElectronBudgetNode.js";
import { LewisCanvasNode } from "../src/common/view/LewisCanvasNode.js";
import { SelectionBarNode } from "../src/common/view/SelectionBarNode.js";
import { ShapePreviewNode } from "../src/common/view/ShapePreviewNode.js";
import { ShapeViewNode } from "../src/common/view/ShapeViewNode.js";
import { SpeciesChooserNode } from "../src/common/view/SpeciesChooserNode.js";
import { StructureNode } from "../src/common/view/StructureNode.js";
import { LewisStructuresPreferencesModel } from "../src/preferences/LewisStructuresPreferencesModel.js";
import { FormCardNode } from "../src/resonance/view/FormCardNode.js";
import { describeDisposalLeaks, expectNoListenerGrowth } from "./helpers/memoryLeak.js";

const nitrate = (): StructureData =>
  generateStructures(getSpecies("nitrate").skeleton, OctetPolicy.ACCEPT_BOTH).best[0]?.data ??
  getSpecies("nitrate").skeleton;

/** A drawing model already holding a structure, so views have atoms and bonds to build. */
function drawingWithNitrate(): DrawingModel {
  const drawing = new DrawingModel(boardBounds(560, 420, 72));
  drawing.showData(nitrate());
  return drawing;
}

/** A view together with the model it observes, disposed together. */
function withDrawing<T extends { dispose(): void }>(build: (drawing: DrawingModel) => T) {
  return () => {
    const drawing = drawingWithNitrate();
    const node = build(drawing);
    return {
      dispose: () => {
        node.dispose();
        drawing.dispose();
      },
    };
  };
}

const sharedDrawing = drawingWithNitrate();
const targetProperty = new Property<StructureData | null>(null);
const categoryProperty = new Property<CategoryChoice>("simple");
const speciesProperty = new Property<Species | null>(getSpecies("nitrate"));
const chargeProperty = new Property(0);
const listParent = new Node();
const speaker = new Node();
const levelNumberProperty = new NumberProperty(2);
const scoreProperty = new NumberProperty(7);

describeDisposalLeaks([
  {
    name: "LewisStructure",
    create: () => {
      const structure = new LewisStructure();
      structure.addAtom("O", Vector2.ZERO);
      return structure;
    },
  },
  { name: "LewisAtom", create: () => new LewisAtom(1, "O", Vector2.ZERO) },
  { name: "DrawingModel", create: drawingWithNitrate },
  {
    name: "LewisCanvasNode",
    create: withDrawing(
      (drawing) =>
        new LewisCanvasNode(drawing, 560, 420, {
          showAllFormalChargesProperty: new Property(false),
          showOctetRingsProperty: new Property(true),
          hintStringProperty: new Property(""),
          targetProperty: new Property<StructureData | null>(null),
        }),
    ),
  },
  { name: "SelectionBarNode", create: withDrawing((drawing) => new SelectionBarNode(drawing, 560)) },
  {
    name: "ElectronBudgetNode",
    create: withDrawing(
      (drawing) => new ElectronBudgetNode(drawing.structure, new Property<StructureData | null>(null), 260),
    ),
  },
  {
    name: "ChecklistNode",
    create: withDrawing(
      (drawing) => new ChecklistNode(drawing.structure, new Property<StructureData | null>(null), 260),
    ),
  },
  { name: "StructureNode", create: () => new StructureNode(nitrate(), { pixelsPerBond: 72 }) },
  {
    name: "ShapePreviewNode",
    create: () => {
      const node = new ShapePreviewNode(260);
      node.update(nitrate());
      return node;
    },
  },
  { name: "ShapeViewNode", create: () => new ShapeViewNode(260) },
  {
    name: "BoardKeyboardController",
    create: () => new BoardKeyboardController(sharedDrawing, speaker, targetProperty),
    keepAlive: () => [sharedDrawing, speaker, targetProperty],
  },
  {
    name: "SpeciesChooserNode",
    create: () => new SpeciesChooserNode(categoryProperty, speciesProperty, chargeProperty, listParent),
    keepAlive: () => [categoryProperty, speciesProperty, chargeProperty, listParent],
  },
  {
    name: "FormCardNode",
    create: () => {
      const form = resonanceGallery(generateStructures(getSpecies("nitrate").skeleton, OctetPolicy.ACCEPT_BOTH))[0];
      if (!form) {
        throw new Error("nitrate has no forms");
      }
      return new FormCardNode(form, 1, 136, 118, () => undefined);
    },
  },
  {
    name: "RoundCompletedPanel",
    create: () => new RoundCompletedPanel(levelNumberProperty, scoreProperty, 10, 3, () => undefined),
    keepAlive: () => [levelNumberProperty, scoreProperty],
  },
]);

describe("Challenge round end", () => {
  // Regression: the view used to build a vegas LevelCompletedNode per completed round, whose
  // undisposed "Level N" DerivedProperty kept each panel linked to the vegas level string.
  it("does not link new listeners to the vegas strings each round", async () => {
    const preferences = new LewisStructuresPreferencesModel(Tandem.OPT_OUT);
    const model = new ChallengeModel(preferences.octetPolicyProperty);
    new ChallengeScreenView(model, preferences, { tandem: Tandem.OPT_OUT });
    await expectNoListenerGrowth([VegasStrings.label.level, VegasStrings.label.score.max, model.scoreProperty], () => {
      model.roundCompleteProperty.value = true;
      model.roundCompleteProperty.value = false;
    });
  });
});
