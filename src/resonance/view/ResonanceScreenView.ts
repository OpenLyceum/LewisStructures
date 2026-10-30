/**
 * ResonanceScreenView.ts
 *
 * The Resonance screen. A large view on the left shows one form with curved arrows to the next, the
 * hybrid, or the species' skeleton for the student to complete; the gallery on the right lists
 * every form worth comparing, ranked; the panel under it explains the form shown.
 *
 *   ┌ chooser ─────────────────┐ ┌ gallery (3 × 3 cards) ┐
 *   │ large view / board       │ │                       │
 *   │                          │ └───────────────────────┘
 *   └──────────────────────────┘ ┌ explanation ──────────┐
 *     mode · prev/next · arrows  └───────────────────────┘
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, HBox, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/LewisStructuresButtonOptions.js";
import { LewisStructuresPanel } from "../../common/LewisStructuresPanel.js";
import { resonanceArrows, resonanceHybrid } from "../../common/model/resonance.js";
import { describeHint } from "../../common/view/ChecklistNode.js";
import {
  checkbox,
  comboBox,
  HEADING_FONT,
  pushButton,
  radioGroup,
  SMALL_FONT,
} from "../../common/view/ControlFactory.js";
import { CurvedArrowsNode } from "../../common/view/CurvedArrowsNode.js";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { LewisCanvasNode } from "../../common/view/LewisCanvasNode.js";
import { SelectionBarNode } from "../../common/view/SelectionBarNode.js";
import { StructureNode } from "../../common/view/StructureNode.js";
import { speciesDisplay, speciesName } from "../../common/view/speciesLabels.js";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import {
  BOARD_HEIGHT,
  PANEL_CORNER_RADIUS,
  PIXELS_PER_BOND,
  RESONANCE_BOARD_WIDTH,
  SCREEN_VIEW_MARGIN,
} from "../../LewisStructuresConstants.js";
import type { LewisStructuresPreferencesModel } from "../../preferences/LewisStructuresPreferencesModel.js";
import type { ResonanceCheck, ResonanceModel } from "../model/ResonanceModel.js";
import { FormCardNode } from "./FormCardNode.js";
import { ResonanceScreenSummaryContent } from "./ResonanceScreenSummaryContent.js";
import { arrowsDescription, formDescription, rankExplanation, rankLabel } from "./resonanceDescriptions.js";

const TOP = 12;
const BOARD_TOP = 64;
const GAP = 10;
const RIGHT_WIDTH = 444;
const CARD_COLUMNS = 3;
const CARD_HEIGHT = 118;
/** Largest magnification of a form in the large view (arrows need room to be read). */
const LARGE_SCALE = 1.5;
const CARD_GAP = 6;
const EXPLANATION_WIDTH = RIGHT_WIDTH - 24;

