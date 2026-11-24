/**
 * RoundCompletedPanel.ts
 *
 * The end-of-round panel on the Challenge screen: a title that depends on the score, the stars,
 * "Level N", "Score: X out of Y" and a Continue button. It looks like vegas' LevelCompletedNode
 * and uses the vegas strings, but it is built once and shown or hidden, with its text derived
 * from the model's level and score.
 *
 * Why not LevelCompletedNode: it is built per round, and its "Level N" DerivedProperty is never
 * disposed (SceneryStack 3.0.0). That Property stays linked to the vegas level string, and the
 * shared closure context keeps every disposed panel's subtree alive, so each completed round
 * leaked a whole panel (the headless soak's retained-heap climb).
 */

import { DerivedStringProperty, type ReadOnlyProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { Text, VBox } from "scenerystack/scenery";
import { PhetColorScheme, PhetFont } from "scenerystack/scenery-phet";
import { Panel, type PanelOptions, TextPushButton } from "scenerystack/sun";
import { ScoreDisplayStars, VegasStrings } from "scenerystack/vegas";
import LewisStructuresColors from "../../LewisStructuresColors.js";

/** vegas LevelCompletedNode defaults, kept so the panel looks the same. */
const TITLE_FONT = new PhetFont({ size: 28, weight: "bold" });
const INFO_FONT = new PhetFont({ size: 22, weight: "bold" });
const Y_SPACING = 30;
const STAR_DIAMETER = 62;

type SelfOptions = {
  buttonFont?: PhetFont;
  contentMaxWidth?: number;
};

export type RoundCompletedPanelOptions = SelfOptions & PanelOptions;

export class RoundCompletedPanel extends Panel {
  public constructor(
    levelProperty: TReadOnlyProperty<number>,
    scoreProperty: ReadOnlyProperty<number>,
    perfectScore: number,
    numberOfStars: number,
    continueFunction: () => void,
    providedOptions?: RoundCompletedPanelOptions,
  ) {
    const options = optionize<RoundCompletedPanelOptions, SelfOptions, PanelOptions>()(
      {
        buttonFont: new PhetFont(26),
        contentMaxWidth: 400,
        fill: LewisStructuresColors.roundCompletedFillColorProperty,
        stroke: LewisStructuresColors.roundCompletedStrokeColorProperty,
        lineWidth: 2,
        cornerRadius: 35,
        xMargin: 20,
        yMargin: 20,
      },
      providedOptions,
    );
    const maxWidth = options.contentMaxWidth;

    // Same thresholds as LevelCompletedNode.
    const titleStringProperty = new DerivedStringProperty(
      [scoreProperty, VegasStrings.excellent, VegasStrings.great, VegasStrings.good, VegasStrings.keepTrying],
      (score, excellent, great, good, keepTrying) => {
        const proportion = score / perfectScore;
        return proportion > 0.95 ? excellent : proportion > 0.75 ? great : proportion >= 0.5 ? good : keepTrying;
      },
    );
    const levelStringProperty = new DerivedStringProperty([VegasStrings.label.level, levelProperty], (pattern, level) =>
      StringUtils.format(pattern, level),
    );
    const scoreStringProperty = new DerivedStringProperty(
      [VegasStrings.label.score.max, scoreProperty],
      (pattern, score) => StringUtils.format(pattern, score, perfectScore),
    );

    const content = new VBox({
      spacing: Y_SPACING,
      children: [
        new Text(titleStringProperty, { font: TITLE_FONT, maxWidth }),
        new ScoreDisplayStars(scoreProperty, {
          numberOfStars,
          perfectScore,
          starNodeOptions: { starShapeOptions: { innerRadius: STAR_DIAMETER / 4, outerRadius: STAR_DIAMETER / 2 } },
          maxWidth,
        }),
        new Text(levelStringProperty, { font: INFO_FONT, maxWidth }),
        new Text(scoreStringProperty, { font: INFO_FONT, maxWidth }),
        new TextPushButton(VegasStrings.continue, {
          listener: continueFunction,
          font: options.buttonFont,
          baseColor: PhetColorScheme.BUTTON_YELLOW,
          maxWidth,
        }),
      ],
    });

    super(content, options);

    this.disposeRoundCompletedPanel = () => {
      content.disposeSubtree();
      titleStringProperty.dispose();
      levelStringProperty.dispose();
      scoreStringProperty.dispose();
    };
  }

  private readonly disposeRoundCompletedPanel: () => void;

  public override dispose(): void {
    this.disposeRoundCompletedPanel();
    super.dispose();
  }
}
