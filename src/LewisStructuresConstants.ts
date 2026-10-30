/**
 * LewisStructuresConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Model positions are in bond lengths (one bond = 1); electron counts are
 *    plain integers.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in LewisStructuresColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 */

import LewisStructuresNamespace from "./LewisStructuresNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Width of the right-hand column of panels. */
export const SIDE_PANEL_WIDTH = 290;

// ── Drawing board (model units are bond lengths) ──────────────────────────────

/** Size of the drawing board, px. */
export const BOARD_WIDTH = 560;
export const BOARD_HEIGHT = 420;

/** Screen pixels per bond length on the drawing board. */
export const PIXELS_PER_BOND = 72;

/** Radius of the disc behind an element symbol, px. Bond lines stop at it. */
export const ATOM_RADIUS = 16;

/** Outer radius of the bonding ring around an atom, px (drag from it to make a bond). */
export const BOND_HANDLE_RADIUS = 27;

/** Distance from an atom's centre to its lone-pair dots, px. */
export const ELECTRON_DISTANCE = 23;

/** Gap between the two dots of a lone pair, px. */
export const PAIR_GAP = 8;

/** Radius of one electron dot, px. */
export const ELECTRON_DOT_RADIUS = 3;

/** Spacing between the lines of a double or triple bond, px. */
export const BOND_LINE_SPACING = 5;

/** Line width of bonds, px. */
export const BOND_LINE_WIDTH = 2;

/** Radius of the formal-charge badge, px. */
export const CHARGE_BADGE_RADIUS = 9;

/** Radius of the octet ring, px. */
export const OCTET_RING_RADIUS = 31;

/** A pointer that moves less than this between press and release is a click, not a drag, px. */
export const CLICK_TOLERANCE = 4;

/** Atoms closer than this (bond lengths) are treated as overlapping when placing a new atom. */
export const MIN_ATOM_SEPARATION = 0.8;

/** Charges offered in free build. */
export const MIN_CHARGE = -3;
export const MAX_CHARGE = 3;

LewisStructuresNamespace.register("LewisStructuresConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PIXELS_PER_BOND,
});
