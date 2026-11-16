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

/** Height of the Challenge screen's board, px (shorter, under the status bar). */
export const CHALLENGE_BOARD_HEIGHT = 370;

/** Width of the Resonance screen's board, px (narrower, to leave room for the gallery). */
export const RESONANCE_BOARD_WIDTH = 520;

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

/** Settings for build/view/BuildScreenView.ts. */
export const BUILD_SCREEN_VIEW_SETTINGS = {
  SHOW_SHAPE_CHECKBOX_MAX_WIDTH: 110, // px

  /** Top (px). */
  TOP: 12,
  /** Board left (px). */
  BOARD_LEFT: 118,
  /** Board top (px). */
  BOARD_TOP: 64,
  /** Gap (px). */
  GAP: 10,
  /** Palette panel x margin (px). */
  PALETTE_PANEL_X_MARGIN: 6,
  /** Palette panel y margin (px). */
  PALETTE_PANEL_Y_MARGIN: 6,
  /** Toolbar spacing (px). */
  TOOLBAR_SPACING: 8,
  /** Check panel spacing (px). */
  CHECK_PANEL_SPACING: 8,
} as const;

/** Settings for challenge/model/ChallengeModel.ts. */
export const CHALLENGE_MODEL_SETTINGS = {
  /** Problems per round (count). */
  PROBLEMS_PER_ROUND: 5,
  /** Points per problem (count). */
  POINTS_PER_PROBLEM: 4,
  /** Number of stars (count). */
  NUMBER_OF_STARS: 3,
} as const;

/** Settings for challenge/view/ChallengeScreenView.ts. */
export const CHALLENGE_SCREEN_VIEW_SETTINGS = {
  CAPTIONS_MAX_WIDTH_OFFSET: 30, // px
  CAPTIONS_TOP_OFFSET: 10, // px
  TASK_MAX_WIDTH_OFFSET: 90, // px

  CAPTIONS_FONT_SIZE_SEGMENT_2: 12, // px
  LEVEL_SELECTION_Y_OFFSET: -20, // px
  STATUS_BAR_FONT_SIZE_SEGMENT_2: 15, // px
  SHOW_SHAPE_CHECKBOX_MAX_WIDTH: 110, // px
  HINTS_PANEL_ITEM_1_SPACING: 10, // px

  /** Status bar height (px). */
  STATUS_BAR_HEIGHT: 50,
  /** Board left (px). */
  BOARD_LEFT: 118,
  /** Gap (px). */
  GAP: 10,
  /** Level button size (px). */
  LEVEL_BUTTON_SIZE: 150,
  /** Largest width or height of the drawing on a level button, px. */
  LEVEL_ICON_SIZE: 100,
  /** Level buttons spacing (px). */
  LEVEL_BUTTONS_SPACING: 30,
  /** Captions spacing (px). */
  CAPTIONS_SPACING: 2,
  /** Captions font size (px). */
  CAPTIONS_FONT_SIZE: 15,
  /** Level selection spacing (px). */
  LEVEL_SELECTION_SPACING: 34,
  /** Level selection font size (px). */
  LEVEL_SELECTION_FONT_SIZE: 28,
  /** Level selection max width (px). */
  LEVEL_SELECTION_MAX_WIDTH: 500,
  /** Status bar font size (px). */
  STATUS_BAR_FONT_SIZE: 18,
  /** Task font size (px). */
  TASK_FONT_SIZE: 20,
  /** Palette panel x margin (px). */
  PALETTE_PANEL_X_MARGIN: 6,
  /** Palette panel y margin (px). */
  PALETTE_PANEL_Y_MARGIN: 6,
  /** Toolbar spacing (px). */
  TOOLBAR_SPACING: 8,
  /** Hints panel spacing (px). */
  HINTS_PANEL_SPACING: 6,
  /** Hints panel max width (px). */
  HINTS_PANEL_MAX_WIDTH: 120,
  /** Check panel spacing (px). */
  CHECK_PANEL_SPACING: 8,
  /** Level completed node font size (px). */
  LEVEL_COMPLETED_NODE_FONT_SIZE: 20,
} as const;

