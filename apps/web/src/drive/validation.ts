import { serviceNeedsRoute } from "./services"
import type { DriveServiceKind } from "./types"

export type DriveIssue =
  | "drive.err.dates"
  | "drive.err.range"
  | "drive.err.places"
  | "drive.err.passengers"
  | "drive.err.contact"
  | "drive.err.email"

/** Same rules as the existing wizard. Centralised so later screens reuse them. */
export function tripIssue(input: {
  service: DriveServiceKind
  startAt: string
  endAt: string
  pickup: string
  dropoff: string
  passengers: number
}): DriveIssue | null {
  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "drive.err.dates"
  if (input.service === "chauffeur_daily" && end < start) return "drive.err.range"
  if (serviceNeedsRoute(input.service) && (!input.pickup.trim() || !input.dropoff.trim())) return "drive.err.places"
  if (input.passengers < 1 || input.passengers > 8) return "drive.err.passengers"
  return null
}

export function contactIssue(input: { name: string; phone: string; email: string }): DriveIssue | null {
  if (!input.name.trim() || !input.email.trim() || !input.phone.trim()) return "drive.err.contact"
  if (!input.email.includes("@")) return "drive.err.email"
  return null
}
