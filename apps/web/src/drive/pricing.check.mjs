import assert from "node:assert/strict"

/** Mirrors pricing.ts for a zero-dep smoke check. */
function durationDays(startAt, endAt) {
  const start = Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate())
  const end = Date.UTC(endAt.getFullYear(), endAt.getMonth(), endAt.getDate())
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1)
}

function calculateDrivePrice(input) {
  const days = durationDays(input.startAt, input.endAt)
  if (input.service === "chauffeur_daily") {
    return { days, priceFcfa: input.vehicle.dailyRateFcfa * days }
  }
  return { days: 1, priceFcfa: input.vehicle.tripRateFcfa }
}

const vehicle = { dailyRateFcfa: 85_000, tripRateFcfa: 25_000 }
const start = new Date("2026-11-15T10:00:00")
const end = new Date("2026-11-17T10:00:00")

assert.deepEqual(
  calculateDrivePrice({ service: "chauffeur_daily", vehicle, startAt: start, endAt: end }),
  { days: 3, priceFcfa: 255_000 },
)
assert.deepEqual(
  calculateDrivePrice({ service: "chauffeur_now", vehicle, startAt: start, endAt: end }),
  { days: 1, priceFcfa: 25_000 },
)
assert.deepEqual(
  calculateDrivePrice({ service: "chauffeur_later", vehicle, startAt: start, endAt: start }),
  { days: 1, priceFcfa: 25_000 },
)

const transitions = {
  pending: { client: ["cancelled"], admin: ["confirmed", "refused"] },
  confirmed: { client: ["cancelled"], admin: ["completed", "cancelled"] },
}
assert.ok(transitions.pending.admin.includes("confirmed"))
assert.ok(!transitions.pending.client.includes("confirmed"))

console.log("drive pricing + status checks OK")
