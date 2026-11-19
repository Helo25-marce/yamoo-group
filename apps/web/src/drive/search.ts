import { FACET_KEYS, matchesFacets, parseFacets, writeFacets, type FacetSelection } from "./filters"
import { calculateDrivePrice } from "./pricing"
import { tripIssue, type DriveIssue } from "./validation"
import type { DriveServiceKind, DriveVehicle, DriveVehicleCategory } from "./types"

/** Explicit results URL. No personal data and no price. */
export const RESULT_KEYS = [
  "service",
  "start",
  "end",
  "pickup",
  "dropoff",
  "passengers",
  "luggage",
  "category",
  "brand",
  "provider",
  "priceband",
  "q",
  "sort",
  "unavailable",
  "compare",
  "vehicle",
  "price",
  ...FACET_KEYS,
] as const

export const SORT_KEYS = ["recommended", "price-asc", "price-desc", "seats-desc"] as const
export const CATEGORY_FILTERS = ["all", "berline", "suv", "van", "prestige", "pickup"] as const
export const SERVICES = ["chauffeur_daily", "chauffeur_now", "chauffeur_later"] as const

export type DriveSortKey = (typeof SORT_KEYS)[number]
export type DriveCategoryFilter = (typeof CATEGORY_FILTERS)[number]

export type DriveQueryError =
  | DriveIssue
  | "drive.err.service"
  | "drive.err.luggage"
  | "drive.err.category"
  | "drive.err.sort"
  | "drive.err.vehicle"
  | "drive.err.capacity"
  | "drive.err.unavailable"
  | "drive.err.incomplete"
  | "drive.err.params"
  | "drive.err.price"
  | "drive.err.compare"
  | "drive.err.query"
  | "drive.err.filterPending"
  | "drive.err.filterValue"

export type DriveSearchDraft = {
  service: string
  startAt: string
  endAt: string
  pickup: string
  dropoff: string
  passengers: string
  luggage: string
}

export type DriveSearchCriteria = {
  service: DriveServiceKind
  startAt: string
  endAt: string
  pickup: string
  dropoff: string
  passengers: number
  luggage: number
}

export type DriveResultFilters = {
  /** "all" or a comma list of catalogue categories (OR). */
  category: DriveCategoryFilter | (string & {})
  query: string
  showUnavailable: boolean
  sort: DriveSortKey
  brand: string
  /** Comma list of provider ids (OR). */
  provider: string
  priceBand: string
  facets?: FacetSelection
}

export function listOf(value: string | undefined): string[] {
  if (!value || value === "all") return []
  return value.split(",").filter(Boolean)
}

export type DriveResultQuery = {
  criteria: DriveSearchCriteria
  filters: DriveResultFilters
  compare: string[]
}

export type ParsedResults = {
  draft: DriveSearchDraft
  filters: DriveResultFilters
  compare: string[]
  query: DriveResultQuery | null
  errors: DriveQueryError[]
  warnings: DriveQueryError[]
}

export type WizardEntry =
  | { kind: "fresh" }
  | {
      kind: "prefill"
      step: "service" | "trip" | "vehicle" | "contact"
      service: DriveServiceKind | null
      startAt: string
      endAt: string
      pickup: string
      dropoff: string
      passengers: string
      luggage: string
      vehicleId: string | null
      error: DriveQueryError | null
      warning: DriveQueryError | null
    }

const LOCAL_DT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const MAX_TEXT = 120
const MAX_QUERY = 80

export function emptyDraft(): DriveSearchDraft {
  return { service: "", startAt: "", endAt: "", pickup: "", dropoff: "", passengers: "", luggage: "" }
}

export function defaultFilters(): DriveResultFilters {
  return { category: "all", query: "", showUnavailable: false, sort: "price-asc", brand: "", provider: "", priceBand: "", facets: {} }
}

export function isService(value: string): value is DriveServiceKind {
  return (SERVICES as readonly string[]).includes(value)
}

export function isSortKey(value: string): value is DriveSortKey {
  return (SORT_KEYS as readonly string[]).includes(value)
}

