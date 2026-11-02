# AGENTS.md — Lewis Structures

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Lewis structures for **introductory (General) chemistry**: valence-electron counting, bonds, lone
pairs, formal charge, octet exceptions, resonance and VSEPR shape. It follows PeriodicTrends in the
Gen Chem sequence. Three screens:

| Screen | Folder | Content |
|---|---|---|
| Build | `src/build/` | Drawing board + element palette for a catalog species or free build; electron count, checklist, octet rings, formal charges; Check / Skeleton / Show answer; VSEPR shape panel |
| Resonance | `src/resonance/` | Ranked gallery of forms; one form with curved arrows to the next, the hybrid, or a skeleton to complete and identify |
| Challenge | `src/challenge/` | vegas levels 1–3, five problems a round, a five-step hint ladder costing a point each |

Chemistry, ranking rules and sources: [`doc/model.md`](doc/model.md). Architecture and design
decisions: [`doc/implementation-notes.md`](doc/implementation-notes.md).

### Things to know first

- **Skeletons come from the catalog; answers are generated.** `SpeciesCatalog.ts` stores atoms,
  connectivity and 2D positions only. `generateStructures.ts` enumerates every valid structure and
  ranks it; `tests/common/generateStructures.test.ts` checks the results against textbook
  structures. Never hand-enter an answer: fix the ranking or the skeleton instead.
- **OctetPolicy is the user's choice.** Expanded-octet ions (SO₄²⁻, PO₄³⁻, ClO₄⁻, SO₂, SO₃, ClO₂)
  have different best structures under ACCEPT_BOTH (default), OCTET_FIRST and
  MINIMIZE_FORMAL_CHARGE. Every policy agrees where expansion is unavoidable.
- **Ranking order is Σ|FC|, ΣFC², then ΣFC·χ.** ΣFC² is what makes azide N=N=N; the
  electronegativity term is what puts SCN⁻'s charge on N. Odd electrons go on the least
  electronegative non-H atom.
- **The board is one focus stop.** Keys live in `LewisStructuresHotkeyData`; the unpaired electron
  is **D** (the help dialog has no U icon) and Undo/Redo rows are drawn by hand (no Ctrl icon).
- **Atoms are compared by graph isomorphism**, never by index or position (`moleculeGraph.ts`).
- **Agent shells may default to Node 24**: run `source ~/.nvm/nvm.sh && nvm use 26` before npm or
  git commit (the pre-commit hook runs npm).

## Key files

| File | Purpose |
|---|---|
| `src/LewisStructuresConstants.ts` | Board sizes, pixels per bond, atom and electron drawing sizes, charge range |
| `src/LewisStructuresColors.ts` | All `ProfileColorProperty` instances, including octet-ring states, charge badges and CPK colours for the 3D view |
| `src/common/model/ElementData.ts` | Valence, period, group, electronegativity, radius, octet exceptions for 16 elements |
| `src/common/model/SpeciesCatalog.ts` | 52 species: formula, charge, category, difficulty, central atom, skeleton |
| `src/common/model/analyzeStructure.ts` | Electron budget, formal charges, `OctetStatus`, completeness |
| `src/common/model/generateStructures.ts` | Every valid structure on a skeleton, ranked, grouped by policy |
| `src/common/model/checkStructure.ts` | Grades a drawing: atoms, completeness, skeleton, rank |
| `src/common/model/moleculeGraph.ts` | Isomorphism (`sameSkeleton`, `sameStructure`) |
| `src/common/model/LewisStructure.ts` | Editable drawing with undo/redo that keeps atom ids |
| `src/common/model/DrawingModel.ts` | Selection, add-near, bond-or-cycle, tidy, show data |
| `src/common/model/resonance.ts` | Curved arrows between forms, hybrid, gallery |
| `src/common/model/vsepr.ts` | AXₙEₘ, geometries, ideal directions |
| `src/common/view/LewisCanvasNode.ts` | The board: atom/bond nodes and pointer editing |
| `src/common/view/BoardKeyboardController.ts` | The keyboard path and its announcements |
| `src/common/view/boardDescriptions.ts` | Spoken text for atoms, budget, the whole drawing |
| `src/common/view/StructureNode.ts` | Static drawings (gallery, resonance view, hybrid, icons) |
| `src/common/view/ShapeViewNode.ts` / `ShapePreviewNode.ts` | Rotatable 3D VSEPR model and its panel |
| `src/resonance/view/resonanceDescriptions.ts` | Rank labels, explanations, arrow and hybrid text |
| `src/challenge/view/challengeHints.ts` | Hint text derived from the species and its answer |

## Accessibility

- The board is a focusable `div` with help text; the selected atom is the cursor. Arrows move
  between atoms; L / Shift+L, D, B (then arrows, Enter or 0–3), G, Delete, Ctrl+Z / Ctrl+Y edit.
  Every edit is announced (`addAccessibleResponse`) with the atom's electrons, formal charge,
  status and the electrons left; "Every rule is met" when complete.
- Palette tiles are buttons ("Add oxygen") that add the atom bonded to the selected one.
- Resonance cards are buttons named with the form's rank, multiple bonds and formal charges;
  Previous/Next announce the form shown. The 3D model is focusable and turns with the arrows.
- All three screen summaries have a live current-details paragraph.
- `tests/browser/keyboard.spec.ts` drives every screen by keyboard only.

## Compliance carve-outs

None.

## Testing

| Path | Purpose |
|---|---|
| `tests/common/generateStructures.test.ts` | Generated answers against textbook structures; policies; every species complete and charge-balanced |
| `tests/common/analyzeStructure.test.ts` | Budget, octet statuses, graph comparison |
| `tests/common/LewisStructure.test.ts` | Editing, undo/redo identity, the answer check |
| `tests/common/resonance.test.ts` | Curved arrows, hybrid, gallery |
| `tests/common/vsepr.test.ts` | AXₙEₘ classes and ideal angles |
| `tests/challenge/ChallengeModel.test.ts` | Rounds, hints and scoring |
| `tests/memory-leak.test.ts` | Disposal of nodes created and removed at runtime |
| `tests/browser/keyboard.spec.ts` | Keyboard-only Playwright passes (`npx playwright test tests/browser`) |
| `tests/fuzz/fuzz.spec.ts` | Template-owned pointer + keyboard fuzz |
