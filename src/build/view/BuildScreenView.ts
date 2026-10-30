/**
 * BuildScreenView.ts
 *
 * The Build screen: choose a molecule or ion (or free build), draw it on the board from the element
 * palette, and watch the valence-electron count and the checklist update with every edit. Check
 * compares the drawing with the best structure; Skeleton lays out the atoms; Show answer draws the
 * best structure.
 *
 *   ┌ chooser ─────────────────────────────┐ ┌ electrons ┐
 *   │ pal │ board                          │ │ checklist │
 *   │     │                                │ │ check     │
 *   │     └ undo redo tidy clear ──────────┘ │           │
 *   │       selection bar                    └ reset ────┘
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/LewisStructuresButtonOptions.js";
import { LewisStructuresPanel } from "../../common/LewisStructuresPanel.js";
import { ChecklistNode } from "../../common/view/ChecklistNode.js";
import { pushButton, SMALL_FONT } from "../../common/view/ControlFactory.js";
import { describeOutcome } from "../../common/view/describeOutcome.js";
import { ElectronBudgetNode } from "../../common/view/ElectronBudgetNode.js";
import { ElementPaletteNode } from "../../common/view/ElementPaletteNode.js";
import { LewisCanvasNode } from "../../common/view/LewisCanvasNode.js";
import { SelectionBarNode } from "../../common/view/SelectionBarNode.js";
import { SpeciesChooserNode } from "../../common/view/SpeciesChooserNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { BOARD_HEIGHT, BOARD_WIDTH, SCREEN_VIEW_MARGIN, SIDE_PANEL_WIDTH } from "../../LewisStructuresConstants.js";
import type { LewisStructuresPreferencesModel } from "../../preferences/LewisStructuresPreferencesModel.js";
import type { BuildModel } from "../model/BuildModel.js";
import { BuildScreenSummaryContent } from "./BuildScreenSummaryContent.js";

const TOP = 12;
const BOARD_LEFT = 118;
const BOARD_TOP = 64;
const GAP = 10;
const PANEL_CONTENT_WIDTH = SIDE_PANEL_WIDTH - 24;

export class BuildScreenView extends ScreenView {
  public constructor(model: BuildModel, preferences: LewisStructuresPreferencesModel, options?: ScreenViewOptions) {
    super({ screenSummaryContent: new BuildScreenSummaryContent(model), ...options });

    const strings = StringManager.getInstance().getCommonStrings();
    const drawing = model.drawing;
    const structure = drawing.structure;
    const listParent = new Node();

    // ── Board and palette ─────────────────────────────────────────────────────
    const canvas = new LewisCanvasNode(drawing, BOARD_WIDTH, BOARD_HEIGHT, {
      showAllFormalChargesProperty: preferences.showAllFormalChargesProperty,
      showOctetRingsProperty: preferences.showOctetRingsProperty,
      hintStringProperty: strings.boardHintStringProperty,
    });
    canvas.translation = this.layoutBounds.leftTop.plusXY(BOARD_LEFT, BOARD_TOP);

    const palette = new ElementPaletteNode(canvas);
    const palettePanel = new LewisStructuresPanel(palette, { xMargin: 6, yMargin: 6 });
    palettePanel.leftTop = this.layoutBounds.leftTop.plusXY(SCREEN_VIEW_MARGIN, BOARD_TOP);
    canvas.setDeleteZone((globalPoint) => palettePanel.globalBounds.containsPoint(globalPoint));

    const chooser = new SpeciesChooserNode(
      model.categoryProperty,
      model.speciesProperty,
      structure.chargeProperty,
      listParent,
    );
    chooser.leftTop = this.layoutBounds.leftTop.plusXY(SCREEN_VIEW_MARGIN, TOP);

    // ── Toolbar and selection bar under the board ────────────────────────────
    const undoButton = pushButton(strings.undoStringProperty, () => structure.undo());
    const redoButton = pushButton(strings.redoStringProperty, () => structure.redo());
    structure.canUndoProperty.link((canUndo) => {
      undoButton.enabled = canUndo;
    });
    structure.canRedoProperty.link((canRedo) => {
      redoButton.enabled = canRedo;
    });
    const toolbar = new HBox({
      spacing: 8,
      children: [
        undoButton,
        redoButton,
        pushButton(strings.tidyStringProperty, () => drawing.tidy()),
        pushButton(strings.clearStringProperty, () => structure.clear()),
      ],
    });
    toolbar.leftTop = canvas.leftBottom.plusXY(0, GAP);

    const selectionBar = new SelectionBarNode(drawing, BOARD_WIDTH);
    selectionBar.leftTop = toolbar.leftBottom.plusXY(0, GAP);

    // ── Right column ──────────────────────────────────────────────────────────
    const targetProperty = new DerivedProperty([model.speciesProperty], (species) => species?.skeleton ?? null);
    const budgetPanel = new LewisStructuresPanel(
      new ElectronBudgetNode(structure, targetProperty, PANEL_CONTENT_WIDTH),
      {
        minWidth: SIDE_PANEL_WIDTH,
        align: "left",
      },
    );
    const checklistPanel = new LewisStructuresPanel(new ChecklistNode(structure, PANEL_CONTENT_WIDTH), {
      minWidth: SIDE_PANEL_WIDTH,
      align: "left",
    });

    const feedbackProperty = DerivedProperty.deriveAny(
      [model.outcomeProperty, model.speciesProperty, ...Object.values(strings.feedback)],
      () => {
        const outcome = model.outcomeProperty.value;
        return outcome ? describeOutcome(outcome, model.speciesProperty.value).text : "";
      },
    );
    const feedback = new RichText(feedbackProperty, { font: SMALL_FONT, lineWrap: PANEL_CONTENT_WIDTH });
    Multilink.multilink([model.outcomeProperty], (outcome) => {
      const good = outcome ? describeOutcome(outcome, model.speciesProperty.value).good : null;
      feedback.fill =
        good === true
          ? LewisStructuresColors.goodColorProperty
          : good === false
            ? LewisStructuresColors.poorColorProperty
            : LewisStructuresColors.textColorProperty;
    });
    const skeletonButton = pushButton(strings.skeletonStringProperty, () => model.showSkeleton());
    model.speciesProperty.link((species) => {
      skeletonButton.enabled = species !== null;
    });
    const checkPanel = new LewisStructuresPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          new HBox({
            spacing: 8,
            children: [
              pushButton(strings.checkStringProperty, () => model.check()),
              skeletonButton,
              pushButton(strings.showAnswerStringProperty, () => model.showAnswer()),
            ],
          }),
          feedback,
        ],
      }),
      { minWidth: SIDE_PANEL_WIDTH, align: "left" },
    );

    const rightColumn = new VBox({
      align: "left",
      spacing: GAP,
      children: [budgetPanel, checklistPanel, checkPanel],
    });
    rightColumn.rightTop = this.layoutBounds.rightTop.plusXY(-SCREEN_VIEW_MARGIN, TOP);

    // ── Reset All ─────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [canvas, palettePanel, toolbar, selectionBar, rightColumn, chooser, resetAllButton, listParent];

    // ── Traversal order ───────────────────────────────────────────────────────
    this.addChild(
      new Node({
        pdomOrder: [
          chooser,
          palettePanel,
          canvas,
          toolbar,
          selectionBar,
          budgetPanel,
          checklistPanel,
          checkPanel,
          resetAllButton,
        ],
      }),
    );
  }
}
