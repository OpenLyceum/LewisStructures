/**
 * OctetPolicy.ts
 *
 * Which structure counts as best when an atom in period 3 or below could expand its octet.
 * Textbooks disagree: OpenStax minimises formal charge (SO₄²⁻ with two S=O), while the modern view
 * keeps the octet and accepts formal charges (SO₄²⁻ with four S–O). A preference chooses:
 *
 *   ACCEPT_BOTH              — the minimum-formal-charge set is best, the octet set is also correct
 *   OCTET_FIRST              — expand only where it can't be avoided (SF₆, PCl₅, XeF₄, I₃⁻)
 *   MINIMIZE_FORMAL_CHARGE   — smallest formal charges, even when that expands an octet
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class OctetPolicy extends EnumerationValue {
  public static readonly ACCEPT_BOTH = new OctetPolicy();
  public static readonly OCTET_FIRST = new OctetPolicy();
  public static readonly MINIMIZE_FORMAL_CHARGE = new OctetPolicy();

  public static readonly enumeration = new Enumeration(OctetPolicy);
}
