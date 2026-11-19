import type { DriveVehicle, DriveVehicleCategory } from "./types"

/**
 * Facet engine for the self-drive families.
 * Different families combine with AND. Options of one family combine with:
 * - "any": OR (the vehicle has at least one checked value);
 * - "all": AND (the offer must include every checked item: extras, equipment);
 * - "min": threshold (score at least the lowest checked threshold).
 * A vehicle whose value is unknown (null) never matches and is never counted.
 */
export type FacetKey =
  | "pickupmode"
  | "transmission"
  | "promo"
  | "mileage"
  | "extras"
  | "dailyband"
  | "rating"
  | "payment"
  | "features"
  | "fuel"
  | "deposit"
  | "fuelpolicy"

export type FacetSelection = Partial<Record<FacetKey, string[]>>

type FacetMode = "any" | "all" | "min"

export type FacetFamily = {
  key: FacetKey
  mode: FacetMode
  /** Why the family can stay pending: demo specs, provider contract, or verified reviews. */
  source: "specs" | "offer" | "reviews"
  baseOptions: readonly string[]
  values: (vehicle: DriveVehicle, today: string) => readonly string[] | null
}

/** Interface thresholds for the demo, not official YAMOO tariffs. Lower bound inclusive. */
export const DAILY_BANDS = [
  { id: "lt25", min: 0, max: 25_000 },
  { id: "25-50", min: 25_000, max: 50_000 },
  { id: "50-75", min: 50_000, max: 75_000 },
  { id: "75-100", min: 75_000, max: 100_001 },
  { id: "gt100", min: 100_001, max: Number.POSITIVE_INFINITY },
] as const

/** Filtering buckets for the provider deposit, not contractual amounts. */
export const DEPOSIT_BANDS = [
  { id: "0-150", min: 0, max: 150_001 },
  { id: "150-300", min: 150_001, max: 300_001 },
  { id: "gt300", min: 300_001, max: Number.POSITIVE_INFINITY },
] as const

export const SEAT_THRESHOLDS = [4, 5, 6] as const
export const LUGGAGE_THRESHOLDS = [1, 2, 3, 4, 5] as const
export const RATING_THRESHOLDS = ["8", "7"] as const
export const BASE_EXTRAS = ["additional_driver", "baby_seat", "booster_seat", "child_seat", "gps"] as const

/** Explicit mapping between the existing catalogue categories and the target categories. */
export const CATEGORY_TARGETS: ReadonlyArray<{ id: string; from: readonly DriveVehicleCategory[] }> = [
  { id: "small", from: [] },
  { id: "medium", from: [] },
  { id: "large", from: ["berline"] },
  { id: "estate", from: [] },
  { id: "prestige", from: ["prestige"] },
  { id: "minivan", from: ["van"] },
  { id: "suv", from: ["suv"] },
  { id: "convertible", from: [] },
  { id: "pickup", from: ["pickup"] },
]

function bandOf(bands: ReadonlyArray<{ id: string; min: number; max: number }>, amount: number): string | null {
  return bands.find((band) => amount >= band.min && amount < band.max)?.id ?? null
}

export function promotionActive(vehicle: DriveVehicle, today: string): boolean {
  const promo = vehicle.selfDrive?.promotion
  if (!promo) return false
  return promo.discountedDailyFcfa < promo.referenceDailyFcfa && promo.validFrom <= today && today <= promo.validTo
}

export const FACET_FAMILIES: readonly FacetFamily[] = [
  {
    key: "pickupmode",
    mode: "any",
    source: "offer",
    baseOptions: ["airport_terminal", "airport_shuttle", "city_agency", "delivery"],
    values: (vehicle) => vehicle.selfDrive?.pickupModes ?? null,
  },
  {
    key: "transmission",
    mode: "any",
    source: "specs",
    baseOptions: ["automatic", "manual"],
    values: (vehicle) => (vehicle.specs?.transmission ? [vehicle.specs.transmission] : null),
  },
  {
    key: "promo",
    mode: "any",
    source: "offer",
    baseOptions: ["discount"],
    values: (vehicle, today) => (vehicle.selfDrive ? (promotionActive(vehicle, today) ? ["discount"] : []) : null),
  },
  {
    key: "mileage",
    mode: "any",
    source: "offer",
    baseOptions: ["limited", "unlimited"],
    values: (vehicle) => {
      const mileage = vehicle.selfDrive?.mileage
      if (!mileage) return null
      if (mileage.kind === "unlimited" && !mileage.rule.trim()) return null
      return [mileage.kind]
    },
  },
  {
    key: "extras",
    mode: "all",
    source: "offer",
    baseOptions: BASE_EXTRAS,
    values: (vehicle) => {
      const extras = vehicle.selfDrive?.extras
      if (!extras) return null
      return extras.filter((extra) => extra.onQuote || typeof extra.priceFcfa === "number").map((extra) => extra.id)
    },
  },
  {
    key: "dailyband",
    mode: "any",
    source: "offer",
    baseOptions: DAILY_BANDS.map((band) => band.id),
    values: (vehicle) => {
      const rate = vehicle.selfDrive?.dailyRateFcfa
      if (typeof rate !== "number") return null
      const band = bandOf(DAILY_BANDS, rate)
      return band ? [band] : null
    },
  },
  {
    key: "rating",
    mode: "min",
    source: "reviews",
    baseOptions: RATING_THRESHOLDS,
    values: (vehicle) => (vehicle.rating?.verified && vehicle.rating.count > 0 ? [String(vehicle.rating.score10)] : null),
  },
  {
    key: "payment",
    mode: "any",
    source: "offer",
    baseOptions: ["now", "pickup"],
    values: (vehicle) => vehicle.selfDrive?.paymentTimings ?? null,
  },
  {
    key: "features",
    mode: "all",
    source: "specs",
    baseOptions: ["air_conditioning", "four_plus_doors"],
    values: (vehicle) => vehicle.specs?.features ?? null,
  },
  {
    key: "fuel",
    mode: "any",
    source: "specs",
    baseOptions: ["electric", "hybrid", "plugin_hybrid", "petrol", "diesel"],
    values: (vehicle) => (vehicle.specs?.fuel ? [vehicle.specs.fuel] : null),
  },
  {
    key: "deposit",
    mode: "any",
    source: "offer",
    baseOptions: DEPOSIT_BANDS.map((band) => band.id),
    values: (vehicle) => {
      const deposit = vehicle.selfDrive?.depositFcfa
      if (typeof deposit !== "number") return null
      const band = bandOf(DEPOSIT_BANDS, deposit)
      return band ? [band] : null
    },
  },
  {
    key: "fuelpolicy",
    mode: "any",
    source: "offer",
    baseOptions: ["same_level", "full_to_full", "other"],
    values: (vehicle) => (vehicle.selfDrive?.fuelPolicy ? [vehicle.selfDrive.fuelPolicy.kind] : null),
  },
]

