/**
 * boardDescriptions.ts
 *
 * Spoken text for the drawing board: one atom (element, bonds, electrons, formal charge and octet
 * status), the electron budget, and the whole drawing for the screen summary. Every sentence comes
 * from the a11y.board strings, so it is localised; formal charges use a true minus sign.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { StringManager } from "../../i18n/StringManager.js";
import { electronBudget } from "../model/electronBudget.js";
import type { LewisAtom, LewisStructure } from "../model/LewisStructure.js";
import { OctetStatus } from "../model/OctetStatus.js";
import type { Species } from "../model/SpeciesCatalog.js";
import type { StructureData } from "../model/StructureData.js";
import { describeHint } from "./ChecklistNode.js";
import { signedCharge } from "./formatValues.js";
import { elementName, speciesName } from "./speciesLabels.js";

function boardStrings() {
  return StringManager.getInstance().getBoardA11yStrings();
}

/** "single", "double" or "triple". */
export function orderName(order: number): string {
  const strings = boardStrings();
  return (
    order === 3
      ? strings.tripleStringProperty
      : order === 2
        ? strings.doubleStringProperty
        : strings.singleStringProperty
  ).value;
}

/** "A", "A and B", "A, B and C". */
export function joinList(items: readonly string[]): string {
  const and = boardStrings().andStringProperty.value;
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function lonePairText(count: number): string {
  const strings = boardStrings();
  if (count === 0) {
    return strings.noLonePairsStringProperty.value;
  }
  return count === 1
    ? strings.oneLonePairStringProperty.value
    : StringUtils.fillIn(strings.lonePairsPatternStringProperty.value, { count });
}

function statusText(status: OctetStatus): string {
  const strings = boardStrings().status;
  const byStatus = new Map([
    [OctetStatus.DUET, strings.duetStringProperty],
    [OctetStatus.OCTET, strings.octetStringProperty],
    [OctetStatus.INCOMPLETE_ALLOWED, strings.incompleteAllowedStringProperty],
    [OctetStatus.EXPANDED, strings.expandedStringProperty],
    [OctetStatus.RADICAL, strings.radicalStringProperty],
    [OctetStatus.SHORT, strings.shortStringProperty],
    [OctetStatus.OVER, strings.overStringProperty],
  ]);
  return byStatus.get(status)?.value ?? "";
}

/** Everything about one atom, e.g. "O1, oxygen. Bonded to N by a double bond. 2 lone pairs, …". */
export function atomDescription(structure: LewisStructure, atom: LewisAtom): string {
  const strings = boardStrings();
  const analysis = structure.analysisOf(atom);
  const bonds = structure.bondsOf(atom);
  const bondsText =
    bonds.length === 0
      ? strings.noBondsStringProperty.value
      : StringUtils.fillIn(strings.bondsPatternStringProperty.value, {
          list: joinList(
            bonds.map((bond) =>
              StringUtils.fillIn(strings.bondItemPatternStringProperty.value, {
                atom: structure.labelOf(bond.other(atom)),
                order: orderName(bond.order),
              }),
            ),
          ),
        });
  const electrons = StringUtils.fillIn(strings.electronsPatternStringProperty.value, {
    lonePairs: lonePairText(atom.lonePairs),
    unpaired: atom.unpaired ? strings.unpairedPartStringProperty.value : "",
    count: analysis?.electrons ?? 0,
    charge: signedCharge(analysis?.formalCharge ?? 0),
  });
  return StringUtils.fillIn(strings.atomPatternStringProperty.value, {
    label: structure.labelOf(atom),
    element: elementName(atom.element).value,
    bonds: bondsText,
    electrons: capitalize(electrons),
    status: analysis ? statusText(analysis.status) : "",
  });
}

/** The short form used after an edit: "2 lone pairs, 8 electrons, formal charge 0. Octet complete." */
export function atomBrief(structure: LewisStructure, atom: LewisAtom): string {
  const strings = boardStrings();
  const analysis = structure.analysisOf(atom);
  const electrons = StringUtils.fillIn(strings.electronsPatternStringProperty.value, {
    lonePairs: lonePairText(atom.lonePairs),
    unpaired: atom.unpaired ? strings.unpairedPartStringProperty.value : "",
    count: analysis?.electrons ?? 0,
    charge: signedCharge(analysis?.formalCharge ?? 0),
  });
  const sentence = capitalize(electrons);
  return analysis ? `${sentence}. ${statusText(analysis.status)}.` : `${sentence}.`;
}

/** "6 electrons left to place." / "All electrons placed." / "2 electrons too many." */
export function budgetSentence(structure: LewisStructure, target: StructureData | null): string {
  const strings = boardStrings();
  const { left } = electronBudget(structure, target);
  if (left === 0) {
    return strings.allPlacedStringProperty.value;
  }
  return left > 0
    ? StringUtils.fillIn(strings.leftPatternStringProperty.value, { count: left })
    : StringUtils.fillIn(strings.overPatternStringProperty.value, { count: -left });
}

/** The live screen-summary paragraph: what is being drawn, every atom, the budget and the next step. */
export function drawingDetails(structure: LewisStructure, species: Species | null): string {
  const strings = boardStrings();
  const atoms = structure.atoms;
  const atomsText =
    atoms.length === 0
      ? strings.emptyStringProperty.value
      : [
          StringUtils.fillIn(strings.atomCountPatternStringProperty.value, { count: atoms.length }),
          ...atoms.map((atom) => atomDescription(structure, atom)),
        ].join(" ");
  const common = {
    atoms: atomsText,
    budget: budgetSentence(structure, species?.skeleton ?? null),
    hint: describeHint(structure, structure.analysisProperty.value, species?.skeleton ?? null),
  };
  return species
    ? StringUtils.fillIn(strings.detailsSpeciesPatternStringProperty.value, {
        ...common,
        name: speciesName(species).value,
        formula: species.spokenFormula,
      })
    : StringUtils.fillIn(strings.detailsFreePatternStringProperty.value, {
        ...common,
        charge: signedCharge(structure.chargeProperty.value),
      });
}
