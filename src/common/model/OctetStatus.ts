/**
 * OctetStatus.ts
 *
 * How the electrons around one atom compare with what it wants. DUET, OCTET, INCOMPLETE_ALLOWED
 * (Be with 4, B or Al with 6), EXPANDED (period ≥ 3 past eight) and RADICAL (an odd count from an
 * unpaired electron) satisfy the rules; SHORT and OVER do not.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class OctetStatus extends EnumerationValue {
  public static readonly DUET = new OctetStatus(true);
  public static readonly OCTET = new OctetStatus(true);
  public static readonly INCOMPLETE_ALLOWED = new OctetStatus(true);
  public static readonly EXPANDED = new OctetStatus(true);
  public static readonly RADICAL = new OctetStatus(true);
  public static readonly SHORT = new OctetStatus(false);
  public static readonly OVER = new OctetStatus(false);

  public static readonly enumeration = new Enumeration(OctetStatus);

  /** Whether this count satisfies the electron-counting rules. */
  public readonly satisfied: boolean;

  public constructor(satisfied: boolean) {
    super();
    this.satisfied = satisfied;
  }
}
