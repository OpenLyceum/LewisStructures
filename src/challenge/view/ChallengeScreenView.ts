/**
 * ChallengeScreenView.ts
 *
 * The Challenge screen: the vegas level selection, then a round of five problems under a status
 * bar (level, problem number, score, Start Over). Each problem names a species to draw from scratch
 * with the palette and board; Hint reveals the next hint, Check grades the drawing, Next moves on.
 * The electron count stays hidden until the first hint, since counting is part of the task. A
 * LevelCompletedNode shows the score at the end of the round.
 *
 *   ┌ status bar ─────────────────────────────────────────────┐
 *   │ task                                       ┌ hints ─────┐
 *   │ pal │ board                                │ electrons  │
 *   │     └ toolbar · selection bar              └ check/next ┘
 */

import { DerivedProperty, Multilink, PatternStringProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import {
  FiniteStatusBar,
  LevelCompletedNode,
  LevelSelectionButtonGroup,
  type LevelSelectionButtonGroupItem,
  ScoreDisplayStars,
} from "scenerystack/vegas";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/LewisStructuresButtonOptions.js";
import { LewisStructuresPanel } from "../../common/LewisStructuresPanel.js";
import { generateStructures } from "../../common/model/generateStructures.js";
import { OctetPolicy } from "../../common/model/OctetPolicy.js";
import { getSpecies } from "../../common/model/SpeciesCatalog.js";
import { checkbox, HEADING_FONT, pushButton, SMALL_FONT } from "../../common/view/ControlFactory.js";
import { describeOutcome } from "../../common/view/describeOutcome.js";
import { ElectronBudgetNode } from "../../common/view/ElectronBudgetNode.js";
import { ElementPaletteNode } from "../../common/view/ElementPaletteNode.js";
import { LewisCanvasNode } from "../../common/view/LewisCanvasNode.js";
import { SelectionBarNode } from "../../common/view/SelectionBarNode.js";
import { ShapePreviewNode } from "../../common/view/ShapePreviewNode.js";
import { StructureNode } from "../../common/view/StructureNode.js";
import { speciesName } from "../../common/view/speciesLabels.js";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import {
  BOARD_WIDTH,
  CHALLENGE_BOARD_HEIGHT,
  PANEL_CORNER_RADIUS,
  PIXELS_PER_BOND,
  SCREEN_VIEW_MARGIN,
  SIDE_PANEL_WIDTH,
} from "../../LewisStructuresConstants.js";
import type { LewisStructuresPreferencesModel } from "../../preferences/LewisStructuresPreferencesModel.js";
import lewisStructuresQueryParameters from "../../preferences/lewisStructuresQueryParameters.js";
import { type ChallengeModel, HINTS, LEVEL_COUNT, NUMBER_OF_STARS, PERFECT_SCORE } from "../model/ChallengeModel.js";
import { ChallengeScreenSummaryContent } from "./ChallengeScreenSummaryContent.js";
import { hintText } from "./challengeHints.js";

const STATUS_BAR_HEIGHT = 50;
const TASK_TOP = STATUS_BAR_HEIGHT + 8;
const BOARD_TOP = STATUS_BAR_HEIGHT + 46;
const BOARD_LEFT = 118;
const GAP = 10;
const PANEL_CONTENT_WIDTH = SIDE_PANEL_WIDTH - 24;
const SHAPE_TEXT_WIDTH = PANEL_CONTENT_WIDTH;
const LEVEL_BUTTON_SIZE = 150;
/** Largest width or height of the drawing on a level button, px. */
const LEVEL_ICON_SIZE = 100;
/** A representative species drawn on each level's button. */
const LEVEL_ICON_SPECIES = ["water", "carbonDioxide", "sulfurHexafluoride"];

export class ChallengeScreenView extends ScreenView {
  private levelCompletedNode: LevelCompletedNode | null = null;

  public constructor(model: ChallengeModel, preferences: LewisStructuresPreferencesModel, options?: ScreenViewOptions) {
    super({ screenSummaryContent: new ChallengeScreenSummaryContent(model), ...options });

    const strings = StringManager.getInstance().getChallengeStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getChallengeA11yStrings();
    const drawing = model.drawing;
    const structure = drawing.structure;

    // ── Level selection ───────────────────────────────────────────────────────
    const levelNames = [strings.level1StringProperty, strings.level2StringProperty, strings.level3StringProperty];
    const levelDescriptions = [
      strings.level1DescriptionStringProperty,
      strings.level2DescriptionStringProperty,
      strings.level3DescriptionStringProperty,
    ];
    const items: LevelSelectionButtonGroupItem[] = Array.from({ length: LEVEL_COUNT }, (_, i) => ({
      icon: levelIcon(LEVEL_ICON_SPECIES[i] ?? "water"),
      scoreProperty: model.bestScoreProperties[i] as NonNullable<(typeof model.bestScoreProperties)[number]>,
      options: {
        ...FLAT_BUTTON_APPEARANCE_OPTIONS,
        baseColor: LewisStructuresColors.controlSurfaceColorProperty,
        createScoreDisplay: (scoreProperty) =>
          new ScoreDisplayStars(scoreProperty, { numberOfStars: NUMBER_OF_STARS, perfectScore: PERFECT_SCORE }),
        accessibleName: new PatternStringProperty(a11y.levelButtonPatternStringProperty, {
          number: i + 1,
          name: levelNames[i] as (typeof levelNames)[number],
        }),
        accessibleHelpText: a11y.levelButtonHelpStringProperty,
        listener: () => model.startLevel(i + 1),
      },
    }));
    const levelButtons = new LevelSelectionButtonGroup(items, {
      groupButtonWidth: LEVEL_BUTTON_SIZE,
      groupButtonHeight: LEVEL_BUTTON_SIZE,
      flowBoxOptions: { spacing: 30 },
      gameLevels: lewisStructuresQueryParameters.gameLevels,
      tandem: options?.tandem?.createTandem("levelSelectionButtonGroup") ?? Tandem.OPT_OUT,
    });
    const captions = new Node({
      children: levelButtons.buttons.map(
        (button, i) =>
          new VBox({
            spacing: 2,
            maxWidth: LEVEL_BUTTON_SIZE + 30,
            children: [
              new Text(levelNames[i] as (typeof levelNames)[number], {
                font: new PhetFont({ size: 15, weight: "bold" }),
                fill: LewisStructuresColors.textColorProperty,
              }),
              new Text(levelDescriptions[i] as (typeof levelDescriptions)[number], {
                font: new PhetFont(12),
                fill: LewisStructuresColors.textColorProperty,
              }),
            ],
            centerX: button.centerX,
            top: levelButtons.bottom + 10,
          }),
      ),
    });
    const levelSelection = new VBox({
      spacing: 34,
      children: [
        new Text(strings.chooseLevelStringProperty, {
          font: new PhetFont({ size: 28, weight: "bold" }),
          fill: LewisStructuresColors.textColorProperty,
          maxWidth: 500,
        }),
        new Node({ children: [levelButtons, captions] }),
      ],
      center: this.layoutBounds.center.plusXY(0, -20),
    });

    // ── Round: status bar and task ────────────────────────────────────────────
    const statusBar = new FiniteStatusBar(this.layoutBounds, this.visibleBoundsProperty, model.scoreProperty, {
      barFill: LewisStructuresColors.panelBackgroundColorProperty,
      barStroke: LewisStructuresColors.panelBorderColorProperty,
      font: new PhetFont(18),
      textFill: LewisStructuresColors.textColorProperty,
      levelNumberProperty: model.levelNumberProperty,
      challengeNumberProperty: model.challengeNumberProperty,
      numberOfChallengesProperty: model.numberOfChallengesProperty,
      startOverButtonOptions: {
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        textFill: LIGHT_SURFACE_TEXT_FILL,
        font: new PhetFont(15),
        listener: () => model.leaveLevel(),
      },
    });
    const taskProperty = DerivedProperty.deriveAny([model.speciesProperty, strings.taskPatternStringProperty], () => {
      const species = model.speciesProperty.value;
      return species
        ? StringUtils.fillIn(strings.taskPatternStringProperty.value, {
            formula: species.formula,
            name: speciesName(species).value,
          })
        : "";
    });
    const task = new RichText(taskProperty, {
      font: new PhetFont({ size: 20, weight: "bold" }),
      fill: LewisStructuresColors.textColorProperty,
      maxWidth: BOARD_WIDTH + 90,
      left: this.layoutBounds.minX + SCREEN_VIEW_MARGIN,
      top: this.layoutBounds.minY + TASK_TOP,
    });

    // ── Board, palette, toolbar ───────────────────────────────────────────────
    const targetProperty = new DerivedProperty([model.speciesProperty], (species) => species?.skeleton ?? null);
    const canvas = new LewisCanvasNode(drawing, BOARD_WIDTH, CHALLENGE_BOARD_HEIGHT, {
      targetProperty,
      showAllFormalChargesProperty: preferences.showAllFormalChargesProperty,
      showOctetRingsProperty: preferences.showOctetRingsProperty,
      hintStringProperty: common.boardHintStringProperty,
    });
    canvas.translation = this.layoutBounds.leftTop.plusXY(BOARD_LEFT, BOARD_TOP);
    const palette = new ElementPaletteNode(canvas);
    const palettePanel = new LewisStructuresPanel(palette, { xMargin: 6, yMargin: 6 });
    palettePanel.leftTop = this.layoutBounds.leftTop.plusXY(SCREEN_VIEW_MARGIN, BOARD_TOP);
    canvas.setDeleteZone((globalPoint: Vector2) => palettePanel.globalBounds.containsPoint(globalPoint));

    const undoButton = pushButton(common.undoStringProperty, () => structure.undo());
    const redoButton = pushButton(common.redoStringProperty, () => structure.redo());
    structure.canUndoProperty.link((canUndo) => {
      undoButton.enabled = canUndo;
    });
    structure.canRedoProperty.link((canRedo) => {
      redoButton.enabled = canRedo;
    });
    // The shape is a reward for a solved problem, so its checkbox is enabled only then.
    const shapeCheckbox = checkbox(
      model.showShapeProperty,
      StringManager.getInstance().getShapeStrings().toggleStringProperty,
      110,
    );
    const toolbar = new HBox({
      spacing: 8,
      children: [
        undoButton,
        redoButton,
        pushButton(common.tidyStringProperty, () => drawing.tidy()),
        pushButton(common.clearStringProperty, () => structure.clear()),
        shapeCheckbox,
      ],
    });
    toolbar.leftTop = canvas.leftBottom.plusXY(0, GAP);
    const selectionBar = new SelectionBarNode(drawing, BOARD_WIDTH);
    selectionBar.leftTop = toolbar.leftBottom.plusXY(0, GAP);

    // ── Right column: hints, electrons, check ─────────────────────────────────
    const hintButton = pushButton(strings.hintStringProperty, () => {
      model.takeHint();
      const species = model.speciesProperty.value;
      const hint = HINTS[model.hintsUsedProperty.value - 1];
      if (species && hint) {
        hintButton.addAccessibleResponse(hintText(hint, species, preferences.octetPolicyProperty.value));
      }
    });
    const hintsUsedProperty = new PatternStringProperty(strings.hintsUsedPatternStringProperty, {
      count: model.hintsUsedProperty,
      total: HINTS.length,
    });
    const hintsList = new RichText("", {
      font: SMALL_FONT,
      fill: LewisStructuresColors.textColorProperty,
      lineWrap: PANEL_CONTENT_WIDTH,
    });
    const hintsPanel = new LewisStructuresPanel(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new HBox({
            spacing: 10,
            children: [
              new Text(strings.hintsTitleStringProperty, {
                font: HEADING_FONT,
                fill: LewisStructuresColors.textColorProperty,
              }),
              hintButton,
              new Text(hintsUsedProperty, {
                font: SMALL_FONT,
                fill: LewisStructuresColors.mutedTextColorProperty,
                maxWidth: 120,
              }),
            ],
          }),
          hintsList,
        ],
      }),
      { minWidth: SIDE_PANEL_WIDTH, align: "left" },
    );

    const budgetPanel = new LewisStructuresPanel(
      new ElectronBudgetNode(structure, targetProperty, PANEL_CONTENT_WIDTH),
      {
        minWidth: SIDE_PANEL_WIDTH,
        align: "left",
      },
    );

    const checkButton = pushButton(strings.checkStringProperty, () => model.check());
    const nextButton = pushButton(strings.nextStringProperty, () => model.nextProblem());
    const feedback = new RichText("", { font: SMALL_FONT, lineWrap: PANEL_CONTENT_WIDTH });
    const checkPanel = new LewisStructuresPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [new HBox({ spacing: 8, children: [checkButton, nextButton] }), feedback],
      }),
      { minWidth: SIDE_PANEL_WIDTH, align: "left" },
    );

    // Once a problem is solved, the shape can take the hints' place.
    const shapePreview = new ShapePreviewNode(SHAPE_TEXT_WIDTH);
    Multilink.multilink([model.showShapeProperty, model.solvedProperty, structure.analysisProperty], (show, solved) => {
      shapeCheckbox.enabled = solved;
      shapePreview.visible = show && solved;
      hintsPanel.visible = !shapePreview.visible;
      if (shapePreview.visible) {
        shapePreview.update(structure.toData());
      }
    });

    const rightColumn = new VBox({
      align: "left",
      spacing: GAP,
      children: [hintsPanel, shapePreview, budgetPanel, checkPanel],
    });
    rightColumn.rightTop = this.layoutBounds.rightTop.plusXY(-SCREEN_VIEW_MARGIN, TASK_TOP);

    const round = new Node({
      children: [canvas, palettePanel, toolbar, selectionBar, rightColumn, task, statusBar],
    });

    // ── Updates ───────────────────────────────────────────────────────────────
    const updateHints = () => {
      const species = model.speciesProperty.value;
      const used = model.hintsUsedProperty.value;
      hintsList.string =
        species && used > 0
          ? HINTS.slice(0, used)
              .map((hint, i) => `${i + 1}. ${hintText(hint, species, preferences.octetPolicyProperty.value)}`)
              .join("<br>")
          : strings.noHintsStringProperty.value;
      hintButton.enabled = species !== null && !model.solvedProperty.value && used < HINTS.length;
      // Counting the electrons is the first step, so the count stays hidden until the first hint.
      budgetPanel.visible = used > 0 || model.solvedProperty.value;
    };
    Multilink.multilinkAny(
      [
        model.speciesProperty,
        model.hintsUsedProperty,
        model.solvedProperty,
        preferences.octetPolicyProperty,
        strings.noHintsStringProperty,
      ],
      updateHints,
    );

    const updateFeedback = () => {
      const outcome = model.outcomeProperty.value;
      const solved = model.solvedProperty.value;
      checkButton.enabled = !solved;
      nextButton.enabled = solved || model.revealedProperty.value;
      if (!outcome) {
        feedback.string = "";
        return;
      }
      if (solved) {
        feedback.string = model.revealedProperty.value
          ? strings.revealedStringProperty.value
          : StringUtils.fillIn(strings.correctPatternStringProperty.value, { points: model.lastPointsProperty.value });
        feedback.fill = LewisStructuresColors.goodColorProperty;
      } else {
        const text = describeOutcome(outcome, model.speciesProperty.value);
        feedback.string = text.text;
        feedback.fill =
          text.good === false ? LewisStructuresColors.poorColorProperty : LewisStructuresColors.textColorProperty;
      }
    };
    Multilink.multilinkAny([model.outcomeProperty, model.solvedProperty, model.revealedProperty], updateFeedback);
    model.outcomeProperty.lazyLink((outcome) => {
      if (outcome) {
        checkButton.addAccessibleResponse(feedback.string);
      }
    });

    // ── Reset All, visibility, round end ──────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [levelSelection, round, resetAllButton];
    model.levelProperty.link((level) => {
      levelSelection.visible = level === null;
      round.visible = level !== null;
      resetAllButton.visible = level === null;
    });

    model.roundCompleteProperty.link((complete) => {
      this.levelCompletedNode?.dispose();
      this.levelCompletedNode = null;
      if (complete) {
        this.levelCompletedNode = new LevelCompletedNode(
          model.levelNumberProperty.value,
          model.scoreProperty.value,
          PERFECT_SCORE,
          NUMBER_OF_STARS,
          false,
          0,
          0,
          false,
          () => model.leaveLevel(),
          {
            cornerRadius: PANEL_CORNER_RADIUS,
            buttonFont: new PhetFont(20),
            center: this.layoutBounds.center,
            contentMaxWidth: 400,
          },
        );
        this.addChild(this.levelCompletedNode);
      }
    });

    this.addChild(
      new Node({
        pdomOrder: [
          levelSelection,
          statusBar,
          task,
          palettePanel,
          canvas,
          toolbar,
          selectionBar,
          hintsPanel,
          shapePreview,
          budgetPanel,
          checkPanel,
          resetAllButton,
        ],
      }),
    );
  }
}

/** A small drawing of a representative species' best structure, for a level button. */
function levelIcon(id: string): Node {
  const skeleton = getSpecies(id).skeleton;
  const best = generateStructures(skeleton, OctetPolicy.ACCEPT_BOTH).best[0]?.data ?? skeleton;
  const node = new StructureNode(best, { pixelsPerBond: PIXELS_PER_BOND });
  node.setScaleMagnitude(Math.min(1, LEVEL_ICON_SIZE / node.width, LEVEL_ICON_SIZE / node.height));
  // The drawing is themed for the dark board, so it sits on a piece of board on the white button.
  const backing = new Rectangle(
    0,
    0,
    LEVEL_ICON_SIZE + 12,
    LEVEL_ICON_SIZE + 12,
    PANEL_CORNER_RADIUS,
    PANEL_CORNER_RADIUS,
    {
      fill: LewisStructuresColors.boardColorProperty,
    },
  );
  node.center = backing.center;
  return new Node({ children: [backing, node] });
}
