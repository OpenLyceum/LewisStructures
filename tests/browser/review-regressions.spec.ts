import { expect, test } from "@playwright/test";
import type { BuildModel } from "../../src/build/model/BuildModel.js";
import type { ResonanceModel } from "../../src/resonance/model/ResonanceModel.js";

type SimulationWindow<Model> = {
  phet: { joist: { sim: { selectedScreenProperty: { value: { model: Model } } } } };
};

test("the free-build charge spinner supports Undo and Redo", async ({ page }) => {
  await page.goto("/?screens=1&ea");
  await page.getByRole("button", { name: "Add oxygen", exact: true }).waitFor();
  await page.evaluate(() => {
    (
      window as unknown as SimulationWindow<BuildModel>
    ).phet.joist.sim.selectedScreenProperty.value.model.categoryProperty.value = "freeBuild";
  });
  const charge = page.getByRole("slider", { name: "Charge", exact: true });
  await charge.press("ArrowDown");
  await expect(charge).toHaveAttribute("aria-valuenow", "-1");
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await expect(undo).toBeEnabled();
  await undo.press("Enter");
  await expect(charge).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Redo", exact: true }).press("Enter");
  await expect(charge).toHaveAttribute("aria-valuenow", "-1");
});

for (const { locale, checkName, equivalent } of [
  { locale: "en", checkName: "Check", equivalent: /Your drawing is equivalent to form/ },
  { locale: "fr", checkName: "Vérifier", equivalent: /Votre dessin est équivalent à la forme/ },
  { locale: "es", checkName: "Comprobar", equivalent: /Tu dibujo es equivalente a la forma/ },
]) {
  test(`resonance feedback describes equivalence for every nitrate form in ${locale}`, async ({ page }) => {
    await page.goto(`/?screens=2&ea&locale=${locale}`);
    await page.getByRole("radio").first().waitFor();
    const count = await page.evaluate(() => {
      const model = (window as unknown as SimulationWindow<ResonanceModel>).phet.joist.sim.selectedScreenProperty.value
        .model;
      model.modeProperty.value = "draw";
      return model.galleryProperty.value.length;
    });
    expect(count).toBe(3);
    for (let index = 0; index < count; index++) {
      await page.evaluate((formIndex) => {
        const model = (window as unknown as SimulationWindow<ResonanceModel>).phet.joist.sim.selectedScreenProperty
          .value.model;
        const form = model.galleryProperty.value[formIndex];
        if (!form) {
          throw new Error("Nitrate form not found");
        }
        model.drawing.showData(form.form.data);
      }, index);
      await page.getByRole("button", { name: checkName, exact: true }).press("Enter");
      await expect(page.getByText(equivalent)).toHaveCount(1);
    }
  });
}