export class ResonanceScreenView extends ScreenView {
  public constructor(model: ResonanceModel, preferences: LewisStructuresPreferencesModel, options?: ScreenViewOptions) {
    super({ screenSummaryContent: new ResonanceScreenSummaryContent(model), ...options });

    const strings = StringManager.getInstance().getResonanceStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const listParent = new Node();

    // ── Chooser ───────────────────────────────────────────────────────────────
    const chooser = comboBox(
      model.speciesProperty,
      model.speciesList.map((species) => ({
        value: species,
        label: speciesName(species),
        display: speciesDisplay(species),
      })),
      listParent,
      strings.speciesStringProperty,
      300,
    );
    const formula = new RichText("", {
      font: new PhetFont({ size: 26, weight: "bold" }),
      fill: LewisStructuresColors.textColorProperty,
    });
    model.speciesProperty.link((species) => {
      formula.string = species.formula;
    });
    const header = new HBox({ spacing: 14, children: [chooser, formula] });
    header.leftTop = this.layoutBounds.leftTop.plusXY(SCREEN_VIEW_MARGIN, TOP);

    // ── Large view: a form, the hybrid, or the drawing board ──────────────────
    const viewOrigin = this.layoutBounds.leftTop.plusXY(SCREEN_VIEW_MARGIN, BOARD_TOP);
    const viewFrame = new Rectangle(
      0,
      0,
      RESONANCE_BOARD_WIDTH,
      BOARD_HEIGHT,
      PANEL_CORNER_RADIUS,
      PANEL_CORNER_RADIUS,
      {
        fill: LewisStructuresColors.boardColorProperty,
        stroke: LewisStructuresColors.boardBorderColorProperty,
        translation: viewOrigin,
      },
    );
    const formLayer = new Node({ translation: viewOrigin });

    const targetProperty = new DerivedProperty([model.speciesProperty], (species) => species.skeleton);
    const canvas = new LewisCanvasNode(model.drawing, RESONANCE_BOARD_WIDTH, BOARD_HEIGHT, {
      targetProperty,
      showAllFormalChargesProperty: preferences.showAllFormalChargesProperty,
      showOctetRingsProperty: preferences.showOctetRingsProperty,
      hintStringProperty: strings.drawHintStringProperty,
    });
    canvas.translation = viewOrigin;

    // ── Controls under the view ───────────────────────────────────────────────
    const modeGroup = radioGroup(
      model.modeProperty,
      [
        { value: "forms" as const, label: strings.formsStringProperty },
        { value: "hybrid" as const, label: strings.hybridStringProperty },
        { value: "draw" as const, label: strings.drawStringProperty },
      ],
      strings.modeStringProperty,
      110,
      "horizontal",
    );
    const announcer = new Node({ tagName: "div" });
    const rankHeading = (number: number, rank: string) =>
      `${StringUtils.fillIn(strings.formPatternStringProperty.value, { number })}: ${rank}`;
    const announceForm = () => {
      const form = model.selectedForm;
      if (form) {
        announcer.addAccessibleResponse(
          `${rankHeading(model.selectedIndexProperty.value + 1, rankLabel(form.rank))}. ${formDescription(form.form)}`,
        );
      }
    };
    const previousButton = pushButton(strings.previousStringProperty, () => {
      model.selectNext(-1);
      announceForm();
    });
    const nextButton = pushButton(strings.nextStringProperty, () => {
      model.selectNext(1);
      announceForm();
    });
    const arrowsCheckbox = checkbox(model.showArrowsProperty, strings.showArrowsStringProperty, 150);
    const formControls = new HBox({ spacing: 8, children: [previousButton, nextButton, arrowsCheckbox] });
    const checkButton = pushButton(strings.checkStringProperty, () => model.check());
    const startOverButton = pushButton(strings.startOverStringProperty, () => model.startDrawing());
    const drawControls = new HBox({ spacing: 8, children: [checkButton, startOverButton] });
    const controls = new HBox({ spacing: 18, children: [modeGroup, formControls, drawControls] });
    controls.maxWidth = RESONANCE_BOARD_WIDTH;
    controls.leftTop = viewFrame.leftBottom.plusXY(0, GAP);

    const selectionBar = new SelectionBarNode(model.drawing, RESONANCE_BOARD_WIDTH);
    selectionBar.leftTop = controls.leftBottom.plusXY(0, GAP);
    selectionBar.maxWidth = RESONANCE_BOARD_WIDTH + 40;

    // ── Gallery ───────────────────────────────────────────────────────────────
    const cardWidth = (RIGHT_WIDTH - 24 - (CARD_COLUMNS - 1) * CARD_GAP) / CARD_COLUMNS;
    const cardGrid = new GridBox({ autoColumns: CARD_COLUMNS, xSpacing: CARD_GAP, ySpacing: CARD_GAP });
    let cards: FormCardNode[] = [];
    const galleryPanel = new LewisStructuresPanel(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new Text(strings.galleryTitleStringProperty, {
            font: HEADING_FONT,
            fill: LewisStructuresColors.textColorProperty,
          }),
          cardGrid,
        ],
      }),
      { minWidth: RIGHT_WIDTH, align: "left" },
    );
    model.galleryProperty.link((gallery) => {
      disposeChildren(cardGrid);
      cards = gallery.map(
        (form, i) =>
          new FormCardNode(form, i + 1, cardWidth, CARD_HEIGHT, () => {
            model.selectedIndexProperty.value = i;
            model.modeProperty.value = "forms";
            announceForm();
          }),
      );
      cardGrid.children = cards;
    });
    galleryPanel.rightTop = this.layoutBounds.rightTop.plusXY(-SCREEN_VIEW_MARGIN, TOP);

    // ── Explanation ───────────────────────────────────────────────────────────
    const explanationTitle = new RichText("", {
      font: HEADING_FONT,
      fill: LewisStructuresColors.textColorProperty,
      maxWidth: EXPLANATION_WIDTH,
    });
    const explanationBody = new RichText("", {
      font: SMALL_FONT,
      fill: LewisStructuresColors.textColorProperty,
      lineWrap: EXPLANATION_WIDTH,
    });
    const explanationPanel = new LewisStructuresPanel(
      new VBox({ align: "left", spacing: 6, children: [explanationTitle, explanationBody] }),
      { minWidth: RIGHT_WIDTH, align: "left" },
    );
    // The gallery grows with the number of forms, so the explanation follows its bottom edge.
    galleryPanel.boundsProperty.link(() => {
      explanationPanel.rightTop = galleryPanel.rightBottom.plusXY(0, GAP);
    });

    // ── Updates ───────────────────────────────────────────────────────────────
    const center = { x: RESONANCE_BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
    /** Scales a drawing to fill the view (up to LARGE_SCALE) and centres it. */
    const placeInView = (node: Node) => {
      node.setScaleMagnitude(
        Math.min(LARGE_SCALE, (RESONANCE_BOARD_WIDTH - 60) / node.width, (BOARD_HEIGHT - 60) / node.height),
      );
      node.translation = node.translation.setXY(center.x, center.y);
      formLayer.addChild(node);
    };

    const showForm = () => {
      const gallery = model.galleryProperty.value;
      const index = model.selectedIndexProperty.value;
      const form = gallery[index];
      if (!form) {
        return;
      }
      const nextIndex = (index + 1) % gallery.length;
      const next = gallery.length > 1 ? gallery[nextIndex] : undefined;
      const arrows = model.showArrowsProperty.value && next ? resonanceArrows(form.form.data, next.form.data) : null;
      const structure = new StructureNode(form.form.data, {
        pixelsPerBond: PIXELS_PER_BOND,
        showAllFormalCharges: preferences.showAllFormalChargesProperty.value,
        showOctetRings: preferences.showOctetRingsProperty.value,
        showLabels: true,
      });
      placeInView(new Node({ children: arrows ? [structure, new CurvedArrowsNode(structure, arrows)] : [structure] }));

      explanationTitle.string = rankHeading(index + 1, rankLabel(form.rank));
      const lines = [
        rankExplanation(form.rank, model.bestForms.length),
        StringUtils.fillIn(strings.chargeSumPatternStringProperty.value, { sum: form.form.absoluteSum }),
      ];
      if (arrows) {
        lines.push(arrowsDescription(form.form.data, arrows, nextIndex + 1));
      }
      explanationBody.string = lines.join("<br>");
    };

    const showHybrid = () => {
      const best = model.bestForms.map((f) => f.form);
      const first = best[0];
      if (!first) {
        return;
      }
      placeInView(
        new StructureNode(first.data, {
          pixelsPerBond: PIXELS_PER_BOND,
          hybrid: resonanceHybrid(best),
          showLabels: true,
        }),
      );
      explanationTitle.string = strings.hybridStringProperty.value;
      explanationBody.string =
        best.length > 1
          ? StringUtils.fillIn(strings.hybridPatternStringProperty.value, { count: best.length })
          : strings.hybridSingleStringProperty.value;
    };

    const checkSentence = (check: ResonanceCheck): string => {
      const matched = check.kind === "match" ? model.galleryProperty.value[check.index] : undefined;
      if (check.kind === "match" && matched) {
        return StringUtils.fillIn(strings.matchPatternStringProperty.value, {
          number: check.index + 1,
          rank: rankLabel(matched.rank),
        });
      }
      if (check.kind === "other") {
        return strings.otherStringProperty.value;
      }
      return check.kind === "wrongSkeleton"
        ? strings.wrongSkeletonStringProperty.value
        : strings.incompleteStringProperty.value;
    };

    const showDraw = () => {
      const structure = model.drawing.structure;
      const check = model.checkProperty.value;
      explanationTitle.string = strings.drawStringProperty.value;
      explanationBody.string = [
        strings.drawHintStringProperty.value,
        check ? checkSentence(check) : describeHint(structure, structure.analysisProperty.value, targetProperty.value),
      ].join("<br>");
    };

    const update = () => {
      const mode = model.modeProperty.value;
      const index = model.selectedIndexProperty.value;
      cards.forEach((card, i) => {
        card.setSelected(mode === "forms" && i === index);
      });
      canvas.visible = mode === "draw";
      selectionBar.visible = mode === "draw";
      drawControls.visible = mode === "draw";
      formControls.visible = mode === "forms";
      formLayer.visible = mode !== "draw";
      disposeChildren(formLayer);
      if (mode === "forms") {
        showForm();
      } else if (mode === "hybrid") {
        showHybrid();
      } else {
        showDraw();
      }
    };
    Multilink.multilinkAny(
      [
        model.modeProperty,
        model.galleryProperty,
        model.selectedIndexProperty,
        model.showArrowsProperty,
        model.checkProperty,
        model.drawing.structure.analysisProperty,
        preferences.showAllFormalChargesProperty,
        preferences.showOctetRingsProperty,
        common.feedback.incompleteStringProperty,
      ],
      update,
    );
    model.checkProperty.lazyLink((check) => {
      if (check) {
        announcer.addAccessibleResponse(checkSentence(check));
      }
    });

    // ── Reset All ─────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [
      viewFrame,
      formLayer,
      canvas,
      controls,
      selectionBar,
      galleryPanel,
      explanationPanel,
      header,
      resetAllButton,
      announcer,
      listParent,
    ];
    this.addChild(
      new Node({
        pdomOrder: [header, controls, canvas, selectionBar, galleryPanel, explanationPanel, resetAllButton],
      }),
    );
  }
}
