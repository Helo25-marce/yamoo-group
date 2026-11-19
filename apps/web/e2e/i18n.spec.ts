import { expect, test } from "@playwright/test"
import { gotoFr } from "./helpers"

test.describe("i18n FR/EN coherence", () => {
  test("accueil FR et EN affichent des titres distincts", async ({ page }) => {
    await gotoFr(page, "/")
    const frTitle = (await page.getByRole("heading", { level: 1 }).innerText()).trim()
    expect(frTitle.length).toBeGreaterThan(5)

    await page.goto("/en")
    await page.waitForLoadState("domcontentloaded")
    const enTitle = (await page.getByRole("heading", { level: 1 }).innerText()).trim()
    expect(enTitle.length).toBeGreaterThan(5)
    expect(enTitle.toLowerCase()).not.toEqual(frTitle.toLowerCase())
  })

  test("Drive FR/EN: badge démo présent", async ({ page }) => {
    await gotoFr(page, "/drive")
    await expect(page.getByText(/démonstration|fictif/i).first()).toBeVisible()

    await page.goto("/en/drive")
    await page.waitForLoadState("domcontentloaded")
    await expect(page.getByText(/demonstration|fictional/i).first()).toBeVisible()
  })

  test("À propos FR/EN: photo tablette présente", async ({ page }) => {
    await gotoFr(page, "/a-propos")
    await expect(page.locator('img[src*="tablet-blue"]').first()).toBeVisible()

    await page.goto("/en/a-propos")
    await page.waitForLoadState("domcontentloaded")
    await expect(page.locator('img[src*="tablet-blue"]').first()).toBeVisible()
  })
})