export function isCategoryFilter(value: string): value is DriveCategoryFilter {
  return (CATEGORY_FILTERS as readonly string[]).includes(value)
}

/** Rejects values the datetime control would silently rewrite. */
export function parseLocalDateTime(value: string): Date | null {
  const match = LOCAL_DT.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  if (date.getHours() !== hours || date.getMinutes() !== minutes) return null
  return date
}

function strictInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  return Number(value.trim())
}

/** Seat and bag filters. Empty fields do not filter. Invalid text is kept and reported. */
export function capacityFilter(draft: DriveSearchDraft): {
  passengers: number | null
  luggage: number | null
  error: DriveQueryError | null
} {
  let error: DriveQueryError | null = null
  let passengers: number | null = null
  let luggage: number | null = null
  if (draft.passengers.trim() !== "") {
    const value = strictInt(draft.passengers)
    if (value === null || value < 1 || value > 8) error = "drive.err.passengers"
    else passengers = value
  }
  if (draft.luggage.trim() !== "") {
    const value = strictInt(draft.luggage)
    if (value === null || value < 0 || value > 12) error = error ?? "drive.err.luggage"
    else luggage = value
  }
  return { passengers, luggage, error }
}

function duplicateError(params: URLSearchParams): DriveQueryError | null {
  for (const key of RESULT_KEYS) {
    if (params.getAll(key).length > 1) return "drive.err.params"
  }
  return null
}

function readDraft(params: URLSearchParams): DriveSearchDraft {
  return {
    service: params.get("service") ?? "",
    startAt: params.get("start") ?? "",
    endAt: params.get("end") ?? "",
    pickup: params.get("pickup") ?? "",
    dropoff: params.get("dropoff") ?? "",
    passengers: params.get("passengers") ?? "",
    luggage: params.get("luggage") ?? "",
  }
}

export function criteriaIssue(draft: DriveSearchDraft): DriveQueryError | null {
  if (!draft.service.trim() || !draft.startAt.trim() || draft.passengers.trim() === "" || draft.luggage.trim() === "") {
    return "drive.err.incomplete"
  }
  if (!isService(draft.service)) return "drive.err.service"
  if (draft.pickup.length > MAX_TEXT || draft.dropoff.length > MAX_TEXT) return "drive.err.places"
  const passengers = strictInt(draft.passengers)
  const luggage = strictInt(draft.luggage)
  if (luggage === null || luggage < 0 || luggage > 12) return "drive.err.luggage"
  const endAt = draft.service === "chauffeur_daily" ? draft.endAt : draft.startAt
  if (!parseLocalDateTime(draft.startAt) || (draft.service === "chauffeur_daily" && !parseLocalDateTime(draft.endAt))) {
    return "drive.err.dates"
  }
  return tripIssue({
    service: draft.service,
    startAt: draft.startAt,
    endAt,
    pickup: draft.pickup,
    dropoff: draft.dropoff,
    passengers: passengers ?? -1,
  })
}

export function toCriteria(draft: DriveSearchDraft): DriveSearchCriteria | null {
  if (criteriaIssue(draft)) return null
  if (!isService(draft.service)) return null
  const passengers = strictInt(draft.passengers)
  const luggage = strictInt(draft.luggage)
  if (passengers === null || luggage === null) return null
  return {
    service: draft.service,
    startAt: draft.startAt,
    endAt: draft.service === "chauffeur_daily" ? draft.endAt : draft.startAt,
    pickup: draft.pickup,
    dropoff: draft.dropoff,
    passengers,
    luggage,
  }
}

