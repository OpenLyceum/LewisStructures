# Implementation notes

Architecture and the decisions behind it. The chemistry is in [`model.md`](model.md).

## Layers

| Layer | Files | Notes |
|---|---|---|
| Data | `ElementData.ts`, `SpeciesCatalog.ts` | Plain data, no Scenery imports |
| Pure model | `StructureData.ts`, `analyzeStructure.ts`, `generateStructures.ts`, `moleculeGraph.ts`, `checkStructure.ts`, `resonance.ts`, `vsepr.ts`, `layoutStructure.ts`, `electronBudget.ts` | Functions over the immutable `StructureData`; everything the tests exercise |
| Editable model | `LewisStructure.ts`, `DrawingModel.ts` | Atoms with a `Vector2Property` position, bonds, charge, undo/redo; selection and higher-level edits |
| Screen models | `build/`, `resonance/`, `challenge/` `model/` | Each owns a `DrawingModel` and the screen's state |
| Views | `common/view/`, screen `view/` folders | Nodes never hold chemistry state |

## The drawing board

- `LewisCanvasNode` keeps one `AtomNode` per atom and one `BondNode` per bond, synchronised from
  `LewisStructure`'s emitters (`atomAddedEmitter`, `atomRemovedEmitter`, `changedEmitter`).
  Positions are watched per atom, so a drag only redraws that atom, its neighbours and its bonds.
- Pointer input: the disc moves (or selects on a click under `CLICK_TOLERANCE`), the bonding ring
  around it drags out a bond, a bond click steps its order. The bonding ring is always pickable
  with a transparent fill, so hovering can reveal it.
- `ElementPaletteNode` creates an atom only when a drag reaches the board; a click (or Enter on
  the focused tile) adds the atom bonded to the selected one and keeps the anchor selected, so
  C then H×4 builds CH₄. A drag that ends off the board is undone rather than deleted, so it leaves
  no undo step.
- Undo snapshots keep atom ids, so undo and redo reuse the same `LewisAtom` objects and the nodes
  (and keyboard focus) survive.

## Keyboard and screen reader

- The board is one focus stop (`BoardKeyboardController`); the selected atom is the cursor.
  Arrows move to the nearest atom in a direction, weighting sideways offset. Bond mode shows the
  chosen partner with a dashed ring and a dashed line.
- Keys are defined once in `LewisStructuresHotkeyData` and reused by the listener and the help
  dialog. The help dialog's icon factory only has some letters (no U) and no Ctrl key, so the
  unpaired electron is **D** and the Undo/Redo rows are drawn by hand in
  `BoardKeyboardHelpSection`.
- Every edit is announced with the atom's electrons, formal charge and status, the electrons left,
  and "Every rule is met" when the drawing becomes complete. Sentences are built in
  `boardDescriptions.ts` from localised patterns; plurals are avoided with "label: count"
  wording.
- `tests/browser/keyboard.spec.ts` builds water and nitrate, draws and checks a resonance form,
  and plays a Challenge problem with the keyboard only, reading the aria-live text.

## Static drawings and the 3D view

- `StructureNode` draws a `StructureData` with the same `AtomNode`/`BondNode` as the board, for the
  gallery, the large resonance form, the hybrid and the level icons.
- `CurvedArrowsNode` places arrow ends on the drawn lone pairs (`StructureNode.lonePairPoint`
  reuses the board's `electronAngles` placement) and bows each arrow away from the molecule's
  centre.
- The VSEPR preview (`ShapeViewNode`) is a small Scenery ball-and-stick model, not the
  SpectroscopyLab/MolScope canvas renderer the plan first named: one centre has at most seven
  atoms and six lobes, so rebuilding a few nodes and sorting them by depth on each turn is enough,
  and it avoids bringing in about a thousand lines of renderer and molecule model.

## Layout decisions

- The species chooser is a category menu plus a species menu: one combo box of 52 items would not
  fit on screen.
- On Build the shape panel takes the checklist's place once the structure is complete; on the
  Challenge it takes the hints' place once a problem is solved. An inset on the board covered the
  drawing.
- In species mode the electron count comes from the formula, so it is there before any atom is
  drawn; the checklist compares the atoms with the formula first so the two never disagree.
