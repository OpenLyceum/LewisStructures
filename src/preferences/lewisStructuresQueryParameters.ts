/**
 * lewisStructuresQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * Each one sets the initial value of a preference in LewisStructuresPreferencesModel.
 *
 * Usage: append e.g. `?octetPolicy=octetFirst&allFormalCharges` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import LewisStructuresNamespace from "../LewisStructuresNamespace.js";

const lewisStructuresQueryParameters = QueryStringMachine.getAll({
  /**
   * Which structure counts as best when an octet could expand: acceptBoth (default), octetFirst
   * or minimizeFormalCharge. See OctetPolicy.ts.
   */
  octetPolicy: {
    type: "string",
    defaultValue: "acceptBoth",
    validValues: ["acceptBoth", "octetFirst", "minimizeFormalCharge"],
    public: true,
  },

  /** Show formal-charge badges on every atom, including zeros. */
  allFormalCharges: {
    type: "flag",
    public: true,
  },

  /** Hide the coloured octet rings around atoms. */
  hideOctetRings: {
    type: "flag",
    public: true,
  },
});

LewisStructuresNamespace.register("lewisStructuresQueryParameters", lewisStructuresQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default lewisStructuresQueryParameters;
