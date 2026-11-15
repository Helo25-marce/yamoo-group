import { expect, test } from "@playwright/test"
import { assertImagesLoaded, assertNoHorizontalOverflow, captureProof, gotoFr } from "./helpers"

/**
 * YAMOO DRIVE — contrôles métier
 * Parcours réservation, filtres, formulaires, admin hors parcours public.
 */
test.describe("Drive — booking UI", () => {
  test("page Drive: hero, badge démo, pas de lien Admin public", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByText(/démonstration|demonstration/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /admin/i })).toHaveCount(0)
    await assertNoHorizontalOverflow(page)
    await assertImagesLoaded(page)
    await captureProof(page, "drive", `landing-${testInfo.project.name}`)
  })

  test("parcours: service → trajet → véhicules + filtres", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive")

    await page.getByRole("button", { name: /journée|daily/i }).click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()

    await expect(page.getByRole("heading", { name: /trajet|trip|détails/i })).toBeVisible()
    const city = page.getByLabel(/ville|city|zone/i)
    if (await city.count()) await city.fill("Douala")
    await page.getByRole("button", { name: /véhicules|vehicles|browse/i }).click()

    await expect(page.getByRole("heading", { name: /véhicule|vehicle/i })).toBeVisible()
    await expect(page.getByRole("search")).toBeVisible()
    await expect(page.getByRole("button", { name: /berline|sedan|suv|van|prestige/i }).first()).toBeVisible()

    const images = page.locator("article img")
    const srcs = await images.evaluateAll((nodes) =>
      [...new Set(nodes.map((node) => (node as HTMLImageElement).currentSrc || (node as HTMLImageElement).src))],
    )
    expect(srcs.length).toBeGreaterThanOrEqual(2)

    const sort = page.getByLabel(/trier|sort/i)
    if (await sort.count()) {
      await sort.selectOption({ index: 1 })
    }

    await captureProof(page, "drive", `vehicles-${testInfo.project.name}`)

    await page.getByRole("button", { name: /sélectionner|select/i }).first().click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()

    await expect(page.getByRole("heading", { name: /coordonnées|contact|details/i })).toBeVisible()
    await page.getByLabel(/^nom$|^name$/i).fill("Client QA")
    await page.getByLabel(/téléphone|phone/i).fill("+237 600000000")
    await page.getByLabel(/e-?mail|email/i).fill("qa.client@yamoo.demo")

    await assertNoHorizontalOverflow(page)
    await captureProof(page, "drive", `booking-contact-${testInfo.project.name}`)

    await page.getByRole("button", { name: /enregistrer|save|confirm|demande/i }).click()
    await expect(page.getByText(/YD-|référence|reference/i).first()).toBeVisible()
    await captureProof(page, "drive", `booking-done-${testInfo.project.name}`)
  })

  test("validation: trajet sans lieux pour service immédiat", async ({ page }) => {
    await gotoFr(page, "/drive")
    await page.getByRole("button", { name: /immédiat|immediate/i }).click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()
    await page.getByRole("button", { name: /véhicules|vehicles|browse/i }).click()
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(page.getByRole("alert")).toContainText(/départ|destination|pickup|drop/i)
  })

  test("admin: route existe, hors parcours public Drive", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive")
    await expect(page.getByRole("link", { name: /admin drive|admin/i })).toHaveCount(0)

    await gotoFr(page, "/drive/connexion?next=admin")
    await expect(page.getByRole("heading", { name: /connexion|sign-?in|demo/i })).toBeVisible()
    await page.getByLabel(/e-?mail|email/i).fill("demo.admin@yamoo.demo")
    await page.getByLabel(/mot de passe|password/i).fill("demo")
    await page.getByRole("button", { name: /connecter|sign in/i }).click()
    await expect(page).toHaveURL(/\/drive\/admin/)
    await expect(page.getByRole("heading", { name: /administration|admin/i })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await captureProof(page, "drive", `admin-${testInfo.project.name}`)
  })
})
