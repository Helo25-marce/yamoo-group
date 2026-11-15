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

  test("store existant yamoo.drive.v1 : réservation et tarif conservés", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "une session suffit")
    const existing = {
      version: 1,
      vehicles: [
        {
          id: "veh-berline-1",
          name: "Tarif conserve",
          category: "berline",
          seats: 3,
          luggage: 2,
          imageSrc: "/visuals/drive/vehicles/berline-executive.jpg",
          available: true,
          dailyRateFcfa: 123456,
          tripRateFcfa: 25000,
          demo: true,
        },
      ],
      bookings: [
        {
          id: "bk-keep",
          reference: "YD-KEEP",
          status: "pending",
          service: "chauffeur_now",
          vehicleId: "veh-berline-1",
          vehicleName: "Tarif conserve",
          startAt: "2026-11-20T10:00:00.000Z",
          endAt: "2026-11-20T10:00:00.000Z",
          durationDays: 1,
          pickup: "Douala",
          dropoff: "Aeroport",
          clientName: "Client Existant",
          clientPhone: "+237600000001",
          clientEmail: "keep@yamoo.demo",
          priceFcfa: 25000,
          currency: "FCFA",
          demo: true,
          createdAt: "2026-11-01T00:00:00.000Z",
          updatedAt: "2026-11-01T00:00:00.000Z",
        },
      ],
      notifications: [],
      session: { role: "client", email: "keep@yamoo.demo", name: "Client Existant", demo: true },
    }
    await page.addInitScript((raw) => {
      localStorage.setItem("yamoo.drive.v1", raw)
    }, JSON.stringify(existing))

    await gotoFr(page, "/drive/compte")
    await expect(page.getByText("YD-KEEP")).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem("yamoo.drive.v1") ?? "")
    expect(stored).toContain("YD-KEEP")
    expect(stored).toContain("123456")

    await gotoFr(page, "/drive")
    await page.getByRole("button", { name: /journée|daily/i }).click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()
    await page.getByRole("button", { name: /véhicules|vehicles|browse/i }).click()
    await expect(page.getByText("Tarif conserve")).toBeVisible()
    await expect(page.getByText(/123[\s\u202f\u00a0]456/).first()).toBeVisible()
    await expect(page.getByText(/visuel de démonstration|demonstration still/i).first()).toBeVisible()
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("yamoo.drive.v1") || "{}"))
    expect(after.bookings.some((item: { reference: string }) => item.reference === "YD-KEEP")).toBe(true)
    expect(after.vehicles.find((item: { id: string }) => item.id === "veh-berline-1")?.dailyRateFcfa).toBe(123456)
  })

  test("focus, contraste et routes EN", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "une session suffit")
    await gotoFr(page, "/drive")
    await page.getByRole("button", { name: /journée|daily/i }).click()
    const next = page.getByRole("button", { name: /^continuer$|^continue$/i })
    const colors = await next.evaluate((el) => {
      const style = getComputedStyle(el)
      return { background: style.backgroundColor, color: style.color }
    })
    expect(contrastRatio(colors.color, colors.background)).toBeGreaterThanOrEqual(4.5)
    await next.focus()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Shift+Tab")
    await expect(next).toBeFocused()
    const outline = await next.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(outline).not.toBe("none")

    await page.goto("/en/drive")
    await expect(page.getByText(/demonstration/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/en\/drive/)
    await assertNoHorizontalOverflow(page)

    for (const width of [375, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/fr/drive")
      await assertNoHorizontalOverflow(page)
      await captureProof(page, "drive", `landing-w${width}`)
    }
  })
})

function contrastRatio(foreground: string, background: string) {
  const lum = (color: string) => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match) return 0
    const channels = [match[1], match[2], match[3]].map((channel) => {
      const value = Number(channel) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }
  const lighter = Math.max(lum(foreground), lum(background))
  const darker = Math.min(lum(foreground), lum(background))
  return (lighter + 0.05) / (darker + 0.05)
}
