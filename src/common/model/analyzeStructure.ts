/**
 * analyzeStructure.ts
 *
 * The electron bookkeeping of a drawing, in one pure function that the checklist, the formal-charge
 * badges, the answer check, the Challenge grading and the spoken descriptions all read:
 *
 *   valence total  = Σ valence − charge
 *   placed         = 2 · Σ bond order + 2 · lone pairs + unpaired
 *   formal charge  = valence − nonbonding electrons − Σ bond order at the atom
 *
 * Σ formal charge = Σ valence − placed, so the formal charges add up to the charge exactly when
 * every electron is placed. The checklist still shows the sum, because seeing that is the point.
 */

import { getElement, MAX_EXPANDED_ELECTRONS } from "./ElementData.js";
import { OctetStatus } from "./OctetStatus.js";
import { bondOrderSums, isConnected, neighborLists, type StructureData } from "./StructureData.js";

export type AtomAnalysis = {
  readonly bondOrderSum: number;
  readonly neighborCount: number;
  readonly nonbonding: number;
  /** Electrons around the atom: shared pairs count fully, as in the octet rule. */
  readonly electrons: number;
  readonly formalCharge: number;
  readonly status: OctetStatus;
};

export type StructureAnalysis = {
  readonly totalValence: number;
  readonly placed: number;
  /** Electrons still to place; negative when too many are placed. */
  readonly remaining: number;
  readonly atoms: readonly AtomAnalysis[];
  readonly connected: boolean;
  readonly unpairedCount: number;
  /** 1 when the electron total is odd, else 0. */
  readonly expectedUnpaired: number;
  readonly formalChargeSum: number;
  /** Every atom satisfied, all electrons placed, connected, and the right number of unpaired electrons. */
  readonly complete: boolean;
};

/** How an atom holding `electrons` (with `neighborCount` bonds) stands against its element's rules. */
export function octetStatusFor(
  data: StructureData,
  index: number,
  electrons: number,
  neighborCount: number,
): OctetStatus {
  const atom = data.atoms[index];
  if (!atom) {
    return OctetStatus.SHORT;
  }
  const element = getElement(atom.element);
  if (atom.element === "H") {
    return electrons === 2 ? OctetStatus.DUET : electrons < 2 ? OctetStatus.SHORT : OctetStatus.OVER;
  }
  const odd = electrons % 2 === 1;
  if (electrons === element.target) {
    return OctetStatus.OCTET;
  }
  if (electrons < element.target) {
    if (odd && electrons === element.target - 1) {
      return OctetStatus.RADICAL;
    }
    return electrons === element.allowedIncomplete ? OctetStatus.INCOMPLETE_ALLOWED : OctetStatus.SHORT;
  }
  // Only a bonded central atom may expand: a lone halide or a terminal atom with 10 is never right.
  if (element.canExpand && neighborCount >= 2 && electrons <= MAX_EXPANDED_ELECTRONS) {
    return odd ? OctetStatus.RADICAL : OctetStatus.EXPANDED;
  }
  return OctetStatus.OVER;
}

export function analyzeStructure(data: StructureData): StructureAnalysis {
  const sums = bondOrderSums(data);
  const neighbors = neighborLists(data);
  let totalValence = -data.charge;
  let placed = 0;
  let unpairedCount = 0;
  let formalChargeSum = 0;

  const atoms = data.atoms.map((atom, i): AtomAnalysis => {
    const valence = getElement(atom.element).valence;
    const bondOrderSum = sums[i] ?? 0;
    const neighborCount = neighbors[i]?.length ?? 0;
    const nonbonding = 2 * atom.lonePairs + atom.unpaired;
    const electrons = 2 * bondOrderSum + nonbonding;
    const formalCharge = valence - nonbonding - bondOrderSum;
    totalValence += valence;
    placed += nonbonding;
    unpairedCount += atom.unpaired;
    formalChargeSum += formalCharge;
    return {
      bondOrderSum,
      neighborCount,
      nonbonding,
      electrons,
      formalCharge,
      status: octetStatusFor(data, i, electrons, neighborCount),
    };
  });
  for (const bond of data.bonds) {
    placed += 2 * bond.order;
  }

  const remaining = totalValence - placed;
  const expectedUnpaired = ((totalValence % 2) + 2) % 2;
  const connected = isConnected(data);
  const complete =
    connected && remaining === 0 && unpairedCount === expectedUnpaired && atoms.every((atom) => atom.status.satisfied);

  return {
    totalValence,
    placed,
    remaining,
    atoms,
    connected,
    unpairedCount,
    expectedUnpaired,
    formalChargeSum,
    complete,
  };
}
