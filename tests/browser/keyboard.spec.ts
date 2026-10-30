/**
 * keyboard.spec.ts
 *
 * The drawing board without a pointer: build water and nitrate from the element palette and the
 * board's keys only, and check what a screen reader is told along the way (the text written into
 * the aria-live regions).
 */

import { expect, type Page, test } from "@playwright/test";

/** Records every text written into an aria-live region, from page load on. */
async function recordAnnouncements(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { spoken: string[] }).spoken = spoken;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target;
        const element = target.nodeType === Node.TEXT_NODE ? target.parentElement : (target as Element);
        const live = element?.closest("[aria-live]");
        const text = live?.textContent?.trim();
        if (text) {
          spoken.push(text);
        }
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
}

async function announcements(page: Page): Promise<string> {
  return (await page.evaluate(() => (window as unknown as { spoken: string[] }).spoken)).join("\n");
}

async function press(page: Page, keys: readonly string[]): Promise<void> {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(120);
  }
}

async function addFromPalette(page: Page, elementName: string, times = 1): Promise<void> {
  await page.getByRole("button", { name: `Add ${elementName}` }).focus();
  await press(
    page,
    Array.from({ length: times }, () => "Enter"),
  );
}

async function focusBoard(page: Page): Promise<void> {
  // The board is the only focusable div in the play area that is not a list item or button.
  await page.locator('div[tabindex="0"].a11y-pdom-element').first().focus();
  await page.waitForTimeout(120);
}

test.describe("Drawing board by keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await recordAnnouncements(page);
    await page.goto("/?screens=1&ea");
    await page.getByRole("button", { name: "Add oxygen" }).waitFor();
  });

  test("builds water: O, two H, two lone pairs", async ({ page }) => {
    await addFromPalette(page, "oxygen");
    await addFromPalette(page, "hydrogen", 2);
    await focusBoard(page);
    await press(page, ["l", "l"]);
    await expect.poll(() => announcements(page)).toContain("Added H2, bonded to O.");
    await expect
      .poll(() => announcements(page))
      .toContain("2 lone pairs, 8 electrons, formal charge 0. Octet complete. All electrons placed.");
    await expect.poll(() => announcements(page)).toContain("Every rule is met.");
  });

  test("builds nitrate: a double bond, then lone pairs on each O", async ({ page }) => {
    await addFromPalette(page, "nitrogen");
    await addFromPalette(page, "oxygen", 3);
    await focusBoard(page);
    // Make N=O to the first oxygen, then visit every atom with the arrows and fill the oxygens.
    await press(page, ["b", "2"]);
    await expect.poll(() => announcements(page)).toContain("N to O1: double bond.");
    await press(page, ["ArrowUp", "l", "l", "ArrowDown", "ArrowDown", "l", "l", "l"]);
    await expect.poll(() => announcements(page)).toMatch(/O\d, oxygen\. Bonded to N by a double bond\./);
    await expect
      .poll(() => announcements(page))
      .toContain("3 lone pairs, 8 electrons, formal charge −1. Octet complete.");
  });

  test("undo and redo by keyboard", async ({ page }) => {
    await addFromPalette(page, "oxygen");
    await focusBoard(page);
    await press(page, ["l", "Control+z", "Control+y"]);
    await expect.poll(() => announcements(page)).toContain("Undone.");
    await expect.poll(() => announcements(page)).toContain("Redone.");
  });
});