export function parseResults(params: URLSearchParams, vehicles: readonly DriveVehicle[]): ParsedResults {
  const draft = readDraft(params)
  const filters = defaultFilters()
  const errors: DriveQueryError[] = []
  const warnings: DriveQueryError[] = []
  const duplicate = duplicateError(params)
  if (duplicate) errors.push(duplicate)
  if (params.has("price")) warnings.push("drive.err.price")

  const categoryRaw = params.get("category")
  const categoryList = [...new Set((categoryRaw ?? "").split(",").filter(Boolean))]
  if (categoryList.length === 0 || categoryRaw === "all") filters.category = "all"
  else if (categoryList.every((item) => item !== "all" && isCategoryFilter(item))) filters.category = categoryList.join(",")
  else errors.push("drive.err.category")

  const sortRaw = params.get("sort")
  if (sortRaw === null || sortRaw === "") filters.sort = "price-asc"
  else if (isSortKey(sortRaw)) filters.sort = sortRaw
  else errors.push("drive.err.sort")

  const unavailableRaw = params.get("unavailable")
  if (unavailableRaw === null || unavailableRaw === "" || unavailableRaw === "0") filters.showUnavailable = false
  else if (unavailableRaw === "1") filters.showUnavailable = true
  else errors.push("drive.err.params")

  const query = params.get("q") ?? ""
  if (query.length > MAX_QUERY) errors.push("drive.err.query")
  else filters.query = query

  filters.brand = (params.get("brand") ?? "").slice(0, 40)
  filters.provider = [...new Set((params.get("provider") ?? "").split(",").map((item) => item.slice(0, 40)).filter(Boolean))]
    .slice(0, 12)
    .join(",")
  filters.priceBand = (params.get("priceband") ?? "").slice(0, 20)
  const facets = parseFacets(params, vehicles)
  filters.facets = facets.selection
  if (facets.ignored.length > 0) warnings.push("drive.err.filterPending")
  if (facets.invalid.length > 0) warnings.push("drive.err.filterValue")

  const compareRaw = params.get("compare") ?? ""
  const compare = compareRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const uniqueCompare = [...new Set(compare)]
  const known = new Set(vehicles.map((vehicle) => vehicle.id))
  if (uniqueCompare.length > 3 || uniqueCompare.some((id) => !known.has(id))) errors.push("drive.err.compare")

  const tripTouched = ["service", "start", "end", "pickup", "dropoff", "vehicle"].some((key) => params.has(key))
  if (!tripTouched) {
    if (unavailableRaw === null || unavailableRaw === "") filters.showUnavailable = true
    const capacity = capacityFilter(draft)
    if (capacity.error) errors.push(capacity.error)
    return { draft, filters, compare: uniqueCompare, query: null, errors, warnings }
  }
  const criteriaError = criteriaIssue(draft)
  if (criteriaError) errors.push(criteriaError)

  const criteria = errors.length === 0 ? toCriteria(draft) : null
  if (!criteria) {
    return { draft, filters, compare: uniqueCompare, query: null, errors, warnings }
  }
  return {
    draft,
    filters,
    compare: uniqueCompare,
    query: { criteria, filters, compare: uniqueCompare },
    errors,
    warnings,
  }
}

export function buildDraftSearch(draft: DriveSearchDraft, filters: DriveResultFilters, compare: string[]): string {
  const params = new URLSearchParams()
  if (draft.service) params.set("service", draft.service)
  if (draft.startAt) params.set("start", draft.startAt)
  if (draft.service === "chauffeur_daily" && draft.endAt) params.set("end", draft.endAt)
  if (draft.pickup.trim()) params.set("pickup", draft.pickup)
  if (draft.dropoff.trim()) params.set("dropoff", draft.dropoff)
  if (draft.passengers !== "") params.set("passengers", draft.passengers)
  if (draft.luggage !== "") params.set("luggage", draft.luggage)
  if (filters.category !== "all") params.set("category", filters.category)
  if (filters.brand) params.set("brand", filters.brand)
  if (filters.provider) params.set("provider", filters.provider)
  if (filters.priceBand) params.set("priceband", filters.priceBand)
  writeFacets(params, filters.facets)
  if (filters.query.trim()) params.set("q", filters.query.trim())
  if (filters.sort !== "price-asc") params.set("sort", filters.sort)
  if (filters.showUnavailable) params.set("unavailable", "1")
  if (compare.length > 0) params.set("compare", compare.join(","))
  return params.toString()
}

