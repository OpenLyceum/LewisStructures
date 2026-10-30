/**
 * challengeHints.ts
 *
 * The text of each Challenge hint for a species, worked out from its skeleton and its best
 * structure under the current policy, so every catalog species gets hints without hand-written
 * text.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { analyzeStructure } from "../../common/model/analyzeStructure.js";
import { getElement } from "../../common/model/ElementData.js";
import { generateStructures } from "../../common/model/generateStructures.js";
import type { OctetPolicy } from "../../common/model/OctetPolicy.js";
import { OctetStatus } from "../../common/model/OctetStatus.js";
import type { Species } from "../../common/model/SpeciesCatalog.js";
import { orderName } from "../../common/view/boardDescriptions.js";
import { signedCharge } from "../../common/view/formatValues.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { Hint } from "../model/ChallengeModel.js";

export function hintText(hint: Hint, species: Species, policy: OctetPolicy): string {
  const hints = StringManager.getInstance().getChallengeStrings().hints;
  const skeleton = species.skeleton;
  switch (hint) {
    case "electrons": {
      const fromAtoms = skeleton.atoms.reduce((sum, atom) => sum + getElement(atom.element).valence, 0);
      const charge = skeleton.charge;
      return StringUtils.fillIn(hints.electronsPatternStringProperty.value, {
        total: fromAtoms - charge,
        fromAtoms,
        chargePart:
          charge === 0
            ? ""
            : StringUtils.fillIn(hints.chargePartPatternStringProperty.value, { change: signedCharge(-charge) }),
      });
    }
    case "central": {
      const central = species.central === null ? null : skeleton.atoms[species.central];
      if (central) {
        return StringUtils.fillIn(hints.centralPatternStringProperty.value, { element: central.element });
      }
      return skeleton.atoms.length === 2 ? hints.pairStringProperty.value : hints.chainStringProperty.value;
    }
    case "skeleton":
      return hints.skeletonStringProperty.value;
    case "bonding":
      return bondingHint(species, policy);
    case "answer":
      return hints.answerStringProperty.value;
  }
}

/** Where the best structure departs from "all single bonds, every atom an octet". */
function bondingHint(species: Species, policy: OctetPolicy): string {
  const hints = StringManager.getInstance().getChallengeStrings().hints;
  const best = generateStructures(species.skeleton, policy).best[0];
  if (!best) {
    return hints.allSingleStringProperty.value;
  }
  const data = best.data;
  const analysis = analyzeStructure(data);
  const sentences = new Set<string>();
  for (const bond of data.bonds) {
    if (bond.order > 1) {
      sentences.add(
        StringUtils.fillIn(hints.multipleBondPatternStringProperty.value, {
          order: orderName(bond.order),
          a: data.atoms[bond.a]?.element ?? "",
          b: data.atoms[bond.b]?.element ?? "",
        }),
      );
    }
  }
  analysis.atoms.forEach((atom, i) => {
    const element = data.atoms[i]?.element ?? "";
    const fill = { element, count: atom.electrons };
    if (atom.status === OctetStatus.EXPANDED) {
      sentences.add(StringUtils.fillIn(hints.expandedPatternStringProperty.value, fill));
    } else if (atom.status === OctetStatus.INCOMPLETE_ALLOWED) {
      sentences.add(StringUtils.fillIn(hints.incompletePatternStringProperty.value, fill));
    }
    if ((data.atoms[i]?.unpaired ?? 0) > 0) {
      sentences.add(StringUtils.fillIn(hints.radicalPatternStringProperty.value, { element }));
    }
  });
  return sentences.size > 0 ? [...sentences].join(" ") : hints.allSingleStringProperty.value;
}
