import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createServer } from "vite"

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" })
const catalog = await server.ssrLoadModule("/src/drive/catalog.ts")
const search = await server.ssrLoadModule("/src/drive/search.ts")
const pricing = await server.ssrLoadModule("/src/drive/pricing.ts")
await server.close()

const vehicles = catalog.DEMO_VEHICLES
assert.equal(vehicles.length, 50)
const ids = new Set(vehicles.map((vehicle) => vehicle.id))
assert.equal(ids.size, 50)
const pairs = new Set(vehicles.map((vehicle) => `${vehicle.brand}|${vehicle.model}`))
assert.equal(pairs.size, 50)
for (const vehicle of vehicles) {
  assert.ok(vehicle.name)
  assert.ok(vehicle.category)
  assert.ok(vehicle.partnerId)
  assert.ok(vehicle.imageSrc)
  assert.equal(vehicle.demo, true)
}
const images = vehicles.map((vehicle) => vehicle.imageSrc)
assert.equal(new Set(images).size, images.length)

const sources = JSON.parse(await readFile(new URL("./image-sources.json", import.meta.url), "utf8"))
assert.equal(sources.length, 50)
for (const source of sources) {
  assert.equal(source.status, "verified")
  assert.ok(source.license)
  assert.ok(source.sourceUrl)
}

const corolla = vehicles.find((vehicle) => vehicle.id === "veh-berline-1")
const priced = pricing.calculateDrivePrice({
  service: "chauffeur_daily",
  vehicle: corolla,
  startAt: new Date(2026, 10, 20, 10),
  endAt: new Date(2026, 10, 22, 10),
})
assert.equal(priced.priceFcfa, 450000)

const filters = { ...search.defaultFilters(), brand: "Mercedes-Benz", provider: "yamoo", category: "berline" }
const matches = search.listBrowseVehicles(vehicles, filters, { passengers: null, luggage: null }, null, (category) => category)
assert.ok(matches.every((vehicle) => vehicle.brand === "Mercedes-Benz" && vehicle.partnerId === "yamoo" && vehicle.category === "berline"))
assert.ok(matches.length >= 1)

console.log("catalog.check ok")
