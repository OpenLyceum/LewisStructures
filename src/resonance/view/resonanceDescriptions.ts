/**
 * resonanceDescriptions.ts
 *
 * Text for the Resonance screen: a form's multiple bonds and formal charges, the steps the curved
 * arrows show, the rank labels and explanations, and the hybrid's bond orders and charges.
 */

import { StringUtils } from "scenerystack/phetcommon";
import type { ScoredStructure } from "../../common/model/generateStructures.js";
import type { FormRank, ResonanceArrow, ResonanceHybrid } from "../../common/model/resonance.js";
import type { StructureData } from "../../common/model/StructureData.js";
import { atomLabels, joinList, orderName } from "../../common/view/boardDescriptions.js";
import { fractionText, signedCharge } from "../../common/view/formatValues.js";
import { StringManager } from "../../i18n/StringManager.js";

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

export function rankLabel(rank: FormRank): string {
  const ranks = StringManager.getInstance().getResonanceStrings().ranks;
  return {
    major: ranks.majorStringProperty,
    equivalent: ranks.equivalentStringProperty,
    alternative: ranks.alternativeStringProperty,
    acceptable: ranks.acceptableStringProperty,
    minor: ranks.minorStringProperty,
  }[rank].value;
}

export function rankExplanation(rank: FormRank, equivalentCount: number): string {
  const explanations = StringManager.getInstance().getResonanceStrings().explanations;
  switch (rank) {
    case "major":
      return explanations.majorSingleStringProperty.value;
    case "equivalent":
      return StringUtils.fillIn(explanations.equivalentPatternStringProperty.value, { count: equivalentCount });
    case "alternative":
      return explanations.alternativeStringProperty.value;
    case "acceptable":
      return explanations.acceptableStringProperty.value;
    case "minor":
      return explanations.minorStringProperty.value;
  }
}

/** "Double bond N–O1. Formal charges: N +1, O2 −1, O3 −1." */
export function formDescription(form: ScoredStructure): string {
  const a11y = StringManager.getInstance().getResonanceA11yStrings();
  const data = form.data;
  const labels = atomLabels(data);
  const multiple = data.bonds
    .filter((bond) => bond.order > 1)
    .map((bond) =>
      capitalize(
        StringUtils.fillIn(a11y.multipleBondPatternStringProperty.value, {
          order: orderName(bond.order),
          a: labels[bond.a],
          b: labels[bond.b],
        }),
      ),
    );
  const charges = form.formalCharges
    .map((charge, i) =>
      charge === 0
        ? null
        : StringUtils.fillIn(a11y.chargeItemPatternStringProperty.value, {
            atom: labels[i],
            charge: signedCharge(charge),
          }),
    )
    .filter((item): item is string => item !== null);
  return StringUtils.fillIn(a11y.formDescriptionPatternStringProperty.value, {
    bonds: multiple.length > 0 ? multiple.join(", ") : a11y.allSingleStringProperty.value,
    charges: charges.length > 0 ? charges.join(", ") : a11y.noChargesStringProperty.value,
  });
}

/** "To reach form 2: a lone pair on O2 becomes a bond to N and a pair from the N–O1 bond moves onto O1." */
export function arrowsDescription(data: StructureData, arrows: readonly ResonanceArrow[], nextNumber: number): string {
  const strings = StringManager.getInstance().getResonanceStrings();
  if (arrows.length === 0) {
    return strings.noArrowsStringProperty.value;
  }
  const labels = atomLabels(data);
  const ends = (bondIndex: number) => {
    const bond = data.bonds[bondIndex];
    return bond ? [labels[bond.a] ?? "", labels[bond.b] ?? ""] : ["", ""];
  };
  const steps = arrows.map((arrow) => {
    if (arrow.from.kind === "lonePair" && arrow.to.kind === "bond") {
      const [a, b] = ends(arrow.to.bond);
      const atom = labels[arrow.from.atom] ?? "";
      return StringUtils.fillIn(strings.lonePairToBondPatternStringProperty.value, { atom, other: atom === a ? b : a });
    }
    if (arrow.from.kind === "bond" && arrow.to.kind === "lonePair") {
      const [a, b] = ends(arrow.from.bond);
      return StringUtils.fillIn(strings.bondToLonePairPatternStringProperty.value, {
        a,
        b,
        atom: labels[arrow.to.atom],
      });
    }
    if (arrow.from.kind === "bond" && arrow.to.kind === "bond") {
      const [a, b] = ends(arrow.from.bond);
      const [c, d] = ends(arrow.to.bond);
      return StringUtils.fillIn(strings.bondToBondPatternStringProperty.value, { a, b, c, d });
    }
    return "";
  });
  return StringUtils.fillIn(strings.arrowsPatternStringProperty.value, { next: nextNumber, steps: joinList(steps) });
}

/** "N–O1 bond order 1⅓, …" and "N +1, O1 −⅔, …" for the hybrid. */
export function hybridParts(data: StructureData, hybrid: ResonanceHybrid): { bonds: string; charges: string } {
  const a11y = StringManager.getInstance().getResonanceA11yStrings();
  const labels = atomLabels(data);
  const bonds = data.bonds
    .map((bond, i) => ({ bond, order: hybrid.bondOrders[i] ?? bond.order }))
    .filter(({ bond }) => data.atoms[bond.a]?.element !== "H" && data.atoms[bond.b]?.element !== "H")
    .map(({ bond, order }) =>
      StringUtils.fillIn(a11y.hybridBondPatternStringProperty.value, {
        a: labels[bond.a],
        b: labels[bond.b],
        order: fractionText(order),
      }),
    );
  const charges = hybrid.formalCharges
    .map((charge, i) => (Math.abs(charge) < 1e-6 ? null : `${labels[i]} ${fractionText(charge, true)}`))
    .filter((item): item is string => item !== null);
  return {
    bonds: bonds.join(", "),
    charges: charges.length > 0 ? charges.join(", ") : a11y.noChargesStringProperty.value,
  };
}
