import path from "node:path"
import { expect, test } from "@playwright/test"
import { assertImagesLoaded, assertNoHorizontalOverflow, gotoFr, shotRoot } from "./helpers"

const shot = (name: string) => path.join(shotRoot, "universes", `${name}.png`)

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

test.describe("Univers — passe 1", () => {
  test("DRIVE: 50 véhicules paginés par 10", async ({ page }, testInfo) => {
    await gotoFr(page, "/drive")
    await expect(page.getByText(/10 véhicule\(s\) affiché\(s\) sur 50/)).toBeVisible()
    await expect(page.locator(".drive-offer")).toHaveCount(10)
    await page.screenshot({ path: shot(`drive-${testInfo.project.name}`) })
    await page.locator(".drive-pager").getByRole("button", { name: /^afficher plus$/i }).click()
    await expect(page.locator(".drive-offer")).toHaveCount(20)
    await expect(page.getByText(/20 véhicule\(s\) affiché\(s\) sur 50/)).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })

  test("MEDIA: accueil, portfolio filtré, devis enregistré", async ({ page }, testInfo) => {
    await gotoFr(page, "/media")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await assertImagesLoaded(page)
    await page.screenshot({ path: shot(`media-${testInfo.project.name}`) })
    await expect(page.getByRole("heading", { name: "Expertises" })).toBeVisible()
    await expect(page.locator(".yx-project img")).toHaveCount(6)
    await page.locator("#portfolio").scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -80))
    await expect(page.locator(".yx-project img").first()).toHaveJSProperty("complete", true)
    await page.waitForTimeout(600)
    await page.screenshot({ path: shot(`media-portfolio-${testInfo.project.name}`) })

    await page.getByRole("group", { name: "Portfolio" }).getByRole("button", { name: "Production vidéo" }).click()
    await expect(page.locator(".yx-project")).toHaveCount(1)

    const form = page.locator("#devis form")
    await form.getByRole("button", { name: /envoyer la demande/i }).click()
    await expect(form.getByText("Corrigez les champs signalés.")).toBeVisible()

    await form.locator("label", { hasText: "Photographie" }).click()
    await expect(form.getByRole("radio", { name: "Photographie" })).toBeChecked()
    await form.getByLabel("Type de séance").selectOption("Portrait")
    await form.getByLabel("Nom complet").fill("Awa Demo")
    await form.getByLabel("Téléphone").fill("6 77 00 00 00")
    await form.getByLabel("E-mail").fill("awa@example.cm")
    await form.getByLabel("Ville").fill("Douala")
    await form.getByLabel("Date souhaitée").fill(futureDate(20))
    await form.getByLabel("Description du projet").fill("Portraits de l'équipe pour notre site internet.")
    await form.getByRole("button", { name: /envoyer la demande/i }).click()

    const done = page.locator("#devis [role=status]")
    await expect(done).toContainText(/YM-\d{8}-[A-Z0-9]{4}/)
    await expect(done).toContainText("Aucun devis n'a été émis")
    await expect(page.getByRole("heading", { name: "Mes demandes sur cet appareil" })).toBeVisible()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("yamoo.media.v1") || "{}"))
    expect(stored.requests).toHaveLength(1)
    await assertNoHorizontalOverflow(page)
  })

  test("TRAVEL: recherche, filtres, fiche et demande", async ({ page }, testInfo) => {
    await gotoFr(page, "/travel")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await assertImagesLoaded(page)
    await page.screenshot({ path: shot(`travel-${testInfo.project.name}`) })
    await page.locator("#travel-destinations-title").evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90))
    await page.waitForTimeout(1200)
    await page.screenshot({ path: shot(`travel-offers-${testInfo.project.name}`) })

    const search = page.locator("#travel-search")
    await search.getByLabel("Destination").fill("Kribi")
    await search.getByRole("button", { name: "Rechercher" }).click()
    await expect(page).toHaveURL(/q=Kribi/)
    await expect(page.locator(".yx-offer")).toHaveCount(1)
    await expect(page.locator(".yx-offer img")).toHaveCount(1)
    await expect(page.getByText("185 000 FCFA").first()).toBeVisible()

    await page.goto(page.url().replace(/\?.*$/, "?type=circuit"))
    await expect(page.locator(".yx-offer")).toHaveCount(2)
    await page.goto(page.url().replace(/\?.*$/, ""))

    await page.getByRole("button", { name: "Voir le voyage" }).first().click()
    await expect(page).toHaveURL(/offre=/)
    await expect(page.getByRole("heading", { name: "Programme" })).toBeVisible()
    await page.getByRole("button", { name: "Demander ce voyage" }).click()

    const form = page.locator("#sur-mesure form")
    await form.getByLabel("Date de départ").fill(futureDate(30))
    await form.getByLabel("Type d'expérience").selectOption({ index: 1 })
    await form.getByLabel("Nom complet").fill("Paul Demo")
    await form.getByLabel("Téléphone").fill("+237 699 00 00 00")
    await form.getByLabel("E-mail").fill("paul@example.cm")
    await form.getByRole("button", { name: /envoyer la demande/i }).click()

    const done = page.locator("#sur-mesure [role=status]")
    await expect(done).toContainText(/YT-\d{8}-[A-Z0-9]{4}/)
    await expect(done).toContainText("Aucun voyage n'est réservé")
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("yamoo.travel.v1") || "{}"))
    expect(stored.requests).toHaveLength(1)
    await assertNoHorizontalOverflow(page)

    await page.goto("/en/travel")
    await expect(page.locator("#travel-search").getByRole("button", { name: "Search" })).toBeVisible()
    await page.goto("/en/media")
    await expect(page.getByRole("heading", { name: "Request a quote" })).toBeVisible()
  })
})
