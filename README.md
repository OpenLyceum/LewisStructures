# Lewis Structures

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Lewis structures for introductory (General) chemistry: count valence electrons, place atoms,
bonds, lone pairs and unpaired electrons on a drawing board, and see formal charges and octets
checked live. Compare resonance forms with electron-pushing arrows and the hybrid, practise in a
three-level challenge, and see each finished structure's VSEPR shape in 3D. Built with
[SceneryStack](https://scenerystack.org/); runs offline as a Progressive Web App.

## Features

- **Build.** Choose one of 52 molecules and ions (simple molecules, multiple bonds, ions,
  resonance, expanded and incomplete octets, odd-electron molecules) or draw anything in free
  build. Drag elements onto the board, drag between atoms to bond them, click a bond to change its
  order, and add lone pairs. The valence-electron count, a checklist of the rules, octet rings
  and formal-charge badges update with every edit. Check compares the drawing with the best
  structure and names the first thing wrong; Skeleton and Show answer help when stuck. A 3D panel
  shows the VSEPR shape (AX<sub>n</sub>E<sub>m</sub>, geometry and bond angles).
- **Resonance.** Fifteen species with more than one reasonable structure (NO<sub>3</sub><sup>−</sup>,
  O<sub>3</sub>, SCN<sup>−</sup>, benzene, SO<sub>4</sub><sup>2−</sup>…): every equivalent major
  form, the octet-rule alternative and the minor forms, ranked with the reason. Curved arrows show
  the electron pairs that turn one form into the next; the hybrid shows fractional bond orders and
  charges (1⅓, −⅔). Or complete the skeleton yourself and find out which form you drew.
- **Challenge.** Three levels of five problems: draw each species from scratch. Hints, a point
  each, give the electron total, the central atom, the skeleton, where the multiple bonds or
  unusual octets are, and finally the answer.
- **Answers are generated, not typed in.** Every valid structure on a skeleton is enumerated and
  ranked by formal charge, so free-build drawings can be checked too. A preference chooses how
  expanded octets are judged (minimise formal charge as OpenStax does, keep the octet, or accept
  both).
- **Accessible:** the board works fully from the keyboard (arrows between atoms, L lone pair,
  B bond, G move, Delete) with every edit announced; live screen summaries; keyboard-help dialogs.
- English, French and Spanish; default and projector colour profiles; installable PWA.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