/** Settings for common/LewisStructuresControlOptions.ts. */
export const LEWIS_STRUCTURES_CONTROL_OPTIONS_SETTINGS = {
  /** Slider thumb size width (px). */
  SLIDER_THUMB_SIZE_WIDTH: 12,
  /** Slider thumb size height (px). */
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  /** Standalone slider track size width (px). */
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  /** Standalone slider track size height (px). */
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Number control slider track size width (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  /** Number control slider track size height (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Checkbox box width (px). */
  CHECKBOX_BOX_WIDTH: 16,
  /** Lewis structures number control options scale (dimensionless). */
  LEWIS_STRUCTURES_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  /** Lewis structures number control options slider padding (px). */
  LEWIS_STRUCTURES_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  /** Lewis structures number control options arrow button spacing (px). */
  LEWIS_STRUCTURES_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  /** Lewis structures number control options vertical spacing (px). */
  LEWIS_STRUCTURES_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  /** Lewis structures checkbox options spacing (px). */
  LEWIS_STRUCTURES_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/LewisStructuresPanel.ts. */
export const LEWIS_STRUCTURES_PANEL_SETTINGS = {
  /** Options x margin (px). */
  OPTIONS_X_MARGIN: 12,
  /** Options y margin (px). */
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/LewisStructuresScreenIcons.ts. */
export const LEWIS_STRUCTURES_SCREEN_ICONS_SETTINGS = {
  /** Margin left around the drawing inside the icon, px. */
  ICON_MARGIN: 30,
  /** Question font size (px). */
  QUESTION_FONT_SIZE: 220,
} as const;

/** Settings for common/model/LewisStructure.ts. */
export const LEWIS_STRUCTURE_SETTINGS = {
  /** Undo steps kept; older ones are dropped. */
  MAX_HISTORY: 100,
} as const;

/** Settings for common/model/StructureData.ts. */
export const STRUCTURE_DATA_SETTINGS = {
  /** Max bond order (count). */
  MAX_BOND_ORDER: 3,
  /** Max lone pairs (count). */
  MAX_LONE_PAIRS: 4,
} as const;

/** Settings for common/model/generateStructures.ts. */
export const GENERATE_STRUCTURES_SETTINGS = {
  /** Max visits (count). */
  MAX_VISITS: 200_000,
  /** Epsilon (dimensionless). */
  EPSILON: 1e-9,
  /** How far past the best Σ|FC| a structure may be and still be listed as a minor contributor. */
  MINOR_WINDOW: 2,
} as const;

/** Settings for common/model/layoutStructure.ts. */
export const LAYOUT_STRUCTURE_SETTINGS = {
  /** Minimum improvement in placement score (bond-length units). */
  PLACEMENT_SCORE_TOLERANCE: 1e-3,
  /** Smallest usable inter-atom distance (bond-length units). */
  DISTANCE_EPSILON: 1e-6,
  /** Initial separation of coincident atoms (bond-length units). */
  COINCIDENT_ATOM_SEPARATION: 1e-3,
  /** Maximum per-iteration displacement before step scaling (bond-length units). */
  MAX_RELAXATION_DISPLACEMENT: 0.2,
  /** Spacing of fallback placement rings (bond-length units). */
  PLACEMENT_RING_SPACING: 0.9,
  /** Candidate count per ring number (count). */
  PLACEMENTS_PER_RING: 6,
  /** Iterations (count). */
  ITERATIONS: 300,
  /** Spring (dimensionless). */
  SPRING: 0.2,
  /** Repulsion (dimensionless). */
  REPULSION: 0.08,
} as const;

/** Settings for common/model/resonance.ts. */
export const RESONANCE_SETTINGS = {
  /** Most forms shown in the gallery. */
  MAX_GALLERY_FORMS: 9,
} as const;

/** Settings for common/view/AtomNode.ts. */
export const ATOM_NODE_SETTINGS = {
  PARTNER_RING_LINE_DASH_DASH: 3, // px

  /** Symbol font size (px). */
  SYMBOL_FONT_SIZE: 21,
  /** Badge font size (px). */
  BADGE_FONT_SIZE: 11,
  /** How far out the formal-charge badge sits, px. */
  BADGE_DISTANCE: 26,
  /** Octet ring line width (px). */
  OCTET_RING_LINE_WIDTH: 1.5,
  /** Octet ring opacity (dimensionless). */
  OCTET_RING_OPACITY: 0.75,
  /** Selection ring line width (px). */
  SELECTION_RING_LINE_WIDTH: 2,
  /** Partner ring line width (px). */
  PARTNER_RING_LINE_WIDTH: 2,
} as const;

/** Settings for common/view/BoardKeyboardController.ts. */
export const BOARD_KEYBOARD_CONTROLLER_SETTINGS = {
  /** How far one arrow press moves a grabbed atom, bond lengths. */
  MOVE_STEP: 0.25,
} as const;

/** Settings for common/view/BondNode.ts. */
export const BOND_NODE_SETTINGS = {
  SELECTION_PATH_LINE_WIDTH_OFFSET: 4, // px

  /** Width of the clickable strip around a bond, px. */
  HIT_WIDTH: 14,
  /** Extra gap between a bond line and the disc it meets, px. */
  END_GAP: 3,
  /** Selection path opacity (dimensionless). */
  SELECTION_PATH_OPACITY: 0.35,
} as const;

/** Settings for common/view/ChecklistNode.ts. */
export const CHECKLIST_NODE_SETTINGS = {
  LABEL_TEXT_MAX_WIDTH_OFFSET: 20, // px

  /** Item spacing (px). */
  ITEM_SPACING: 6,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 4,
} as const;

/** Settings for common/view/ControlFactory.ts. */
export const CONTROL_FACTORY_SETTINGS = {
  ITEMS_MAX_WIDTH_OFFSET: 40, // px
  RADIO_GROUP_SPACING: 4, // px

  /** Control font size (px). */
  CONTROL_FONT_SIZE: 13,
  /** Small font size (px). */
  SMALL_FONT_SIZE: 12,
  /** Heading font size (px). */
  HEADING_FONT_SIZE: 14,
  /** Combo box x margin (px). */
  COMBO_BOX_X_MARGIN: 8,
  /** Combo box y margin (px). */
  COMBO_BOX_Y_MARGIN: 3,
  /** Combo box corner radius (px). */
  COMBO_BOX_CORNER_RADIUS: 4,
  /** Push button x margin (px). */
  PUSH_BUTTON_X_MARGIN: 8,
  /** Push button y margin (px). */
  PUSH_BUTTON_Y_MARGIN: 4,
  /** Radio group radius (px). */
  RADIO_GROUP_RADIUS: 6,
} as const;

/** Settings for common/view/CurvedArrowsNode.ts. */
export const CURVED_ARROWS_NODE_SETTINGS = {
  /** Head length (px). */
  HEAD_LENGTH: 9,
  /** Head width (px). */
  HEAD_WIDTH: 8,
  /** Bow (px). */
  BOW: 0.45,
  /** Constructor line width (px). */
  CONSTRUCTOR_LINE_WIDTH: 2.5,
} as const;

/** Settings for common/view/ElectronBudgetNode.ts. */
export const ELECTRON_BUDGET_NODE_SETTINGS = {
  /** Pairs per row in the tray, and the most rows drawn. */
  TRAY_COLUMNS: 12,
  /** Tray max rows (px). */
  TRAY_MAX_ROWS: 3,
  /** Tray pitch (px). */
  TRAY_PITCH: 14,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 4,
} as const;

/** Settings for common/view/ElementPaletteNode.ts. */
export const ELEMENT_PALETTE_NODE_SETTINGS = {
  SYMBOL_MAX_WIDTH_OFFSET: 6, // px

  /** Tile size (px). */
  TILE_SIZE: 38,
  /** Tile font size (px). */
  TILE_FONT_SIZE: 17,
  /** Background corner x (px). */
  BACKGROUND_CORNER_X: 5,
  /** Background corner y (px). */
  BACKGROUND_CORNER_Y: 5,
  /** Constructor x spacing (px). */
  CONSTRUCTOR_X_SPACING: 6,
  /** Constructor y spacing (px). */
  CONSTRUCTOR_Y_SPACING: 6,
} as const;

/** Settings for common/view/LewisCanvasNode.ts. */
export const LEWIS_CANVAS_NODE_SETTINGS = {
  HINT_LINE_WRAP_FACTOR: 0.7, // dimensionless
  CONSTRUCTOR_LINE_DASH_DASH: 5, // px

  /** How close (bond lengths) a drop must be to an atom's centre to bond to it. */
  DROP_RADIUS: 0.45,
  /** Hint font size (px). */
  HINT_FONT_SIZE: 14,
  /** Rubber band line width (px). */
  RUBBER_BAND_LINE_WIDTH: 2,
} as const;

/** Settings for common/view/SelectionBarNode.ts. */
export const SELECTION_BAR_NODE_SETTINGS = {
  ATOM_SUMMARY_MAX_WIDTH: 230, // px
  UNPAIRED_CHECKBOX_MAX_WIDTH: 140, // px
  ATOM_BAR_ITEM_2_SPACING: 5, // px
  LONE_PAIRS_LABEL_MAX_WIDTH: 90, // px
  BOND_TITLE_MAX_WIDTH: 120, // px
  ORDER_GROUP_MAX_WIDTH: 90, // px

  /** Small button x margin (px). */
  SMALL_BUTTON_X_MARGIN: 7,
  /** Small button y margin (px). */
  SMALL_BUTTON_Y_MARGIN: 2,
  /** Atom bar spacing (px). */
  ATOM_BAR_SPACING: 10,
  /** Bond bar spacing (px). */
  BOND_BAR_SPACING: 14,
} as const;

/** Settings for common/view/ShapePreviewNode.ts. */
export const SHAPE_PREVIEW_NODE_SETTINGS = {
  CONSTRUCTOR_MIN_WIDTH_OFFSET: 24, // px

  /** View size (px). */
  VIEW_SIZE: 150,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 6,
  /** Constructor x margin (px). */
  CONSTRUCTOR_X_MARGIN: 12,
  /** Constructor y margin (px). */
  CONSTRUCTOR_Y_MARGIN: 10,
} as const;

/** Settings for common/view/ShapeViewNode.ts. */
export const SHAPE_VIEW_NODE_SETTINGS = {
  /** Rotation per pixel dragged, radians. */
  DRAG_RATE: 0.012,
  /** Ball radius = BALL_BASE + BALL_PER_PM × covalent radius, as a fraction of the bond length. */
  BALL_BASE: 0.12,
  /** Ball per pm (px). */
  BALL_PER_PM: 0.0013,
  /** Lobe distance (px). */
  LOBE_DISTANCE: 0.55,
  /** Lobe length (px). */
  LOBE_LENGTH: 0.5,
  /** Lobe width (px). */
  LOBE_WIDTH: 0.32,
  /** Render line width (px). */
  RENDER_LINE_WIDTH: 6,
  /** Render opacity (dimensionless). */
  RENDER_OPACITY: 0.6,
} as const;

/** Settings for common/view/SpeciesChooserNode.ts. */
export const SPECIES_CHOOSER_NODE_SETTINGS = {
  CHARGE_LABEL_MAX_WIDTH: 80, // px

  /** Combo width (px). */
  COMBO_WIDTH: 230,
  /** Formula font size (px). */
  FORMULA_FONT_SIZE: 26,
  /** Charge spinner spacing (px). */
  CHARGE_SPINNER_SPACING: 6,
  /** Formula max width (px). */
  FORMULA_MAX_WIDTH: 260,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 14,
} as const;

/** Settings for common/view/StructureNode.ts. */
export const STRUCTURE_NODE_SETTINGS = {
  CONSTRUCTOR_LEFT_FACTOR: 0.55, // dimensionless
  CONSTRUCTOR_TOP_FACTOR: 0.25, // dimensionless
  HYBRID_BOND_LINE_DASH_DASH: 4, // px

  /** Label font size (px). */
  LABEL_FONT_SIZE: 12,
  /** Index font size (px). */
  INDEX_FONT_SIZE: 10,
  /** End gap (px). */
  END_GAP: 3,
} as const;

/** Settings for preferences/LewisStructuresPreferencesNode.ts. */
export const LEWIS_STRUCTURES_PREFERENCES_NODE_SETTINGS = {
  ITEM_2_SPACING: 6, // px

  /** Font size (px). */
  FONT_SIZE: 14,
  /** Note width (px). */
  NOTE_WIDTH: 520,
  /** Header font size (px). */
  HEADER_FONT_SIZE: 18,
  /** Policy title font size (px). */
  POLICY_TITLE_FONT_SIZE: 14,
  /** Policy group spacing (px). */
  POLICY_GROUP_SPACING: 6,
  /** Policy group radius (px). */
  POLICY_GROUP_RADIUS: 7,
  /** Policy note font size (px). */
  POLICY_NOTE_FONT_SIZE: 12,
  /** Checkbox spacing (px). */
  CHECKBOX_SPACING: 8,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for preferences/lewisStructuresQueryParameters.ts. */
export const LEWIS_STRUCTURES_QUERY_PARAMETERS_SETTINGS = {
  /** Challenge level count (count). */
  CHALLENGE_LEVEL_COUNT: 3,
} as const;

/** Settings for resonance/view/FormCardNode.ts. */
export const FORM_CARD_NODE_SETTINGS = {
  ROOM_WIDTH_OFFSET: 10, // px
  ROOM_HEIGHT_OFFSET: 6, // px
  TITLE_MAX_WIDTH_OFFSET: 8, // px
  TITLE_BOTTOM_OFFSET: 16, // px
  RANK_MAX_WIDTH_OFFSET: 8, // px
  RANK_BOTTOM_OFFSET: 4, // px
  SET_SELECTED_LINE_WIDTH: 2.5, // px

  /** Number font size (px). */
  NUMBER_FONT_SIZE: 11,
  /** Rank font size (px). */
  RANK_FONT_SIZE: 10,
  /** Label height (px). */
  LABEL_HEIGHT: 30,
  /** Frame line width (px). */
  FRAME_LINE_WIDTH: 1.5,
  /** Title left (px). */
  TITLE_LEFT: 5,
  /** Rank left (px). */
  RANK_LEFT: 5,
} as const;

/** Settings for resonance/view/ResonanceScreenView.ts. */
export const RESONANCE_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_MAX_WIDTH_OFFSET: 40, // px

  SPECIES_COMBO_BOX_MAX_WIDTH: 300, // px
  MODE_RADIO_GROUP_MAX_WIDTH: 110, // px
  SHOW_ARROWS_CHECKBOX_MAX_WIDTH: 150, // px

  /** Top (px). */
  TOP: 12,
  /** Board top (px). */
  BOARD_TOP: 64,
  /** Gap (px). */
  GAP: 10,
  /** Right width (px). */
  RIGHT_WIDTH: 444,
  /** Card columns (px). */
  CARD_COLUMNS: 3,
  /** Card height (px). */
  CARD_HEIGHT: 118,
  /** Largest magnification of a form in the large view (arrows need room to be read). */
  LARGE_SCALE: 1.5,
  /** Card gap (px). */
  CARD_GAP: 6,
  /** Formula font size (px). */
  FORMULA_FONT_SIZE: 26,
  /** Header spacing (px). */
  HEADER_SPACING: 14,
  /** Form controls spacing (px). */
  FORM_CONTROLS_SPACING: 8,
  /** Draw controls spacing (px). */
  DRAW_CONTROLS_SPACING: 8,
  /** Controls spacing (px). */
  CONTROLS_SPACING: 18,
  /** Gallery panel spacing (px). */
  GALLERY_PANEL_SPACING: 6,
  /** Explanation panel spacing (px). */
  EXPLANATION_PANEL_SPACING: 6,
} as const;

/** Settings for common/model/DrawingModel.ts; units are documented per value. */
export const DRAWING_MODEL_SETTINGS = {
  /** Board inset when placing an added atom (bond-length units). */
  ADD_ATOM_INSET: 0.4,
  /** Board inset for tidied atom positions (bond-length units). */
  TIDY_INSET: 0.3,
  /** Board inset when dragging an atom (bond-length units). */
  DRAG_INSET: 0.25,
} as const;

LewisStructuresNamespace.register("LewisStructuresConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PIXELS_PER_BOND,
});
