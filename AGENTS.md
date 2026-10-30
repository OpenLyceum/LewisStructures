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

### Template-owned files (drift-checked)

Infrastructure files are owned by this template and must stay byte-identical in every sim
(after substituting the sim's own name). `Baton/scripts/check-template-drift.sh <Sim>` compares a
sim against this repo using `Baton/config/template-manifest.json`, which lists the exact files,
the required `package.json` scripts, and the few keys a sim may extend (extra `biome.json`
ignores, extra tsconfig `types`, CSP/Permissions additions).

To diverge on purpose, add a bullet to the sim's own `## Compliance carve-outs` section naming
the file in backticks and the reason, e.g. ``- `tests/setup.ts`: adds a WebGPU mock``. The drift
checker treats a file named there as approved. Fix template-owned files **here first**, then
propagate — never hand-edit one in a single sim.

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

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

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` on app, scripts, and tests) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` | Playwright fuzz smoke (pointer + keyboard, `?ea`, 30s each; `npm run test:fuzz -- 90` to change) |
| `npm run test:fuzz:quick` | 10s fuzz |
| `npm run test:fuzz:long` | 300s fuzz |
| `npm run icons` | Regenerate PWA icons; seed missing screenshots, preserve existing ones |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |

`src/init.ts` reads `version` from `package.json`, so the patch bump shows up in the About dialog
without a second edit.
