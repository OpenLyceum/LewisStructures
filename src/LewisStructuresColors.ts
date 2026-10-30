/**
 * LewisStructuresColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import LewisStructuresColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import LewisStructuresColors from "../../LewisStructuresColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: LewisStructuresColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the LewisStructuresColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import LewisStructuresNamespace from "./LewisStructuresNamespace.js";

const LewisStructuresColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Text and feedback ───────────────────────────────────────────────────────────

  /** Secondary text: captions, hints, counts. */
  mutedTextColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "mutedText", {
    default: "#9aa4b8",
    projector: "#555555",
  }),

  /** A satisfied check, a correct answer, a complete octet. */
  goodColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "good", {
    default: "#81c784",
    projector: "#1b7d32",
  }),

  /** Something still to do: too few electrons, an unfinished octet. */
  warningColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "warning", {
    default: "#ffb74d",
    projector: "#b26a00",
  }),

  /** A broken rule: too many electrons, an over-full atom, a wrong answer. */
  poorColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "poor", {
    default: "#ff8a80",
    projector: "#c62828",
  }),

  // ── Drawing board ───────────────────────────────────────────────────────────────

  /** Fill of the drawing board. */
  boardColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "board", {
    default: "#10182e",
    projector: "#ffffff",
  }),

  /** Border of the drawing board. */
  boardBorderColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "boardBorder", {
    default: "#2c3a5e",
    projector: "#999999",
  }),

  /** Element symbols and bond lines. */
  atomSymbolColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "atomSymbol", {
    default: "#f0f0f0",
    projector: "#111111",
  }),

  /** The disc behind an element symbol (what you grab). */
  atomDiscColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "atomDisc", {
    default: "#1d2848",
    projector: "#f2f2f2",
  }),

  /** Lone pairs and unpaired electrons, set apart from bond lines. */
  electronColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "electron", {
    default: "#ffd54f",
    projector: "#1565c0",
  }),

  /** The bonding ring around an atom, shown on hover, and the rubber-band bond while dragging. */
  bondHandleColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "bondHandle", {
    default: "rgba(79,195,247,0.35)",
    projector: "rgba(21,101,192,0.25)",
  }),

  /** Badge of a positive formal charge. */
  positiveChargeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "positiveCharge", {
    default: "#ef9a9a",
    projector: "#c62828",
  }),

  /** Badge of a negative formal charge. */
  negativeChargeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "negativeCharge", {
    default: "#90caf9",
    projector: "#1565c0",
  }),

  /** Badge of a zero formal charge (when zero charges are shown). */
  zeroChargeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "zeroCharge", {
    default: "#9aa4b8",
    projector: "#777777",
  }),

  /** Text inside a formal-charge badge. */
  chargeTextColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "chargeText", {
    default: "#10182e",
    projector: "#ffffff",
  }),
};

export default LewisStructuresColors;
