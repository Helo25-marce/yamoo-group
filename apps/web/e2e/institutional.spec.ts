import { expect, test } from "@playwright/test"
import { assertImagesLoaded, assertNoHorizontalOverflow, captureProof, gotoFr } from "./helpers"

/**
 * YAMOO GROUP — contrôles institutionnels
 * Accueil, À propos, Media, Travel, navigation, images, responsive.
 */
test.describe("Institutional — YAMOO GROUP", () => {
  test("accueil: hero, univers, pas de débordement", async ({ page }, testInfo) => {
    await gotoFr(page, "/")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("link", { name: /DRIVE/i }).first()).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await assertImagesLoaded(page)
    await captureProof(page, "institutional", `home-${testInfo.project.name}`)
  })

  test("à propos: photo tablette principale + sections", async ({ page }, testInfo) => {
    await gotoFr(page, "/a-propos")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/vision|experience|expérience/i)
    const tablet = page.locator('img[src*="tablet-blue"]')
    await expect(tablet.first()).toBeVisible()
    const box = await tablet.first().boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(120)
    expect(box?.height ?? 0).toBeGreaterThan(160)
    await expect(page.getByText(/MEDIA/i).first()).toBeVisible()
    await expect(page.getByText(/DRIVE/i).first()).toBeVisible()
    await expect(page.getByText(/TRAVEL/i).first()).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await assertImagesLoaded(page)
    await captureProof(page, "institutional", `about-${testInfo.project.name}`)
  })

  test("media et travel: pages accessibles", async ({ page }, testInfo) => {
    await gotoFr(page, "/media")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await captureProof(page, "institutional", `media-${testInfo.project.name}`)

    await gotoFr(page, "/travel")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await captureProof(page, "institutional", `travel-${testInfo.project.name}`)
  })

  test("navigation À propos depuis l'en-tête", async ({ page }) => {
    await gotoFr(page, "/")
    const about = page.getByRole("navigation").getByRole("link", { name: /propos|about/i })
    if (await about.count()) {
      await about.first().click()
      await expect(page).toHaveURL(/\/a-propos/)
    } else {
      // Mobile: open menu then link
      await page.getByRole("button", { name: /menu|ouvrir/i }).click()
      await page.getByRole("link", { name: /propos|about/i }).first().click()
      await expect(page).toHaveURL(/\/a-propos/)
    }
  })
})
