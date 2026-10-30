/**
 * SpeciesChooserNode.ts
 *
 * Choosing what to draw: a category menu, then the species in it (a list of at most a dozen, so it
 * fits on screen), with the formula shown large beside them. In free build the species menu gives
 * way to a charge spinner. The species menu is rebuilt when the category changes.
 */

import { Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { HBox, Node, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { type ComboBox, NumberSpinner } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import LewisStructuresColors from "../../LewisStructuresColors.js";
import { MAX_CHARGE, MIN_CHARGE } from "../../LewisStructuresConstants.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../LewisStructuresButtonOptions.js";
import { getSpeciesInCategory, SPECIES_CATEGORIES, type Species } from "../model/SpeciesCatalog.js";
import type { CategoryChoice } from "../model/SpeciesChoice.js";
import { CONTROL_FONT, comboBox, label } from "./ControlFactory.js";
import { categoryName, speciesDisplay, speciesName } from "./speciesLabels.js";

const COMBO_WIDTH = 230;
const FORMULA_FONT = new PhetFont({ size: 26, weight: "bold" });

export class SpeciesChooserNode extends HBox {
  private readonly disposeSpeciesChooserNode: () => void;

  public constructor(
    categoryProperty: Property<CategoryChoice>,
    speciesProperty: Property<Species | null>,
    chargeProperty: Property<number>,
    listParent: Node,
  ) {
    const strings = StringManager.getInstance().getCommonStrings();

    const categories: CategoryChoice[] = [...SPECIES_CATEGORIES, "freeBuild"];
    const categoryBox = comboBox(
      categoryProperty,
      categories.map((category) => ({ value: category, label: categoryName(category) })),
      listParent,
      strings.categoryStringProperty,
      COMBO_WIDTH - 40,
    );

    // The species menu, rebuilt for each category. Its own Property mirrors speciesProperty so the
    // ComboBox always holds a value from its item list.
    const speciesSlot = new Node();
    let speciesBox: ComboBox<Species> | null = null;
    let speciesBoxProperty: Property<Species> | null = null;
    const chargeSpinner = new HBox({
      spacing: 6,
      children: [
        label(strings.chargeStringProperty, 80),
        new NumberSpinner(chargeProperty, new Property(new Range(MIN_CHARGE, MAX_CHARGE)), {
          arrowsPosition: "leftRight",
          arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
          numberDisplayOptions: { textOptions: { font: CONTROL_FONT } },
          accessibleName: strings.chargeStringProperty,
        }),
      ],
    });

    const disposeSpeciesBox = () => {
      speciesBox?.dispose();
      speciesBoxProperty?.dispose();
      speciesBox = null;
      speciesBoxProperty = null;
    };
    const rebuild = (category: CategoryChoice) => {
      disposeSpeciesBox();
      if (category === "freeBuild") {
        speciesSlot.children = [chargeSpinner];
        return;
      }
      const list = getSpeciesInCategory(category);
      const initial = speciesProperty.value && list.includes(speciesProperty.value) ? speciesProperty.value : list[0];
      if (!initial) {
        speciesSlot.children = [];
        return;
      }
      const property = new Property<Species>(initial);
      property.lazyLink((species) => {
        speciesProperty.value = species;
      });
      speciesBoxProperty = property;
      speciesBox = comboBox(
        property,
        list.map((species) => ({ value: species, label: speciesName(species), display: speciesDisplay(species) })),
        listParent,
        strings.speciesStringProperty,
        COMBO_WIDTH + 40,
      );
      speciesSlot.children = [speciesBox];
    };
    categoryProperty.link(rebuild);

    // Keep the species menu in step when the species changes from elsewhere (Reset All).
    const syncSpecies = (species: Species | null) => {
      // Skip a species from another category: the menu for its category is about to be rebuilt.
      if (
        species &&
        speciesBoxProperty &&
        speciesBoxProperty.value !== species &&
        species.category === speciesBoxProperty.value.category
      ) {
        speciesBoxProperty.value = species;
      }
    };
    speciesProperty.link(syncSpecies);

    const formula = new RichText("", {
      font: FORMULA_FONT,
      fill: LewisStructuresColors.textColorProperty,
      maxWidth: 260,
    });
    const updateFormula = () => {
      const species = speciesProperty.value;
      formula.string = species ? species.formula : strings.freeBuildTitleStringProperty.value;
      formula.font = species ? FORMULA_FONT : CONTROL_FONT;
    };
    speciesProperty.link(updateFormula);
    strings.freeBuildTitleStringProperty.lazyLink(updateFormula);

    super({ spacing: 14, align: "center", children: [categoryBox, speciesSlot, formula] });

    this.disposeSpeciesChooserNode = () => {
      categoryProperty.unlink(rebuild);
      speciesProperty.unlink(syncSpecies);
      speciesProperty.unlink(updateFormula);
      strings.freeBuildTitleStringProperty.unlink(updateFormula);
      disposeSpeciesBox();
      categoryBox.dispose();
    };
  }

  public override dispose(): void {
    this.disposeSpeciesChooserNode();
    super.dispose();
  }
}
