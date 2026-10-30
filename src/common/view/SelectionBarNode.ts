/**
 * SelectionBarNode.ts
 *
 * Controls for what is selected on the board, under it. An atom: its electron count and formal
 * charge, lone pairs −/+, the unpaired-electron toggle, and Delete. A bond: single, double or
 * triple, and Delete. Nothing: a short instruction. The controls are built once and updated, never
 * rebuilt, so a button is not disposed while its own press is being handled.
 */

import { BooleanProperty, Multilink, NumberProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text } from "scenerystack/scenery";
import { RectangularPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../LewisStructuresButtonOptions.js";
import type { DrawingModel } from "../model/DrawingModel.js";
import { MAX_LONE_PAIRS } from "../model/StructureData.js";
import { CONTROL_FONT, checkbox, label, pushButton, radioGroup } from "./ControlFactory.js";
import { signedCharge } from "./formatValues.js";

const SYMBOL_BUTTON_FONT = CONTROL_FONT;

export class SelectionBarNode extends Node {
  private readonly disposeSelectionBarNode: () => void;

  public constructor(drawing: DrawingModel, width: number) {
    super();
    const strings = StringManager.getInstance().getCommonStrings().selection;
    const structure = drawing.structure;

    // ── Nothing selected ────────────────────────────────────────────────────
    const noneText = new RichText(strings.noneStringProperty, {
      font: CONTROL_FONT,
      fill: LewisStructuresColors.mutedTextColorProperty,
      maxWidth: width,
    });

    // ── Atom ────────────────────────────────────────────────────────────────
    const atomSummary = label("", 230);
    const lonePairCount = new Text("0", { font: CONTROL_FONT, fill: LewisStructuresColors.textColorProperty });
    const smallButton = (text: string, listener: () => void, accessibleName: typeof strings.lonePairsStringProperty) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(text, { font: SYMBOL_BUTTON_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
        xMargin: 7,
        yMargin: 2,
        listener,
        accessibleName,
      });
    const withAtom = (action: (atom: NonNullable<typeof drawing.selectedAtomProperty.value>) => void) => () => {
      const atom = drawing.selectedAtomProperty.value;
      if (atom) {
        action(atom);
      }
    };
    const removePairButton = smallButton(
      "−",
      withAtom((atom) => structure.removeLonePair(atom)),
      strings.lonePairsStringProperty,
    );
    const addPairButton = smallButton(
      "+",
      withAtom((atom) => structure.addLonePair(atom)),
      strings.lonePairsStringProperty,
    );
    const unpairedProperty = new BooleanProperty(false);
    let syncing = false;
    unpairedProperty.lazyLink((unpaired) => {
      const atom = drawing.selectedAtomProperty.value;
      if (!syncing && atom && (atom.unpaired === 1) !== unpaired) {
        structure.toggleUnpaired(atom);
      }
    });
    const unpairedCheckbox = checkbox(unpairedProperty, strings.unpairedStringProperty, 140);
    const deleteAtomButton = pushButton(
      strings.deleteStringProperty,
      withAtom((atom) => structure.removeAtom(atom)),
    );
    const atomBar = new HBox({
      spacing: 10,
      children: [
        atomSummary,
        new HBox({
          spacing: 5,
          children: [label(strings.lonePairsStringProperty, 90), removePairButton, lonePairCount, addPairButton],
        }),
        unpairedCheckbox,
        deleteAtomButton,
      ],
    });

    // ── Bond ────────────────────────────────────────────────────────────────
    const bondTitle = label("", 120);
    const orderProperty = new NumberProperty(1);
    orderProperty.lazyLink((order) => {
      const bond = drawing.selectedBondProperty.value;
      if (!syncing && bond && bond.order !== order) {
        structure.setBondOrder(bond.atomA, bond.atomB, order);
      }
    });
    const orderGroup = radioGroup(
      orderProperty,
      [
        { value: 1, label: strings.singleStringProperty },
        { value: 2, label: strings.doubleStringProperty },
        { value: 3, label: strings.tripleStringProperty },
      ],
      strings.bondOrderStringProperty,
      90,
      "horizontal",
    );
    const deleteBondButton = pushButton(strings.deleteStringProperty, () => {
      const bond = drawing.selectedBondProperty.value;
      if (bond) {
        structure.setBondOrder(bond.atomA, bond.atomB, 0);
      }
    });
    const bondBar = new HBox({ spacing: 14, children: [bondTitle, orderGroup, deleteBondButton] });

    this.children = [noneText, atomBar, bondBar];

    const update = () => {
      const atom = drawing.selectedAtomProperty.value;
      const bond = drawing.selectedBondProperty.value;
      noneText.visible = !(atom || bond);
      atomBar.visible = atom !== null;
      bondBar.visible = bond !== null;
      syncing = true;
      if (atom) {
        const analysis = structure.analysisOf(atom);
        atomSummary.string = StringUtils.fillIn(strings.atomSummaryPatternStringProperty.value, {
          atom: structure.labelOf(atom),
          electrons: analysis?.electrons ?? 0,
          charge: signedCharge(analysis?.formalCharge ?? 0),
        });
        lonePairCount.string = `${atom.lonePairs}`;
        removePairButton.enabled = atom.lonePairs > 0;
        addPairButton.enabled = atom.lonePairs < MAX_LONE_PAIRS;
        unpairedProperty.value = atom.unpaired === 1;
      }
      if (bond) {
        bondTitle.string = StringUtils.fillIn(strings.bondPatternStringProperty.value, {
          a: structure.labelOf(bond.atomA),
          b: structure.labelOf(bond.atomB),
        });
        orderProperty.value = bond.order;
      }
      syncing = false;
    };
    const multilink = Multilink.multilinkAny(
      [
        drawing.selectedAtomProperty,
        drawing.selectedBondProperty,
        structure.analysisProperty,
        strings.atomSummaryPatternStringProperty,
        strings.bondPatternStringProperty,
      ],
      update,
    );

    this.disposeSelectionBarNode = () => {
      multilink.dispose();
      unpairedProperty.dispose();
      orderProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposeSelectionBarNode();
    super.dispose();
  }
}
