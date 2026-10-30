# Model

The chemistry behind Lewis Structures: how electrons are counted, which structures are valid,
how they are ranked, and how shapes follow. Code lives in `src/common/model/`.

## Electron bookkeeping (`analyzeStructure.ts`)

For a drawing with charge *q*:

- valence total = Σ valence electrons of the atoms − *q*
- placed = 2 · Σ bond order + 2 · lone pairs + unpaired electrons
- formal charge of an atom = valence − nonbonding electrons − Σ bond order at the atom

Σ formal charge = Σ valence − placed, so the formal charges add up to the charge exactly when
every electron is placed. The checklist still shows that sum, because seeing it is the point.

Each atom gets an `OctetStatus` from the electrons around it (shared pairs count fully):

| Status | When | Satisfies the rules |
|---|---|---|
| DUET | H with 2 | yes |
| OCTET | 8 | yes |
| INCOMPLETE_ALLOWED | Be with 4; B or Al with 6 | yes |
| EXPANDED | more than 8, period ≥ 3, group ≥ 14, at least two bonds, at most 14 | yes |
| RADICAL | an odd count: 7 (or 9, 11, 13 for an expanded atom) | yes, if the total is odd |
| SHORT | fewer than allowed | no |
| OVER | more than allowed | no |

A drawing is complete when it is connected, every electron is placed, every atom is satisfied,
and it has exactly one unpaired electron if the total is odd and none if it is even.

## Generating the answers (`generateStructures.ts`)

The catalog (`SpeciesCatalog.ts`, 52 species) stores only skeletons: which atom is bonded to
which, with 2D positions for drawing. Every answer is derived:

1. Enumerate bond orders 1–3 on the skeleton's edges, within each atom's bond limit (H 1; an
   octet 4; an expandable atom 7) and the electron total.
2. Give each atom a nonbonding count that brings it to an allowed total: 2 for H, 8, Be 4 or
   B/Al 6, or 10–14 for an expandable atom with two or more bonds. With an odd total, one atom
   holds one fewer: the least electronegative non-hydrogen atom (NO, NO₂ and ClO₂ put it on N, N
   and Cl).
3. Keep the assignments that use exactly the electron total.
4. Rank: Σ|FC|, then ΣFC² (so N=N=N beats N≡N–N in azide, which has the same Σ|FC| but a −2),
   then ΣFC·χ with Pauling electronegativities (negative charge on the more electronegative atom:
   SCN⁻ on N, OCN⁻ on O).

Structures that tie on the whole key are equivalent resonance forms (three for NO₃⁻ and CO₃²⁻,
two for O₃ and benzene). Results are grouped as:

- **best**: the minimum under the policy;
- **alternatives**: also correct under ACCEPT_BOTH (the octet forms when the best set expands);
- **acceptable**: the same Σ|FC| and ΣFC² as the best, but charge on a less electronegative atom;
- **minor**: other valid structures within two units of Σ|FC|.

Searches stop after 200 000 bond-order assignments; only large free-build drawings reach that,
and Check then says the drawing is too large.

### Expanded octets (`OctetPolicy.ts`)

Textbooks disagree on ions such as SO₄²⁻, PO₄³⁻, ClO₄⁻, SO₂ and SO₃. OpenStax Chemistry 2e
(§7.4) chooses the structure with the smallest formal charges, which expands sulfur's octet
(two S=O in sulfate). The modern octet view keeps four S–O bonds and accepts larger formal
charges, citing the weak d-orbital participation found by calculations. The preference:

| Policy | Best | Also correct |
|---|---|---|
| ACCEPT_BOTH (default) | smallest formal charges | the octet form |
| OCTET_FIRST | fewest electrons past eight, then smallest formal charges | — |
| MINIMIZE_FORMAL_CHARGE | smallest formal charges | — |

Where expansion is unavoidable (SF₆, PCl₅, XeF₄, XeF₂, I₃⁻, SF₄, ClF₃) every policy agrees.
Incomplete octets are never forced to an octet: BF₃ keeps boron at six because B=F would put
+1 on fluorine.

### Checking a drawing (`checkStructure.ts`, `moleculeGraph.ts`)

Drawings are compared by graph isomorphism (colour refinement, then backtracking), so atom order
and position never matter. Check reports the first problem in order: wrong atoms, an incomplete
drawing, a different skeleton, then where the finished structure ranks. Free build compares a
drawing with the best structures on its own skeleton. In the Challenge a correct answer is a best
structure or a policy alternative.

## Resonance (`resonance.ts`)

- **Curved arrows** between two forms on the same skeleton: each one-unit change of a bond order
  or lone-pair count is one electron pair. A new bond pair comes from a lone pair on one of its
  atoms, or slides over from a neighbouring bond (benzene); a lost bond pair becomes a lone pair
  on one of its atoms.
- **Hybrid**: the average bond order and formal charge over the equivalent best forms (NO₃⁻:
  N–O 4/3, O −2/3).
- **Gallery**: every best form, then up to two alternatives, acceptable and minor forms each,
  without symmetry copies; at most nine.

## VSEPR (`vsepr.ts`)

Each atom bonded to two or more others is a centre. Its domains are its bonded neighbours (a
multiple bond counts once), its lone pairs, and one for an unpaired electron, so NO₂ comes out
bent. The steric number gives the electron geometry and the lone-pair count the molecular shape
(AXₙEₘ). Lone pairs sit equatorial in a trigonal bipyramid (seesaw, T-shaped, linear) and trans in
an octahedron (square planar). Angles are given as the ideal value, or "a little under" it when
lone pairs squeeze them.

## Data sources

- Pauling electronegativities: CRC Handbook of Chemistry and Physics (the values PeriodicTrends
  uses).
- Covalent radii (for ball sizes in the 3D view): B. Cordero et al., *Dalton Trans.* 2832 (2008).
- Textbook structures the tests check against: OpenStax *Chemistry 2e*, §7.3–7.6.
