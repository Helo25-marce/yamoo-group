import assert from "node:assert/strict"
import { createServer } from "vite"

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
})

const search = await server.ssrLoadModule("/src/drive/search.ts")
await server.close()

const vehicles = [
  { id: "b", name: "Berline", category: "berline", seats: 3, luggage: 2, available: true, dailyRateFcfa: 85_000, tripRateFcfa: 25_000, demo: true, imageSrc: "" },
  { id: "a", name: "Autre", category: "berline", seats: 3, luggage: 2, available: true, dailyRateFcfa: 85_000, tripRateFcfa: 25_000, demo: true, imageSrc: "" },
  { id: "v", name: "Van", category: "van", seats: 7, luggage: 6, available: false, dailyRateFcfa: 130_000, tripRateFcfa: 45_000, demo: true, imageSrc: "" },
]

const criteria = {
  service: "chauffeur_now",
  startAt: "2026-11-20T10:00",
  endAt: "2026-11-20T10:00",
  pickup: "Douala",
  dropoff: "Yaoundé",
  passengers: 1,
  luggage: 0,
}
const filters = { category: "all", query: "", showUnavailable: false, sort: "price-asc" }
const ranked = search.listMatchingVehicles(vehicles, criteria, filters, (category) => category)
assert.deepEqual(ranked.map((item) => item.id), ["a", "b"])

const daily = search.toCriteria({
  service: "chauffeur_daily",
  startAt: "2026-11-20T10:00",
  endAt: "2026-11-22T10:00",
  pickup: "",
  dropoff: "",
  passengers: "1",
  luggage: "0",
})
assert.equal(search.vehicleQuote(daily, vehicles[0]).priceFcfa, 255_000)
assert.equal(search.vehicleQuote({ ...daily, service: "chauffeur_now", endAt: daily.startAt }, vehicles[0]).priceFcfa, 25_000)

const invalid = search.parseResults(new URLSearchParams("service=yacht&start=2026-11-20T10:00&passengers=1&luggage=0"), vehicles)
assert.equal(invalid.query, null)
assert.ok(invalid.errors.includes("drive.err.service"))

const priced = search.parseResults(
  new URLSearchParams("service=chauffeur_now&start=2026-11-20T10:00&pickup=Douala&dropoff=Yaounde&passengers=1&luggage=0&price=1"),
  vehicles,
)
assert.equal(priced.query.criteria.service, "chauffeur_now")
assert.ok(priced.warnings.includes("drive.err.price"))
assert.equal(search.buildWizardSearch(priced.query.criteria, "b").includes("price="), false)

const fresh = search.resolveWizardEntry(new URLSearchParams(), vehicles)
assert.equal(fresh.kind, "fresh")

const blocked = search.resolveWizardEntry(
  new URLSearchParams("service=chauffeur_now&start=2026-11-20T10:00&pickup=Douala&dropoff=Yaounde&passengers=1&luggage=0&vehicle=v"),
  vehicles,
)
assert.equal(blocked.step, "vehicle")
assert.equal(blocked.vehicleId, null)
assert.equal(blocked.error, "drive.err.unavailable")
assert.equal(blocked.passengers, "1")

const malformed = search.resolveWizardEntry(
  new URLSearchParams("service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=abc&luggage=0&vehicle=b&price=9"),
  vehicles,
)
assert.equal(malformed.step, "trip")
assert.equal(malformed.passengers, "abc")
assert.equal(malformed.luggage, "0")
assert.equal(malformed.vehicleId, null)
assert.equal(malformed.error, "drive.err.passengers")
assert.notEqual(malformed.step, "contact")

const bags = search.resolveWizardEntry(
  new URLSearchParams("service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=2&luggage=xx&vehicle=b"),
  vehicles,
)
assert.equal(bags.step, "trip")
assert.equal(bags.luggage, "xx")
assert.equal(bags.error, "drive.err.luggage")

const badDate = search.resolveWizardEntry(
  new URLSearchParams("service=chauffeur_daily&start=nope&end=2026-11-22T10:00&passengers=1&luggage=0&vehicle=b"),
  vehicles,
)
assert.equal(badDate.step, "trip")
assert.equal(badDate.startAt, "")
assert.equal(badDate.error, "drive.err.dates")

const handed = search.resolveWizardEntry(
  new URLSearchParams("service=chauffeur_daily&start=2026-11-20T10:00&end=2026-11-22T10:00&passengers=1&luggage=0&vehicle=b"),
  vehicles,
)
assert.equal(handed.step, "contact")
assert.equal(handed.passengers, "1")
assert.equal(handed.vehicleId, "b")
assert.equal(handed.error, null)

console.log("drive search checks OK")