export function buildResultsSearch(query: DriveResultQuery): string {
  const params = new URLSearchParams()
  params.set("service", query.criteria.service)
  params.set("start", query.criteria.startAt)
  if (query.criteria.service === "chauffeur_daily") params.set("end", query.criteria.endAt)
  if (query.criteria.pickup.trim()) params.set("pickup", query.criteria.pickup.trim())
  if (query.criteria.dropoff.trim()) params.set("dropoff", query.criteria.dropoff.trim())
  params.set("passengers", String(query.criteria.passengers))
  params.set("luggage", String(query.criteria.luggage))
  if (query.filters.category !== "all") params.set("category", query.filters.category)
  if (query.filters.brand) params.set("brand", query.filters.brand)
  if (query.filters.provider) params.set("provider", query.filters.provider)
  if (query.filters.priceBand) params.set("priceband", query.filters.priceBand)
  writeFacets(params, query.filters.facets)
  if (query.filters.query.trim()) params.set("q", query.filters.query.trim())
  if (query.filters.sort !== "price-asc") params.set("sort", query.filters.sort)
  if (query.filters.showUnavailable) params.set("unavailable", "1")
  if (query.compare.length > 0) params.set("compare", query.compare.join(","))
  return params.toString()
}

export function buildWizardSearch(criteria: DriveSearchCriteria, vehicleId: string): string {
  const params = new URLSearchParams()
  params.set("service", criteria.service)
  params.set("start", criteria.startAt)
  if (criteria.service === "chauffeur_daily") params.set("end", criteria.endAt)
  if (criteria.pickup.trim()) params.set("pickup", criteria.pickup.trim())
  if (criteria.dropoff.trim()) params.set("dropoff", criteria.dropoff.trim())
  params.set("passengers", String(criteria.passengers))
  params.set("luggage", String(criteria.luggage))
  params.set("vehicle", vehicleId)
  return params.toString()
}

export function vehicleQuote(criteria: DriveSearchCriteria, vehicle: DriveVehicle): { days: number; priceFcfa: number } {
  return calculateDrivePrice({
    service: criteria.service,
    vehicle,
    startAt: parseLocalDateTime(criteria.startAt) ?? new Date(criteria.startAt),
    endAt: parseLocalDateTime(criteria.endAt) ?? new Date(criteria.endAt),
  })
}

export function vehicleFit(vehicle: DriveVehicle, criteria: DriveSearchCriteria): DriveQueryError | null {
  if (!vehicle.available) return "drive.err.unavailable"
  if (vehicle.seats < criteria.passengers || vehicle.luggage < criteria.luggage) return "drive.err.capacity"
  return null
}

export function priceBandOf(dailyRateFcfa: number): string {
  if (dailyRateFcfa < 100_000) return "0-100"
  if (dailyRateFcfa < 130_000) return "100-130"
  if (dailyRateFcfa < 160_000) return "130-160"
  return "160+"
}