export const FACET_KEYS = FACET_FAMILIES.map((family) => family.key)

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function familyOf(key: FacetKey): FacetFamily {
  return FACET_FAMILIES.find((family) => family.key === key)!
}

/** Options = configured options plus extra ids configured on offers. */
export function familyOptions(family: FacetFamily, vehicles: readonly DriveVehicle[], today = todayIso()): string[] {
  const options = [...family.baseOptions]
  if (family.key === "extras") {
    for (const vehicle of vehicles) {
      for (const id of family.values(vehicle, today) ?? []) if (!options.includes(id)) options.push(id)
    }
  }
  return options
}

/** A family is usable only when at least one vehicle carries real data for it. */
export function familyHasData(family: FacetFamily, vehicles: readonly DriveVehicle[], today = todayIso()): boolean {
  return vehicles.some((vehicle) => family.values(vehicle, today) !== null)
}

export function matchesFamily(vehicle: DriveVehicle, family: FacetFamily, selected: readonly string[], today: string): boolean {
  if (selected.length === 0) return true
  const values = family.values(vehicle, today)
  if (values === null) return false
  if (family.mode === "all") return selected.every((option) => values.includes(option))
  if (family.mode === "min") {
    const floor = Math.min(...selected.map(Number))
    return values.some((value) => Number(value) >= floor)
  }
  return selected.some((option) => values.includes(option))
}

export function matchesFacets(vehicle: DriveVehicle, selection: FacetSelection | undefined, today = todayIso()): boolean {
  if (!selection) return true
  for (const family of FACET_FAMILIES) {
    const selected = selection[family.key]
    if (selected && selected.length > 0 && !matchesFamily(vehicle, family, selected, today)) return false
  }
  return true
}

/** Selection used to count one option: OR families replace, AND families add. */
export function selectionWith(selection: FacetSelection, key: FacetKey, option: string): FacetSelection {
  const family = familyOf(key)
  const current = selection[key] ?? []
  const next = family.mode === "all" ? [...new Set([...current, option])] : [option]
  return { ...selection, [key]: next }
}

export function toggleOption(selection: FacetSelection, key: FacetKey, option: string): FacetSelection {
  const current = selection[key] ?? []
  const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
  const copy = { ...selection }
  if (next.length > 0) copy[key] = next
  else delete copy[key]
  return copy
}

export type FacetParse = { selection: FacetSelection; ignored: FacetKey[]; invalid: FacetKey[] }

/** Unknown values are dropped. Families without catalogue data are ignored and reported. */
export function parseFacets(params: URLSearchParams, vehicles: readonly DriveVehicle[], today = todayIso()): FacetParse {
  const selection: FacetSelection = {}
  const ignored: FacetKey[] = []
  const invalid: FacetKey[] = []
  for (const family of FACET_FAMILIES) {
    const raw = params.get(family.key)
    if (!raw) continue
    const options = familyOptions(family, vehicles, today)
    const asked = [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 12)
    const kept = asked.filter((item) => options.includes(item))
    if (kept.length < asked.length) invalid.push(family.key)
    if (kept.length === 0) continue
    if (!familyHasData(family, vehicles, today)) {
      ignored.push(family.key)
      continue
    }
    selection[family.key] = kept
  }
  return { selection, ignored, invalid }
}

export function writeFacets(params: URLSearchParams, selection: FacetSelection | undefined) {
  if (!selection) return
  for (const family of FACET_FAMILIES) {
    const selected = selection[family.key]
    if (selected && selected.length > 0) params.set(family.key, selected.join(","))
  }
}

export function facetCount(selection: FacetSelection | undefined): number {
  if (!selection) return 0
  return Object.values(selection).reduce((total, list) => total + (list?.length ?? 0), 0)
}
