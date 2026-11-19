import type { DriveBooking, DrivePromo, DriveVehicle } from "./types"

export const EXTRAS = [
  { id: "baby", amountFcfa: 8_000 },
  { id: "child", amountFcfa: 8_000 },
  { id: "booster", amountFcfa: 8_000 },
  { id: "welcome", amountFcfa: 10_000 },
  { id: "luggage", amountFcfa: 5_000 },
  { id: "stop", amountFcfa: 7_000 },
] as const

export type ExtraId = (typeof EXTRAS)[number]["id"]
export type ExtraQty = Record<ExtraId, number>

export const FULL_COVER_FCFA = 12_000

export function emptyExtras(): ExtraQty {
  return { baby: 0, child: 0, booster: 0, welcome: 0, luggage: 0, stop: 0 }
}

export function extrasTotal(qty: ExtraQty): number {
  return EXTRAS.reduce((sum, extra) => sum + extra.amountFcfa * (qty[extra.id] ?? 0), 0)
}

export function promoDiscount(baseFcfa: number, promo: DrivePromo | null): number {
  if (!promo || !promo.active) return 0
  if (promo.kind === "percent") return Math.min(baseFcfa, Math.round((baseFcfa * promo.value) / 100))
  return Math.min(baseFcfa, promo.value)
}

export function quoteCheckout(input: {
  baseFcfa: number
  qty: ExtraQty
  protection: "basic" | "full"
  promo: DrivePromo | null
}) {
  const discountFcfa = promoDiscount(input.baseFcfa, input.promo)
  const coverFcfa = input.protection === "full" ? FULL_COVER_FCFA : 0
  const extrasFcfa = extrasTotal(input.qty)
  const payNowFcfa = Math.max(0, input.baseFcfa - discountFcfa) + coverFcfa
  const payPickupFcfa = extrasFcfa
  return {
    discountFcfa,
    coverFcfa,
    extrasFcfa,
    payNowFcfa,
    payPickupFcfa,
    totalFcfa: payNowFcfa + payPickupFcfa,
  }
}

export function findPromo(promos: readonly DrivePromo[], code: string): DrivePromo | null {
  const needle = code.trim().toUpperCase()
  if (!needle) return null
  return promos.find((promo) => promo.code.toUpperCase() === needle && promo.active) ?? null
}

/** A pending or confirmed booking blocks the same vehicle on overlapping dates. */
export function vehicleHeld(vehicleId: string, startAt: string, endAt: string, bookings: readonly DriveBooking[]): boolean {
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  return bookings.some((booking) => {
    if (booking.vehicleId !== vehicleId) return false
    if (booking.status === "cancelled" || booking.status === "refused" || booking.status === "completed") return false
    const from = new Date(booking.startAt).getTime()
    const to = new Date(booking.endAt).getTime()
    return from < end && start < to
  })
}

export function luhnOk(digits: string): boolean {
  const clean = digits.replace(/\s+/g, "")
  if (!/^\d{13,19}$/.test(clean)) return false
  let sum = 0
  let alt = false
  for (let i = clean.length - 1; i >= 0; i -= 1) {
    let n = Number(clean[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function cardLast4(digits: string): string {
  const clean = digits.replace(/\s+/g, "")
  return clean.slice(-4)
}

export function partnerName(vehicle: DriveVehicle, partners: readonly { id: string; name: string }[]): string {
  return partners.find((partner) => partner.id === vehicle.partnerId)?.name ?? "YAMOO Drive"
}
