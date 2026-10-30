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

  // ── 3D shape preview ────────────────────────────────────────────────────────────

  /** Bond sticks in the 3D shape preview. */
  shapeBondColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "shapeBond", {
    default: "#b0b8c8",
    projector: "#777777",
  }),

  /** Background of the 3D shape preview. */
  shapeBackgroundColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "shapeBackground", {
    default: "#0b1122",
    projector: "#f4f6fa",
  }),

  /** Ball colour of H in the 3D shape preview (CPK/Jmol). */
  elementHColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementH", {
    default: "#ffffff",
    projector: "#dddddd",
  }),

  /** Ball colour of Be in the 3D shape preview (CPK/Jmol). */
  elementBeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementBe", {
    default: "#c2ff00",
    projector: "#7fa800",
  }),

  /** Ball colour of B in the 3D shape preview (CPK/Jmol). */
  elementBColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementB", {
    default: "#ffb5b5",
    projector: "#e08080",
  }),

  /** Ball colour of C in the 3D shape preview (CPK/Jmol). */
  elementCColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementC", {
    default: "#909090",
    projector: "#606060",
  }),

  /** Ball colour of N in the 3D shape preview (CPK/Jmol). */
  elementNColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementN", {
    default: "#3050f8",
    projector: "#3050f8",
  }),

  /** Ball colour of O in the 3D shape preview (CPK/Jmol). */
  elementOColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementO", {
    default: "#ff0d0d",
    projector: "#e00000",
  }),

  /** Ball colour of F in the 3D shape preview (CPK/Jmol). */
  elementFColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementF", {
    default: "#90e050",
    projector: "#5aa82a",
  }),

  /** Ball colour of Al in the 3D shape preview (CPK/Jmol). */
  elementAlColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementAl", {
    default: "#bfa6a6",
    projector: "#9a8080",
  }),

  /** Ball colour of Si in the 3D shape preview (CPK/Jmol). */
  elementSiColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementSi", {
    default: "#f0c8a0",
    projector: "#c8a070",
  }),

  /** Ball colour of P in the 3D shape preview (CPK/Jmol). */
  elementPColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementP", {
    default: "#ff8000",
    projector: "#e07000",
  }),

  /** Ball colour of S in the 3D shape preview (CPK/Jmol). */
  elementSColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementS", {
    default: "#ffff30",
    projector: "#d4c400",
  }),

  /** Ball colour of Cl in the 3D shape preview (CPK/Jmol). */
  elementClColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementCl", {
    default: "#1ff01f",
    projector: "#18b018",
  }),

  /** Ball colour of Se in the 3D shape preview (CPK/Jmol). */
  elementSeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementSe", {
    default: "#ffa100",
    projector: "#d08000",
  }),

  /** Ball colour of Br in the 3D shape preview (CPK/Jmol). */
  elementBrColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementBr", {
    default: "#a62929",
    projector: "#a62929",
  }),

  /** Ball colour of I in the 3D shape preview (CPK/Jmol). */
  elementIColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementI", {
    default: "#940094",
    projector: "#940094",
  }),

  /** Ball colour of Xe in the 3D shape preview (CPK/Jmol). */
  elementXeColorProperty: new ProfileColorProperty(LewisStructuresNamespace, "elementXe", {
    default: "#429eb0",
    projector: "#2f7f8f",
  }),
};

export default LewisStructuresColors;
