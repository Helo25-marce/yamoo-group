import type { DriveServiceKind } from "./types"

/** Fields the current wizard already validates. Future services stay inactive. */
export type DriveTripField = "start" | "end" | "pickup" | "dropoff" | "passengers"

export type DriveServiceProfile = {
  id: DriveServiceKind
  active: true
  required: readonly DriveTripField[]
}

/**
 * Only the three services already sold in the demo wizard.
 * Airport, ceremony, business, intercity and custom requests are not active.
 */
export const ACTIVE_SERVICES: readonly DriveServiceProfile[] = [
  { id: "chauffeur_daily", active: true, required: ["start", "end", "passengers"] },
  { id: "chauffeur_now", active: true, required: ["start", "pickup", "dropoff", "passengers"] },
  { id: "chauffeur_later", active: true, required: ["start", "pickup", "dropoff", "passengers"] },
]

export function serviceProfile(id: DriveServiceKind): DriveServiceProfile {
  const profile = ACTIVE_SERVICES.find((item) => item.id === id)
  if (!profile) throw new Error("INACTIVE_SERVICE")
  return profile
}

export function serviceNeedsRoute(id: DriveServiceKind): boolean {
  const required = serviceProfile(id).required
  return required.includes("pickup") && required.includes("dropoff")
}
