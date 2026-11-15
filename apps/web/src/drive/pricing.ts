import type { PriceInput } from "./types"

/** Inclusive calendar days between two local dates (min 1). */
export function durationDays(startAt: Date, endAt: Date): number {
  const start = Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate())
  const end = Date.UTC(endAt.getFullYear(), endAt.getMonth(), endAt.getDate())
  const days = Math.floor((end - start) / 86_400_000) + 1
  return Math.max(1, days)
}

/**
 * Deterministic demo pricing in FCFA.
 * Daily chauffeur hire: dailyRate × days.
 * Immediate / scheduled trip: tripRate (flat), independent of day count.
 */
export function calculateDrivePrice(input: PriceInput): { days: number; priceFcfa: number } {
  const days = durationDays(input.startAt, input.endAt)
  if (input.service === "chauffeur_daily") {
    return { days, priceFcfa: input.vehicle.dailyRateFcfa * days }
  }
  return { days: 1, priceFcfa: input.vehicle.tripRateFcfa }
}
