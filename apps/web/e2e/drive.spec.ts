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
    test.skip(testInfo.project.name !== "desktop-1440", "exécuté sur desktop-1440 ; une session suffit")
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
    test.skip(testInfo.project.name !== "desktop-1440", "exécuté sur desktop-1440 ; une session suffit")
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

const dailySearch =
  "service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=1&luggage=0"

function withSearch(query: string, key: string, value: string) {
  const params = new URLSearchParams(query)
  params.set(key, value)
  return params.toString()
}

test.describe("Drive — résultats", () => {
  test("recherche invalide, URL et route institutionnelle", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "exécuté sur desktop-1440 ; une session suffit")
    await gotoFr(page, "/recherche")
    await expect(page.getByRole("heading", { level: 1, name: /résultats|results/i })).toHaveCount(0)

    await gotoFr(page, "/drive/resultats")
    await expect(page.getByText(/indiquez le service|enter the service/i)).toBeVisible()
    await captureProof(page, "drive", "search-desktop")

    await gotoFr(page, "/drive/resultats?service=yacht&start=2026-11-20T10:00&passengers=1&luggage=0")
    await expect(page.getByRole("alert")).toContainText(/service|chauffeur/i)

    await gotoFr(page, "/drive/resultats?service=chauffeur_daily&start=nope&end=2026-11-22T10:00&passengers=1&luggage=0")
    await expect(page.getByRole("alert")).toContainText(/date/i)

    await gotoFr(
      page,
      "/drive/resultats?service=chauffeur_daily&start=2026-11-22T10:00&end=2026-11-20T10:00&passengers=1&luggage=0",
    )
    await expect(page.getByRole("alert")).toContainText(/fin|end/i)

    await gotoFr(page, "/drive/resultats?service=chauffeur_now&start=2026-11-20T10:00&passengers=1&luggage=0")
    await expect(page.getByRole("alert")).toContainText(/départ|destination|pickup|drop/i)

    await gotoFr(
      page,
      "/drive/resultats?service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=0&luggage=0",
    )
    await expect(page.getByRole("alert")).toContainText(/passager|passenger/i)
    await expect(page.getByLabel(/nombre de passagers|number of passengers/i)).toHaveValue("0")

    await page.goto("/fr/drive?service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=abc&luggage=0&vehicle=veh-berline-1&price=1")
    await expect(page.getByRole("heading", { name: /trajet|trip|détails/i })).toBeVisible()
    await expect(page.getByRole("alert")).toContainText(/passager|passenger/i)
    await expect(page.getByLabel(/nombre de passagers|number of passengers/i)).toHaveValue("abc")
    await expect(page.getByRole("heading", { name: /coordonnées|contact|details/i })).toHaveCount(0)
    await page.getByRole("button", { name: /véhicules|vehicles|browse/i }).click()
    await expect(page.getByRole("heading", { name: /trajet|trip|détails/i })).toBeVisible()
    await expect(page.getByLabel(/nombre de passagers|number of passengers/i)).toHaveValue("abc")
    await expect(page.getByRole("alert")).toContainText(/passager|passenger/i)
  })

  test("filtres, tri, comparaison et passage au wizard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "tablet-768", "exécuté sur desktop-1440 et mobile-390 ; 768 est mesuré dans la boucle desktop")
    await gotoFr(page, `/drive/resultats?${dailySearch}`)
    await expect(page.getByRole("heading", { name: /résultats|results/i })).toBeVisible()
    await expect(page.getByText(/4 véhicule/i)).toBeVisible()
    await expect(page.getByText("Berline Executive").first()).toBeVisible()
    await expect(page.getByText(/255[\s\u202f\u00a0]000/).first()).toBeVisible()
    await expect(page.locator("article").getByText(/disponibilité non confirmée|not confirmed/i).first()).toBeVisible()
    await expect(page.getByText(/disponible maintenant|confirmed available|availability confirmed/i)).toHaveCount(0)
    await expect(page.getByLabel(/nombre de passagers|number of passengers/i)).toHaveValue("1")
    await expect(page.getByLabel(/date et heure de début|start date and time/i)).toHaveValue("2026-11-20T10:00")
    await page.reload()
    await expect(page.getByLabel(/nombre de passagers|number of passengers/i)).toHaveValue("1")
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page).toHaveURL(/start=2026-11-20T10/)
    await captureProof(page, "drive", `results-${testInfo.project.name}`)

    if (testInfo.project.name !== "desktop-1440") {
      await page.getByRole("button", { name: /filtres|filters/i }).first().click()
      await captureProof(page, "drive", "filters-open-mobile")
    } else {
      await captureProof(page, "drive", "filters-desktop")
    }

    await page.getByRole("button", { name: /^suv$/i }).click()
    await expect(page).toHaveURL(/category=suv/)
    await expect(page.getByText(/1 véhicule/i)).toBeVisible()
    await expect(page.getByText("SUV Confort")).toBeVisible()
    await expect(page.getByText("Berline Executive")).toHaveCount(0)

    await page.getByRole("button", { name: /retirer|remove/i }).first().click()
    await expect(page.getByText(/4 véhicule/i)).toBeVisible()

    await page.getByLabel(/trier|sort/i).selectOption("price-desc")
    await expect(page.locator("article h3").first()).toContainText("Prestige Noir")
    await page.goBack()
    await expect(page.locator("article h3").first()).toContainText("Berline Executive")

    await page.getByLabel(/véhicule ou catégorie|vehicle or category/i).fill("van")
    await expect(page.getByText("Van Familial")).toBeVisible()
    await expect(page.getByText("Berline Executive")).toHaveCount(0)
    await captureProof(page, "drive", `filters-combined-${testInfo.project.name}`)
    await page.getByRole("button", { name: /réinitialiser|reset filters/i }).click()
    await expect(page.getByText(/4 véhicule/i)).toBeVisible()

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "passengers", "8")}`)
    await expect(page.getByText(/aucun véhicule|no vehicle/i)).toBeVisible()
    await captureProof(page, "drive", `results-empty-${testInfo.project.name}`)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "unavailable", "1")}`)
    await expect(page.getByText("SUV Affaires")).toBeVisible()
    await expect(
      page.getByRole("article").filter({ hasText: "SUV Affaires" }).getByRole("button", { name: /indisponible|unavailable/i }),
    ).toBeDisabled()
    await captureProof(page, "drive", `results-unavailable-${testInfo.project.name}`)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "compare", "veh-berline-1,veh-suv-1")}`)
    await expect(page.getByRole("heading", { name: /comparaison|comparison/i })).toBeVisible()
    await expect(page.getByRole("row", { name: /critère berline executive/i })).toBeVisible()
    await expect(page.getByRole("row", { name: /suv confort/i }).first()).toBeVisible()
    await page
      .getByRole("article")
      .filter({ hasText: "Van Familial" })
      .getByRole("button", { name: /^comparer$|^compare$/i })
      .click()
    await expect(page.getByRole("row", { name: /van familial/i }).first()).toBeVisible()
    await assertCompareReadable(page)
    await captureProof(page, "drive", `compare-${testInfo.project.name}`)
    await page.getByRole("button", { name: /^retirer$|^remove$/i }).first().click()
    await expect(page.getByRole("region", { name: /comparaison|comparison/i }).getByText("Berline Executive")).toHaveCount(0)
    await page.getByRole("button", { name: /effacer la comparaison|clear comparison/i }).click()
    await expect(page.getByRole("heading", { name: /comparaison|comparison/i })).toHaveCount(0)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "price", "1")}`)
    await expect(page.getByRole("alert")).toContainText(/prix|price/i)
    await expect(page.getByText(/255[\s\u202f\u00a0]000/).first()).toBeVisible()
    await page.getByRole("button", { name: /réserver|book/i }).first().click()
    await expect(page).toHaveURL(/\/drive\?/)
    await expect(page).toHaveURL(/vehicle=veh-berline-1/)
    expect(page.url()).not.toContain("price=")
    await expect(page.getByRole("heading", { name: /coordonnées|contact|details/i })).toBeVisible()
    await expect(page.getByText("Berline Executive")).toBeVisible()
    await expect(page.getByText(/255[\s\u202f\u00a0]000/)).toBeVisible()
    await captureProof(page, "drive", `wizard-from-results-${testInfo.project.name}`)

    if (testInfo.project.name === "desktop-1440") {
      for (const width of [375, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/fr/drive/resultats?${withSearch(dailySearch, "compare", "veh-berline-1,veh-van-1")}`)
        await assertCompareReadable(page)
        if (width <= 390) {
          const scrolls = await page.locator(".drive-compare-scroll").evaluate((node) => node.scrollWidth > node.clientWidth + 1)
          expect(scrolls).toBe(true)
        }
        await captureProof(page, "drive", `results-w${width}`)
      }
      await page.setViewportSize({ width: 1440, height: 900 })
    }

    await page.goto(`/fr/drive/resultats?${dailySearch}&category=suv`)
    const english = page.getByRole("group", { name: /langue|language/i }).getByRole("button", { name: "en", exact: true })
    if (await english.isVisible()) {
      await english.click()
    } else {
      await page.getByRole("button", { name: /ouvrir le menu|open menu/i }).click()
      await page.locator("#mobile-menu").getByRole("button", { name: "en", exact: true }).click()
    }
    await expect(page).toHaveURL(/\/en\/drive\/resultats/)
    await expect(page).toHaveURL(/category=suv/)
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()
    await expect(page.getByLabel(/number of passengers/i)).toHaveValue("1")

    await page.goto("/en/drive/resultats?service=chauffeur_now&start=2026-11-20T10:00&pickup=Douala&dropoff=Yaounde&passengers=1&luggage=0")
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })
})

async function assertCompareReadable(page: import("@playwright/test").Page) {
  await assertNoHorizontalOverflow(page)
  const clipped = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLElement>(".drive-compare button, article button")]
    return buttons.flatMap((btn) => {
      const rect = btn.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) return [(btn.textContent || "button").trim()]
      let node = btn.parentElement
      while (node && node !== document.body) {
        const style = getComputedStyle(node)
        const box = node.getBoundingClientRect()
        const clips = style.overflowX === "hidden" || style.overflow === "hidden"
        if (clips && (rect.right > box.right + 2 || rect.left < box.left - 2)) return [(btn.textContent || "button").trim()]
        node = node.parentElement
      }
      return []
    })
  })
  expect(clipped, "boutons de comparaison masqués").toEqual([])
  const removes = page.locator(".drive-compare").getByRole("button", { name: /^retirer$|^remove$/i })
  const count = await removes.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    const button = removes.nth(index)
    await button.scrollIntoViewIfNeeded()
    const inside = await button.evaluate((node) => {
      const scroller = node.closest(".drive-compare-scroll")
      if (!scroller) return false
      const box = node.getBoundingClientRect()
      const view = scroller.getBoundingClientRect()
      return box.width >= 24 && box.height >= 24 && box.left >= view.left - 1 && box.right <= view.right + 1
    })
    expect(inside).toBe(true)
  }
}

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
