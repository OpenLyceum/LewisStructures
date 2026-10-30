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

import { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { boardBounds, DrawingModel } from "../src/common/model/DrawingModel.js";
import { generateStructures } from "../src/common/model/generateStructures.js";
import { LewisStructure } from "../src/common/model/LewisStructure.js";
import { OctetPolicy } from "../src/common/model/OctetPolicy.js";
import { resonanceGallery } from "../src/common/model/resonance.js";
import { getSpecies } from "../src/common/model/SpeciesCatalog.js";
import type { StructureData } from "../src/common/model/StructureData.js";
import { ChecklistNode } from "../src/common/view/ChecklistNode.js";
import { ElectronBudgetNode } from "../src/common/view/ElectronBudgetNode.js";
import { LewisCanvasNode } from "../src/common/view/LewisCanvasNode.js";
import { SelectionBarNode } from "../src/common/view/SelectionBarNode.js";
import { ShapePreviewNode } from "../src/common/view/ShapePreviewNode.js";
import { StructureNode } from "../src/common/view/StructureNode.js";
import { FormCardNode } from "../src/resonance/view/FormCardNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

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

describeDisposalLeaks([
  {
    name: "LewisStructure",
    create: () => {
      const structure = new LewisStructure();
      structure.addAtom("O", Vector2.ZERO);
      return structure;
    },
  },
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
]);
