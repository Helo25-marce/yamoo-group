import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { assertImagesLoaded, assertNoHorizontalOverflow, captureProof, gotoFr, shotRoot } from "./helpers"

async function showAllVehicles(page: Page) {
  const more = page.locator(".drive-pager").getByRole("button")
  while (await more.count()) await more.click()
}

/**
 * YAMOO DRIVE — contrôles métier
 * Parcours réservation, filtres, formulaires, admin hors parcours public.
 */
test.describe("Drive — booking UI", () => {
  test("page Drive: catalogue immédiat, badge démo, pas de lien Admin public", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive")
    await expect(page.locator(".drive-commerce-hero")).toHaveCount(0)
    await expect(page.getByRole("heading", { level: 1, name: /résultats|results/i })).toBeVisible()
    const driveSearch = page.locator("#drive-search")
    await expect(driveSearch.getByRole("button", { name: /^rechercher$|^search$/i })).toBeVisible()
    await expect(page.getByRole("toolbar", { name: /catégories|categories/i })).toBeVisible()
    await expect(page.getByRole("heading", { level: 3, name: "Mercedes-Benz E-Class" })).toBeVisible()
    await showAllVehicles(page)
    await expect(page.getByRole("heading", { level: 3, name: "Cadillac Escalade" })).toBeVisible()
    await expect(page.getByText(/renseignez votre trajet|enter your trip/i)).toHaveCount(0)
    await expect(page.getByText(/450[\s\u202f\u00a0]000/)).toHaveCount(0)
    await expect(page.getByText(/fictifs|fictional/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /admin/i })).toHaveCount(0)
    await assertNoHorizontalOverflow(page)
    await assertImagesLoaded(page)
    await page.screenshot({ path: path.join(shotRoot, "drive", `catalog-open-${testInfo.project.name}.png`) })
    await captureProof(page, "drive", `landing-${testInfo.project.name}`)

    if (testInfo.project.name === "desktop-1440") {
      await page.locator(".drive-filters").screenshot({ path: path.join(shotRoot, "drive", "catalog-filters-desktop.png") })
      await page.getByRole("toolbar", { name: /catégories|categories/i }).getByRole("button", { name: /^suv$/i }).click()
      await expect(page).toHaveURL(/category=suv/)
      await expect(page.getByRole("heading", { level: 3, name: "Range Rover Sport" })).toBeVisible()
      await expect(page.getByRole("heading", { level: 3, name: "Mercedes-Benz E-Class" })).toHaveCount(0)
      await page.screenshot({ path: path.join(shotRoot, "drive", "catalog-category-desktop.png") })
      await page.getByRole("toolbar", { name: /catégories|categories/i }).getByRole("button", { name: /toutes|all/i }).click()
      await showAllVehicles(page)
      await page.getByRole("article").filter({ hasText: "Mercedes-Benz E-Class" }).getByRole("button", { name: /^comparer$|^compare$/i }).click()
      await page.getByRole("article").filter({ hasText: "Range Rover Sport" }).getByRole("button", { name: /^comparer$|^compare$/i }).click()
      const comparison = page.getByRole("heading", { name: /comparaison|comparison/i })
      await expect(comparison).toBeVisible()
      await comparison.scrollIntoViewIfNeeded()
      await page.screenshot({ path: path.join(shotRoot, "drive", "catalog-compare-desktop.png") })
      await page.getByRole("article").filter({ hasText: "Mercedes-Benz E-Class" }).getByRole("button", { name: /voir l'offre|view offer/i }).click()
      await expect(page.getByRole("status").filter({ hasText: /renseignez votre trajet|enter your trip/i })).toBeVisible()
      await expect(page).not.toHaveURL(/\/drive\/vehicules\//)
      await driveSearch.getByRole("button", { name: /date de prise en charge|pick-up date/i }).click()
      await page.getByRole("gridcell", { name: "20", exact: true }).click()
      await driveSearch.getByRole("button", { name: /date de retour|date de fin|date de restitution|return date|drop-off date/i }).click()
      await page.getByRole("gridcell", { name: "22", exact: true }).click()
      await driveSearch.getByRole("button", { name: /^rechercher$|^search$/i }).click()
      await expect(page.getByText(/demander un devis|request a quote/i).first()).toBeVisible()
      await page.getByRole("article").filter({ hasText: "Mercedes-Benz E-Class" }).getByRole("link", { name: /voir l'offre|view offer/i }).click()
      await expect(page).toHaveURL(/\/drive\/vehicules\/veh-berline-1/)
      expect(page.url()).not.toContain("price=")
      await expect(page.getByText(/450[\s\u202f\u00a0]000/).first()).toBeVisible()
      await page.getByRole("button", { name: /continuer|continue/i }).click()
      await expect(page).toHaveURL(/\/drive\/commande/)
      await expect(page).toHaveURL(/vehicle=veh-berline-1/)
      expect(page.url()).not.toContain("price=")
      await page.screenshot({ path: path.join(shotRoot, "drive", "catalog-wizard-desktop.png") })
    }
  })

  test("parcours: service → trajet → véhicules + filtres", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive/reservation")

    await page.getByRole("button", { name: /journée|daily/i }).click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()

    await expect(page.getByRole("heading", { name: /trajet|trip|détails/i })).toBeVisible()
    const city = page.getByLabel(/ville|city|zone/i)
    if (await city.count()) {
      await city.fill("Douala")
      await city.press("Escape")
    }
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
    await gotoFr(page, "/drive/reservation")
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
        {
          id: "veh-suv-1",
          name: "Toyota RAV4",
          category: "suv",
          seats: 5,
          luggage: 4,
          imageSrc: "/images/drive/vehicles/toyota-rav4.jpg",
          available: false,
          dailyRateFcfa: 110000,
          tripRateFcfa: 35000,
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
    await expect(page.getByText("Tarif conserve").first()).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem("yamoo.drive.v1") ?? "")
    const kept = JSON.parse(stored) as {
      bookings: Array<{ reference: string; vehicleName: string }>
      vehicles: Array<{ id: string; dailyRateFcfa: number; available: boolean; tripRateFcfa: number }>
    }
    expect(kept.bookings.some((item) => item.reference === "YD-KEEP" && item.vehicleName === "Tarif conserve")).toBe(true)
    expect(kept.vehicles.find((item) => item.id === "veh-berline-1")).toMatchObject({
      available: true,
      dailyRateFcfa: 123456,
      tripRateFcfa: 25000,
    })

    await gotoFr(page, "/drive")
    await showAllVehicles(page)
    await expect(page.getByRole("heading", { level: 3, name: "Land Rover Range Rover Sport" })).toBeVisible()
    await expect(page.getByText("Toyota RAV4")).toHaveCount(0)
    await expect(page.getByText(/123[\s\u202f\u00a0]456/)).toHaveCount(0)
    await gotoFr(page, "/drive/reservation")
    await page.getByRole("button", { name: /journée|daily/i }).click()
    await page.getByRole("button", { name: /continuer|continue/i }).click()
    await page.getByRole("button", { name: /véhicules|vehicles|browse/i }).click()
    await expect(page.getByText(/123[\s\u202f\u00a0]456/).first()).toBeVisible()
    await expect(page.getByText(/photos du modèle|model photos/i).first()).toBeVisible()
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("yamoo.drive.v1") || "{}"))
    expect(after.bookings.some((item: { reference: string; vehicleName: string }) => item.reference === "YD-KEEP" && item.vehicleName === "Tarif conserve")).toBe(true)
    expect(after.vehicles.find((item: { id: string }) => item.id === "veh-berline-1")?.dailyRateFcfa).toBe(123456)
  })

  test("focus, contraste et routes EN", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "exécuté sur desktop-1440 ; une session suffit")
    await gotoFr(page, "/drive/reservation")
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
    await expect(page.getByText(/fictional/i).first()).toBeVisible()
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
    await expect(page.getByRole("heading", { level: 3, name: "Mercedes-Benz E-Class" })).toBeVisible()
    await expect(page.getByText(/renseignez votre trajet|enter your trip/i)).toHaveCount(0)
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

    await page.goto("/fr/drive/reservation?service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=abc&luggage=0&vehicle=veh-berline-1&price=1")
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
    await expect(page.getByText(/48 véhicule/i)).toBeVisible()
    await expect(page.getByText("Mercedes-Benz E-Class").first()).toBeVisible()
    await expect(page.getByText(/prix pour 3 jours|price for 3 days/i).first()).toBeVisible()
    await expect(page.getByText(/demander un devis|request a quote/i)).toHaveCount(0)
    await expect(page.locator("article").getByText(/disponibilité non confirmée|not confirmed/i).first()).toBeVisible()
    await expect(page.getByText(/disponible maintenant|confirmed available|availability confirmed/i)).toHaveCount(0)
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page.getByRole("button", { name: /date de prise en charge|pick-up date/i })).toBeVisible()
    await expect(page).toHaveURL(/start=2026-11-20T10/)
    await page.reload()
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page).toHaveURL(/start=2026-11-20T10/)
    await captureProof(page, "drive", `results-${testInfo.project.name}`)

    if (testInfo.project.name !== "desktop-1440") {
      await page.getByRole("button", { name: /^filtres$|^filters$/i }).click()
      await captureProof(page, "drive", "filters-open-mobile")
      await page.locator(".drive-filters.is-open").getByRole("button", { name: /fermer les filtres|close filters/i }).click()
    } else {
      await captureProof(page, "drive", "filters-desktop")
    }

    await page.getByRole("toolbar", { name: /catégories|categories/i }).getByRole("button", { name: /^suv$/i }).click()
    await expect(page).toHaveURL(/category=suv/)
    await expect(page.getByText(/14 véhicule/i)).toBeVisible()
    await expect(page.getByText("Range Rover Sport")).toBeVisible()
    await expect(page.getByText("Mercedes-Benz E-Class")).toHaveCount(0)

    await page.getByRole("button", { name: /retirer|remove/i }).first().click()
    await expect(page.getByText(/48 véhicule/i)).toBeVisible()

    await page.getByLabel(/trier|sort/i).selectOption("price-desc")
    await expect(page.locator("article h3").first()).toContainText("Rolls-Royce Cullinan")
    await page.goBack()
    await expect(page.locator("article h3").first()).toContainText("Genesis G80")

    if (testInfo.project.name !== "desktop-1440") {
      await page.getByRole("button", { name: /^filtres$|^filters$/i }).click()
    }
    await page.getByLabel(/véhicule ou catégorie|vehicle or category/i).fill("van")
    await expect(page.getByText("Toyota Alphard")).toBeVisible()
    await expect(page.getByText("Mercedes-Benz E-Class")).toHaveCount(0)
    await captureProof(page, "drive", `filters-combined-${testInfo.project.name}`)
    await page.getByRole("button", { name: /réinitialiser|effacer tous les filtres|reset filters|clear all filters/i }).click()
    await expect(page.getByText(/48 véhicule/i)).toBeVisible()
    const closeFilters = page.locator(".drive-filters.is-open").getByRole("button", { name: /fermer les filtres|close filters/i })
    if (await closeFilters.count()) await closeFilters.click()

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "passengers", "8")}`)
    await expect(page.getByText(/aucun véhicule|no vehicle/i)).toBeVisible()
    await captureProof(page, "drive", `results-empty-${testInfo.project.name}`)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "unavailable", "1")}`)
    await showAllVehicles(page)
    await expect(page.getByText("Cadillac Escalade")).toBeVisible()
    await expect(
      page.getByRole("article").filter({ hasText: "Cadillac Escalade" }).getByRole("button", { name: /indisponible|unavailable/i }),
    ).toBeDisabled()
    await captureProof(page, "drive", `results-unavailable-${testInfo.project.name}`)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "compare", "veh-berline-1,veh-suv-1")}`)
    await expect(page.getByRole("heading", { name: /comparaison|comparison/i })).toBeVisible()
    await expect(page.getByRole("row", { name: /véhicule mercedes-benz e-class land rover range rover sport/i })).toBeVisible()
    await showAllVehicles(page)
    await page
      .getByRole("article")
      .filter({ hasText: "Toyota Alphard" })
      .getByRole("button", { name: /^comparer$|^compare$/i })
      .click()
    await expect(page.getByRole("row", { name: /véhicule mercedes-benz e-class land rover range rover sport toyota alphard/i })).toBeVisible()
    await assertCompareReadable(page)
    await captureProof(page, "drive", `compare-${testInfo.project.name}`)
    await page.getByRole("button", { name: /^retirer$|^remove$/i }).first().click()
    await expect(page.getByRole("region", { name: /comparaison|comparison/i }).getByText("Mercedes-Benz E-Class")).toHaveCount(0)
    await page.getByRole("button", { name: /effacer la comparaison|clear comparison/i }).click()
    await expect(page.getByRole("heading", { name: /comparaison|comparison/i })).toHaveCount(0)

    await gotoFr(page, `/drive/resultats?${withSearch(dailySearch, "price", "1")}`)
    await expect(page.getByRole("alert")).toContainText(/prix|price/i)
    const corolla = page.getByRole("article").filter({ hasText: "Mercedes-Benz E-Class" })
    await expect(corolla.locator(".drive-offer-price")).toHaveText(/450[\s\u202f\u00a0]000/)
    await corolla.getByRole("button", { name: /informations importantes|important information/i }).click()
    await expect(page.getByRole("dialog", { name: /informations importantes|important information/i })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await corolla.getByRole("link", { name: /voir l'offre|view offer/i }).click()
    await expect(page).toHaveURL(/\/drive\/vehicules\/veh-berline-1/)
    expect(page.url()).not.toContain("price=")
    await expect(page.getByText(/450[\s\u202f\u00a0]000/).first()).toBeVisible()
    await page.getByRole("button", { name: /continuer|continue/i }).click()
    await expect(page).toHaveURL(/\/drive\/commande/)
    await expect(page).toHaveURL(/vehicle=veh-berline-1/)
    expect(page.url()).not.toContain("price=")
    await expect(page.getByRole("heading", { name: "Mercedes-Benz E-Class" })).toBeVisible()
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
    await expect(page.getByRole("button", { name: /^search$/i })).toBeVisible()

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

test.describe("Drive — fiche véhicule", () => {
  test("fiche, galerie, prix, retour et wizard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "tablet-768", "exécuté sur desktop-1440 et mobile-390 ; 768 mesuré dans la boucle desktop")
    const search = `${dailySearch}&category=suv&sort=price-desc`
    await gotoFr(page, `/drive/resultats?${search}`)
    await showAllVehicles(page)
    await page.getByRole("article").filter({ hasText: "Range Rover Sport" }).getByRole("link", { name: /voir l'offre|view offer/i }).click()
    await expect(page).toHaveURL(/\/drive\/vehicules\/veh-suv-1/)
    await expect(page).toHaveURL(/category=suv/)
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect(page.getByRole("heading", { level: 1, name: "Range Rover Sport" })).toBeVisible()
    await expect(page.getByText(/690[\s\u202f\u00a0]000/)).toBeVisible()
    await expect(page.getByRole("img", { name: /pas une photographie distincte de la flotte|not a distinct fleet photograph/i })).toBeVisible()
    await expect(page.getByText(/photos du modèle|model photos/i).first()).toBeVisible()
    await expect(page.getByText(/disponibilité non confirmée|not confirmed/i).first()).toBeVisible()
    await expect(page.getByRole("list", { name: /miniatures|thumbnails/i })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("heading", { level: 1, name: "Range Rover Sport" })).toBeVisible()
    await expect(page).toHaveURL(/sort=price-desc/)
    await assertNoHorizontalOverflow(page)

    const reserve = page.getByRole("complementary", { name: /récapitulatif|summary/i }).getByRole("button", { name: /continuer|continue/i })
    await reserve.scrollIntoViewIfNeeded()
    await expect(reserve).toBeVisible()
    const covered = await page.evaluate(() => {
      const button = document.querySelector(".drive-sheet-reserve")
      const heading = document.querySelector(".drive-sheet-panel h2")
      if (!button || !heading) return true
      const a = button.getBoundingClientRect()
      const b = heading.getBoundingClientRect()
      return a.top < b.bottom - 1 && a.bottom > b.top + 1 && a.left < b.right && a.right > b.left
    })
    expect(covered).toBe(false)
    await page.evaluate(() => window.scrollTo(0, 0))
    if (testInfo.project.name === "desktop-1440") {
      await page.screenshot({ path: path.join(shotRoot, "drive", "sheet-desktop-viewport.png") })
      await captureProof(page, "drive", "sheet-desktop")
      await page.locator(".drive-sheet-panel").screenshot({ path: path.join(shotRoot, "drive", "sheet-price.png") })
    } else {
      await page.screenshot({ path: path.join(shotRoot, "drive", "sheet-mobile-viewport.png") })
      await captureProof(page, "drive", "sheet-mobile-390")
    }

    await page.getByRole("region", { name: /galerie|gallery/i }).focus()
    await page.keyboard.press("ArrowRight")
    await page.getByRole("button", { name: /agrandir|enlarge/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await page.getByRole("button", { name: /agrandir|enlarge/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.screenshot({ path: path.join(shotRoot, "drive", `sheet-gallery-viewport-${testInfo.project.name}.png`) })
    await captureProof(page, "drive", `sheet-gallery-${testInfo.project.name}`)
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)

    await page.getByRole("navigation", { name: /fil d'ariane|breadcrumb/i }).getByRole("link", { name: /^résultats$|^results$/i }).click()
    await expect(page).toHaveURL(/\/drive\/resultats/)
    await expect(page).toHaveURL(/category=suv/)
    await expect(page).toHaveURL(/sort=price-desc/)
    await expect(page.getByRole("heading", { level: 1, name: /résultats|results/i })).toBeVisible()
    await showAllVehicles(page)
    await expect(page.getByRole("heading", { level: 3, name: "Range Rover Sport" })).toBeVisible()

    await gotoFr(page, `/drive/vehicules/veh-berline-1?${dailySearch}&price=999`)
    await expect(page.getByRole("alert")).toContainText(/prix|price/i)
    await expect(page.getByText(/450[\s\u202f\u00a0]000/)).toBeVisible()
    await page.getByRole("button", { name: /continuer|continue/i }).click()
    await expect(page).toHaveURL(/\/drive\/commande/)
    await expect(page).toHaveURL(/vehicle=veh-berline-1/)
    expect(page.url()).not.toContain("price=")
    await expect(page.getByRole("heading", { name: /ajoutez des options|add extras/i })).toBeVisible()
    await expect(page.getByText(/YD-/)).toHaveCount(0)
    await captureProof(page, "drive", `sheet-wizard-${testInfo.project.name}`)

    await gotoFr(page, `/drive/vehicules/veh-inconnu?${dailySearch}`)
    await expect(page.getByRole("heading", { name: /introuvable|not found/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /réserver|book/i })).toHaveCount(0)
    await captureProof(page, "drive", `sheet-missing-${testInfo.project.name}`)

    await gotoFr(page, `/drive/vehicules/veh-suv-2?${dailySearch}`)
    await expect(page.getByRole("heading", { level: 1, name: "Cadillac Escalade" })).toBeVisible()
    await expect(page.getByRole("button", { name: /indisponible|unavailable/i })).toBeDisabled()
    await captureProof(page, "drive", `sheet-unavailable-${testInfo.project.name}`)

    await gotoFr(page, "/drive/vehicules/veh-berline-1")
    await expect(page.getByText(/complétez la recherche|complete the search/i)).toBeVisible()
    await expect(page.getByText(/450[\s\u202f\u00a0]000/)).toHaveCount(0)
    await expect(page.getByRole("link", { name: /compléter la recherche|complete the search/i })).toBeVisible()
    await captureProof(page, "drive", `sheet-incomplete-${testInfo.project.name}`)

    await gotoFr(page, `/drive/vehicules/veh-berline-1?${withSearch(dailySearch, "passengers", "abc")}`)
    await expect(page.getByRole("alert")).toContainText(/passager|passenger/i)
    await expect(page.getByRole("button", { name: /réserver|book/i })).toHaveCount(0)

    await page.route("**/*mercedes-benz-e-class*", (route) => route.abort())
    await gotoFr(page, `/drive/vehicules/veh-berline-1?${dailySearch}`)
    await expect(page.getByText(/n'a pas pu être affichée|could not be displayed/i)).toBeVisible()
    await page.unroute("**/*mercedes-benz-e-class*")

    await gotoFr(page, `/drive/vehicules/veh-berline-1?${dailySearch}`)
    const english = page.getByRole("group", { name: /langue|language/i }).getByRole("button", { name: "en", exact: true })
    if (await english.isVisible()) await english.click()
    else {
      await page.getByRole("button", { name: /ouvrir le menu|open menu/i }).click()
      await page.locator("#mobile-menu").getByRole("button", { name: "en", exact: true }).click()
    }
    await expect(page).toHaveURL(/\/en\/drive\/vehicules\/veh-berline-1/)
    await expect(page).toHaveURL(/passengers=1/)
    await expect(page.getByRole("heading", { level: 1, name: "Mercedes-Benz E-Class" })).toBeVisible()
    await assertNoHorizontalOverflow(page)

    if (testInfo.project.name === "desktop-1440") {
      for (const width of [375, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/fr/drive/vehicules/veh-berline-1?${dailySearch}`)
        await assertNoHorizontalOverflow(page)
        const action = page.getByRole("complementary", { name: /récapitulatif|summary/i }).getByRole("button", { name: /continuer|continue/i })
        await action.scrollIntoViewIfNeeded()
        await expect(action).toBeVisible()
        const actionBox = await action.boundingBox()
        expect(actionBox && actionBox.y >= 0 && actionBox.y + actionBox.height <= 901).toBe(true)
        await captureProof(page, "drive", `sheet-w${width}`)
      }
      await page.setViewportSize({ width: 1440, height: 900 })
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