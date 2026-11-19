import type { DriveVehicle, DriveVehicleFacts, DriveVehicleImage } from "./types"

const FACT_KEYS = [
  "transmission",
  "fuel",
  "airConditioning",
  "mileagePolicy",
  "insurance",
  "deposit",
  "cancellation",
  "modification",
] as const

export type DriveVehicleFactKey = (typeof FACT_KEYS)[number]

export function galleryFrames(vehicle: Pick<DriveVehicle, "imageSrc" | "images">): DriveVehicleImage[] {
  const listed = (vehicle.images ?? []).filter((image) => image.src.trim())
  if (listed.length > 0) return listed
  if (vehicle.imageSrc.trim()) return [{ src: vehicle.imageSrc, demo: true }]
  return []
}

export function moveGallery(index: number, delta: number, count: number): number {
  if (count <= 1) return 0
  const next = index + delta
  if (next < 0) return count - 1
  if (next >= count) return 0
  return next
}

export function presentFacts(facts: DriveVehicleFacts | undefined): Array<{ key: DriveVehicleFactKey; value: string }> {
  if (!facts) return []
  return FACT_KEYS.flatMap((key) => {
    const value = facts[key]?.trim()
    if (!value) return []
    return [{ key, value }]
  })
}
