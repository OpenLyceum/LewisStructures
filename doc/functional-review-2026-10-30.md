# Lewis Structures functional review

Reviewed 2026-10-30 at commit `b6675f40424d55e80b5c05623ae833795eccc63c`.
Repository: `/home/veillette/OpenLyceum/LewisStructures`.
Environment: Ubuntu 26.04.1 LTS (Windows distribution name `Ubuntu-24.04`), Node v26.13.0.

## Scope and outcome

Reviewed Build, Resonance, and Challenge; electron counting, structure generation and ranking, graph comparison, grading, editing/history, hints/scoring, and view lifecycle paths. Ran the existing automated checks and deterministic Chromium probes with assertions enabled, and inspected desktop screenshots of all three screens.

The initial review found three reproducible P2 issues, recorded below. All three are now addressed by the follow-up changes in the Resolution section. The initial review itself made no application-source changes and created no commits, pushes, or GitHub issues.

## Findings

### P2: Free-build charge edits bypass history and can be overwritten by Redo

Locations: `src/common/model/LewisStructure.ts:96`, `src/common/view/SpeciesChooserNode.ts:55`.

The free-build charge spinner writes directly to `chargeProperty`. Its listener recomputes the analysis but does not record an undo snapshot or clear the redo stack, unlike atom, bond, and electron edits. A charge-only edit therefore cannot be undone. More seriously, a redo from before that edit restores its saved charge and silently discards the newly selected charge, changing the species and electron budget.

Reproduction: select Free build, add O, add a lone pair, Undo, change charge to −1, then Redo. The charge edit leaves Redo enabled; Redo restores the lone pair and changes the charge back to 0. A separate charge-only probe after resetting the drawing produced `{ charge: 1, canUndo: false }`.

Suggested correction: route user charge changes through an undoable structure-edit method, while keeping reset, data replacement, and snapshot restoration from creating additional history entries. Add coverage for charge-only undo/redo and charge edits made after Undo.

### P2: Resonance checking reports the first equivalent gallery form instead of the one drawn

Location: `src/resonance/model/ResonanceModel.ts:109`.

`check()` uses `findIndex(sameStructure)`. Full graph isomorphism permits identical oxygen atoms to exchange places, so all three nitrate resonance forms match the first gallery entry. That equivalence is useful for accepting a chemically equivalent answer, but it cannot identify the numbered form on the fixed drawing skeleton. The interface specifically promises to identify the gallery form and gives a concrete, incorrect number.

Reproduction: on Resonance, choose nitrate and Draw one. Complete the form with the double bond to the top O, matching gallery form 3. Check reports “You drew form 1.” The screenshot shows the top double bond in both the drawing and card 3, while card 1 has its double bond to the lower-right O. A deterministic probe loaded each gallery form into the drawing and checked it: input indices 0, 1, and 2 all returned `{ kind: "match", index: 0 }`.

Suggested correction: retain the correspondence of atoms on the starting skeleton for gallery identification, with a suitable fallback for drawings that have been reconstructed. Keep graph-isomorphism acceptance for grading; alternatively describe the result as equivalent to a listed form rather than claiming a specific form was drawn. Test every equivalent form, not only the first.

### P2: Show answer can replace the student's free-build layout with cached coordinates

Locations: `src/common/model/generateStructures.ts:247` and `src/build/model/BuildModel.ts:70`.

The generator cache key excludes positions, but cached answer data include the positions from the first request. Free-build Show answer passes those cached data directly to `setData`, despite its stated intent to preserve the student's own layout. Once a topology has been cached, moving its atoms and requesting the answer can move them back to an earlier layout, including a layout cached by another screen or catalog operation.

Reproduction: show the catalog water answer, switch to Free build, draw the same water connectivity with shifted coordinates, and select Show answer. The observed positions changed from `[[0.13, 0], [1, 0.5], [1.87, 0]]` to `[[-0.87, -0.5], [0, 0], [0.87, -0.5]]`. The connectivity and charge were unchanged; the returned layout came from the earlier cached answer.

Suggested correction: reuse cached chemistry assignments while combining them with the current input's coordinates before applying a free-build answer. Test a cache hit after moving atoms, including a cache primed by a catalog answer.

## Validation

- `npm run lint`: passed; 96 files checked, no fixes applied.
- `npm run check`: app, scripts, and tests passed.
- `npm test`: 141 tests passed across seven files, including 20 existing memory-harness tests. The mocked environment emitted the text-bounds warning.
- `npm run build`: passed, including PWA generation; main JavaScript bundle 2,772.56 kB, 909.70 kB gzip.
- `FUZZ_PORT=5237 npx playwright test tests/browser`: all five existing keyboard tests passed, covering Build, Resonance, and Challenge.
- `FUZZ_PORT=5237 npm run test:fuzz:quick`: pointer and keyboard fuzz passed with assertions enabled, 10 seconds of fuzz input per mode.
- Baton repository compliance and template drift: passed, including the available remote security-setting probes.
- Development Chromium probes reproduced all three findings without page exceptions. Screenshots inspected at 1440 × 1000 covered the default Build screen, nitrate Draw one, and an active Challenge round.
- Production preview on port 5240: Build, Resonance, and Challenge opened with assertions enabled and no page exceptions.

## Limits

The source review checked the implemented chemistry against the project's documented model and its existing catalog tests; this was not an independent educator review of all textbook structures, electronegativity values, or octet-policy choices. The confirmed resonance issue concerns the displayed form number, not rejection of a chemically equivalent answer.

Short fuzz and keyboard tests do not establish sustained performance, touch/mobile layout, complete localization, or manual screen-reader usability. Heap snapshots and comprehensive descendant-node collection checks were not performed. Some memory cases track a wrapper disposed together with its model, so their passing result alone does not certify collection of every child view.

## Resolution

All three findings were addressed on 2026-10-30:

- Direct user edits to `chargeProperty` now save the state with the previous charge and clear the redo stack. Internal writes during reset, data replacement, and history restoration bypass that history entry. Regressions cover charge-only undo/redo, editing charge after Undo, and internal operations that must remain a single edit or reset history.
- Resonance feedback and its instructions now explicitly describe an equivalent gallery form in English, French, and Spanish. Graph-isomorphism grading is preserved: symmetry-related nitrate drawings may share the same representative. The interface no longer claims that representative is the unique numbered card the student drew. Browser coverage checks all three nitrate forms in each language, and the existing keyboard test checks the updated spoken response.
- Free-build Show answer combines the cached chemistry assignment with the drawing's current atom coordinates before applying it. A regression primes the answer cache through catalog water, changes the free-build layout, then verifies preserved positions, complete chemistry, grading, Undo/Redo, and reset.

The original charge/history and cache-layout failures were reproduced by the added tests before the fixes. Follow-up validation passed: all 145 unit tests, all nine browser tests, 10-second pointer and keyboard fuzz, lint, app/scripts/test type checks, production build, repository compliance, and template drift. The review's remaining limitations above still apply.
