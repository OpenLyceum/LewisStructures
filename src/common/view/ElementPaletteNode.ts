/**
 * ElementPaletteNode.ts
 *
 * The element tiles beside the board. Drag a tile onto the board to place an atom there; click a
 * tile to add the atom next to the selected atom, bonded to it (or near the middle of an empty
 * board). Dropping an atom back on the palette deletes it (see LewisCanvasNode.setDeleteZone).
 */

import { PatternStringProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { DragListener, GridBox, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { CLICK_TOLERANCE } from "../../LewisStructuresConstants.js";
import type { ElementSymbol } from "../model/ElementData.js";
import type { LewisAtom } from "../model/LewisStructure.js";
import { atomBrief, budgetSentence } from "./boardDescriptions.js";
import type { LewisCanvasNode } from "./LewisCanvasNode.js";
import { elementName } from "./speciesLabels.js";

/** The palette order: the common Gen Chem elements first. */
export const PALETTE_ELEMENTS: readonly ElementSymbol[] = [
  "H",
  "C",
  "N",
  "O",
  "F",
  "Cl",
  "Br",
  "I",
  "S",
  "P",
  "B",
  "Be",
  "Al",
  "Si",
  "Se",
  "Xe",
];

const TILE_SIZE = 38;
const TILE_FONT = new PhetFont({ size: 17, weight: "bold" });

export class ElementTileNode extends Node {
  public readonly element: ElementSymbol;

  public constructor(element: ElementSymbol, canvas: LewisCanvasNode) {
    const background = new Rectangle(0, 0, TILE_SIZE, TILE_SIZE, 5, 5, {
      fill: LewisStructuresColors.atomDiscColorProperty,
      stroke: LewisStructuresColors.boardBorderColorProperty,
    });
    const symbol = new Text(element, {
      font: TILE_FONT,
      fill: LewisStructuresColors.atomSymbolColorProperty,
      center: background.center,
      maxWidth: TILE_SIZE - 6,
    });
    const a11y = StringManager.getInstance().getBoardA11yStrings();
    super({
      children: [background, symbol],
      cursor: "pointer",
      tagName: "button",
      accessibleName: new PatternStringProperty(a11y.tilePatternStringProperty, { element: elementName(element) }),
      accessibleHelpText: a11y.tileHelpStringProperty,
    });
    this.element = element;

    const drawing = canvas.drawing;
    let startGlobal = Vector2.ZERO;
    let created: LewisAtom | null = null;
    this.addInputListener(
      new DragListener({
        start: (event) => {
          startGlobal = event.pointer.point.copy();
          created = null;
        },
        drag: (event) => {
          const point = event.pointer.point;
          if (!created && point.distance(startGlobal) < CLICK_TOLERANCE) {
            return;
          }
          const modelPoint = drawing.clamp(canvas.globalToModel(point));
          if (created) {
            created.positionProperty.value = modelPoint;
          } else if (canvas.containsGlobal(point)) {
            // Create the atom once the pointer reaches the board.
            created = drawing.structure.addAtom(element, modelPoint);
          }
        },
        end: (event) => {
          if (created) {
            if (event && !canvas.containsGlobal(event.pointer.point)) {
              // Dragged back off the board: take the atom away again.
              drawing.structure.undo();
            } else {
              drawing.selectAtom(created);
            }
          } else if (event && event.pointer.point.distance(startGlobal) < CLICK_TOLERANCE) {
            drawing.addAtomNear(element);
          }
          created = null;
        },
      }),
    );

    // Keyboard and assistive technology: Enter or Space on the focused tile.
    this.addInputListener({
      click: () => {
        const structure = drawing.structure;
        const anchor = drawing.selectedAtomProperty.value;
        const atom = drawing.addAtomNear(element);
        const name = structure.labelOf(atom);
        const sentence = anchor
          ? StringUtils.fillIn(a11y.atomAddedBondedPatternStringProperty.value, {
              atom: name,
              anchor: structure.labelOf(anchor),
            })
          : StringUtils.fillIn(a11y.atomAddedPatternStringProperty.value, { atom: name });
        const brief = anchor ? atomBrief(structure, anchor) : "";
        const budget = budgetSentence(structure, canvas.targetProperty.value);
        this.addAccessibleResponse([sentence, brief, budget].filter((part) => part !== "").join(" "));
      },
    });
  }
}

export class ElementPaletteNode extends GridBox {
  public readonly tiles: readonly ElementTileNode[];

  public constructor(canvas: LewisCanvasNode) {
    const tiles = PALETTE_ELEMENTS.map((element) => new ElementTileNode(element, canvas));
    super({
      autoColumns: 2,
      xSpacing: 6,
      ySpacing: 6,
      children: tiles,
    });
    this.tiles = tiles;
  }
}