export function listBrowseVehicles(
  vehicles: readonly DriveVehicle[],
  filters: DriveResultFilters,
  capacity: { passengers: number | null; luggage: number | null },
  criteria: DriveSearchCriteria | null,
  categoryLabel: (category: DriveVehicleCategory) => string,
): DriveVehicle[] {
  const needle = filters.query.trim().toLowerCase()
  const categories = listOf(filters.category)
  const providers = listOf(filters.provider)
  const ranked = vehicles
    .filter((vehicle) => (filters.showUnavailable ? true : vehicle.available))
    .filter((vehicle) => capacity.passengers === null || vehicle.seats >= capacity.passengers)
    .filter((vehicle) => capacity.luggage === null || vehicle.luggage >= capacity.luggage)
    .filter((vehicle) => categories.length === 0 || categories.includes(vehicle.category))
    .filter((vehicle) => (filters.brand ? vehicle.brand === filters.brand : true))
    .filter((vehicle) => providers.length === 0 || providers.some((id) => vehicle.partnerId === id || (vehicle.providerIds ?? []).includes(id)))
    .filter((vehicle) => (filters.priceBand ? priceBandOf(vehicle.dailyRateFcfa) === filters.priceBand : true))
    .filter((vehicle) => matchesFacets(vehicle, filters.facets))
    .filter((vehicle) => {
      if (!needle) return true
      const label = categoryLabel(vehicle.category).toLowerCase()
      const brand = (vehicle.brand ?? "").toLowerCase()
      const model = (vehicle.model ?? "").toLowerCase()
      return vehicle.name.toLowerCase().includes(needle) || vehicle.category.includes(needle) || label.includes(needle) || brand.includes(needle) || model.includes(needle)
    })
    .map((vehicle) => ({
      vehicle,
      price: criteria ? vehicleQuote(criteria, vehicle).priceFcfa : vehicle.dailyRateFcfa,
    }))

  ranked.sort((left, right) => {
    let diff = 0
    if (filters.sort === "recommended") {
      const asked = capacity.passengers ?? 1
      diff = Math.abs(left.vehicle.seats - asked) - Math.abs(right.vehicle.seats - asked)
      if (diff === 0) diff = left.price - right.price
    } else if (filters.sort === "seats-desc") diff = right.vehicle.seats - left.vehicle.seats
    else if (filters.sort === "price-desc") diff = right.price - left.price
    else diff = left.price - right.price
    if (diff !== 0) return diff
    if (left.vehicle.id < right.vehicle.id) return -1
    if (left.vehicle.id > right.vehicle.id) return 1
    return 0
  })
  return ranked.map((item) => item.vehicle)
}

export function listMatchingVehicles(
  vehicles: readonly DriveVehicle[],
  criteria: DriveSearchCriteria,
  filters: DriveResultFilters,
  categoryLabel: (category: DriveVehicleCategory) => string,
): DriveVehicle[] {
  return listBrowseVehicles(
    vehicles,
    filters,
    { passengers: criteria.passengers, luggage: criteria.luggage },
    criteria,
    categoryLabel,
  )
}

const HANDOFF_KEYS = ["service", "start", "end", "pickup", "dropoff", "passengers", "luggage", "vehicle", "price"]

export function resolveWizardEntry(params: URLSearchParams, vehicles: readonly DriveVehicle[]): WizardEntry {
  const touched = HANDOFF_KEYS.some((key) => params.has(key))
  if (!touched) return { kind: "fresh" }

  const parsed = parseResults(params, vehicles)
  const warning = parsed.warnings[0] ?? null
  const blocking =
    parsed.errors.find(
      (issue) =>
        issue !== "drive.err.category" &&
        issue !== "drive.err.sort" &&
        issue !== "drive.err.compare" &&
        issue !== "drive.err.query",
    ) ?? null
  const base = {
    kind: "prefill" as const,
    service: isService(parsed.draft.service) ? parsed.draft.service : null,
    startAt: parseLocalDateTime(parsed.draft.startAt) ? parsed.draft.startAt : "",
    endAt: parseLocalDateTime(parsed.draft.endAt) ? parsed.draft.endAt : "",
    pickup: parsed.draft.pickup,
    dropoff: parsed.draft.dropoff,
    passengers: parsed.draft.passengers,
    luggage: parsed.draft.luggage,
    vehicleId: null as string | null,
    warning,
  }

  if (!base.service) return { ...base, step: "service", error: blocking ?? "drive.err.service" }
  if (blocking && blocking !== "drive.err.vehicle") {
    return { ...base, step: "trip", error: blocking }
  }

  const criteria = toCriteria({
    ...parsed.draft,
    service: base.service,
    endAt: base.service === "chauffeur_daily" ? parsed.draft.endAt : parsed.draft.startAt,
  })
  if (!criteria) return { ...base, step: "trip", error: blocking ?? "drive.err.incomplete" }

  const vehicleId = params.get("vehicle")
  if (!vehicleId) return { ...base, step: "vehicle", error: null, warning }
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null
  if (!vehicle) return { ...base, step: "vehicle", error: "drive.err.vehicle" }
  const fit = vehicleFit(vehicle, criteria)
  if (fit) return { ...base, step: "vehicle", vehicleId: null, error: fit }
  return { ...base, step: "contact", vehicleId: vehicle.id, error: null, warning }
}
