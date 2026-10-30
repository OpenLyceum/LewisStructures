/**
 * LewisStructuresPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in lewisStructuresQueryParameters. One instance
 * is created in main.ts and shared by every screen.
 */

import { BooleanProperty, EnumerationProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import { OctetPolicy } from "../common/model/OctetPolicy.js";
import LewisStructuresNamespace from "../LewisStructuresNamespace.js";
import lewisStructuresQueryParameters from "./lewisStructuresQueryParameters.js";

const POLICY_BY_NAME: Record<string, OctetPolicy> = {
  acceptBoth: OctetPolicy.ACCEPT_BOTH,
  octetFirst: OctetPolicy.OCTET_FIRST,
  minimizeFormalCharge: OctetPolicy.MINIMIZE_FORMAL_CHARGE,
};

export class LewisStructuresPreferencesModel {
  /** Which structure counts as best when an octet could expand. */
  public readonly octetPolicyProperty: EnumerationProperty<OctetPolicy>;
  /** Show formal-charge badges on every atom, including zeros. */
  public readonly showAllFormalChargesProperty: BooleanProperty;
  /** Show the coloured octet rings around atoms. */
  public readonly showOctetRingsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.octetPolicyProperty = new EnumerationProperty(
      POLICY_BY_NAME[lewisStructuresQueryParameters.octetPolicy ?? ""] ?? OctetPolicy.ACCEPT_BOTH,
      tandem ? { tandem: tandem.createTandem("octetPolicyProperty") } : undefined,
    );
    this.showAllFormalChargesProperty = new BooleanProperty(
      lewisStructuresQueryParameters.allFormalCharges,
      tandem ? { tandem: tandem.createTandem("showAllFormalChargesProperty") } : undefined,
    );
    this.showOctetRingsProperty = new BooleanProperty(
      !lewisStructuresQueryParameters.hideOctetRings,
      tandem ? { tandem: tandem.createTandem("showOctetRingsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.octetPolicyProperty.reset();
    this.showAllFormalChargesProperty.reset();
    this.showOctetRingsProperty.reset();
  }
}

LewisStructuresNamespace.register("LewisStructuresPreferencesModel", LewisStructuresPreferencesModel);
