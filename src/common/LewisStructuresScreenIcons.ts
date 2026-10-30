/**
 * LewisStructuresScreenIcons.ts
 *
 * Home-screen and navigation-bar icons, drawn on the standard PhET 548 × 373 canvas with the same
 * nodes as the screens: water's Lewis structure (Build), nitrate with the curved arrows to its next
 * resonance form (Resonance), and carbon dioxide beside a question mark (Challenge).
 */

import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import LewisStructuresColors from "../LewisStructuresColors.js";
import { PIXELS_PER_BOND } from "../LewisStructuresConstants.js";
import { generateStructures } from "./model/generateStructures.js";
import { OctetPolicy } from "./model/OctetPolicy.js";
import { resonanceArrows } from "./model/resonance.js";
import { getSpecies } from "./model/SpeciesCatalog.js";
import type { StructureData } from "./model/StructureData.js";
import { CurvedArrowsNode } from "./view/CurvedArrowsNode.js";
import { StructureNode } from "./view/StructureNode.js";

const W = 548;
const H = 373;
/** Margin left around the drawing inside the icon, px. */
const ICON_MARGIN = 30;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: LewisStructuresColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: LewisStructuresColors.backgroundColorProperty,
  });
}

function bestForms(id: string): StructureData[] {
  return generateStructures(getSpecies(id).skeleton, OctetPolicy.ACCEPT_BOTH).best.map((form) => form.data);
}

/** Scales a drawing to fill the icon area (minus a margin) and centres it there. */
function fitToIcon(node: Node, width = W, height = H, centerX = W / 2): Node {
  node.setScaleMagnitude(Math.min((width - 2 * ICON_MARGIN) / node.width, (height - 2 * ICON_MARGIN) / node.height));
  node.center = node.center.setXY(centerX, height / 2);
  return node;
}

export function createBuildIcon(): ScreenIcon {
  const water = bestForms("water")[0] ?? getSpecies("water").skeleton;
  return iconFrom(
    new Node({
      children: [
        background(),
        fitToIcon(new StructureNode(water, { pixelsPerBond: PIXELS_PER_BOND, showOctetRings: true })),
      ],
    }),
  );
}

export function createResonanceIcon(): ScreenIcon {
  const [first, second] = bestForms("nitrate");
  const structure = new StructureNode(first ?? getSpecies("nitrate").skeleton, { pixelsPerBond: PIXELS_PER_BOND });
  const group = new Node({
    children:
      first && second ? [structure, new CurvedArrowsNode(structure, resonanceArrows(first, second))] : [structure],
  });
  return iconFrom(new Node({ children: [background(), fitToIcon(group)] }));
}

export function createChallengeIcon(): ScreenIcon {
  const carbonDioxide = bestForms("carbonDioxide")[0] ?? getSpecies("carbonDioxide").skeleton;
  const question = new Text("?", {
    font: new PhetFont({ size: 220, weight: "bold" }),
    fill: LewisStructuresColors.accentColorProperty,
  });
  question.center = question.center.setXY(W * 0.82, H / 2);
  return iconFrom(
    new Node({
      children: [
        background(),
        fitToIcon(new StructureNode(carbonDioxide, { pixelsPerBond: PIXELS_PER_BOND }), W * 0.68, H, W * 0.36),
        question,
      ],
    }),
  );
}
