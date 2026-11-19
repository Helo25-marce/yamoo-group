import raw from "./places.cm.json"

export type PlaceKind = "airport" | "city" | "commune" | "place"

export type Place = {
  id: string
  k: PlaceKind
  n: string
  h: string
  lat: number
  lng: number
}

export const PLACES = raw as Place[]

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

const indexed = PLACES.map((place) => ({
  place,
  name: fold(place.n),
  all: fold(`${place.n} ${place.h}`),
}))

const POPULAR: Array<{ kind: PlaceKind; needle: string }> = [
  { kind: "airport", needle: "dla" },
  { kind: "airport", needle: "nsi" },
  { kind: "city", needle: "douala" },
  { kind: "city", needle: "yaounde" },
  { kind: "city", needle: "garoua" },
  { kind: "city", needle: "bafoussam" },
  { kind: "city", needle: "bamenda" },
  { kind: "city", needle: "limbe" },
  { kind: "city", needle: "kribi" },
  { kind: "city", needle: "buea" },
  { kind: "city", needle: "maroua" },
  { kind: "city", needle: "ngaoundere" },
]

function popular(): Place[] {
  const picked: Place[] = []
  for (const item of POPULAR) {
    const found = indexed.find((entry) => entry.place.k === item.kind && (entry.name === item.needle || entry.all.includes(item.needle)))
    if (found && !picked.some((place) => place.id === found.place.id)) picked.push(found.place)
  }
  return picked
}

/** Airports, cities, every commune and the main public places. Empty query returns the usual gateways. */
export function searchPlaces(query: string, limit = 24): Place[] {
  const needle = fold(query.trim())
  if (!needle) return popular()
  const hits: Array<{ place: Place; score: number }> = []
  for (const entry of indexed) {
    let score = 0
    if (entry.name === needle) score = 100
    else if (entry.name.startsWith(needle)) score = 80
    else if (entry.name.split(/[^a-z0-9]+/).some((word) => word.startsWith(needle))) score = 60
    else if (entry.all.includes(needle)) score = 40
    if (score === 0) continue
    if (entry.place.k === "airport") score += 6
    else if (entry.place.k === "city") score += 4
    else if (entry.place.k === "place") score += 2
    hits.push({ place: entry.place, score })
  }
  hits.sort((left, right) => right.score - left.score || left.place.n.localeCompare(right.place.n, "fr"))
  return hits.slice(0, limit).map((hit) => hit.place)
}

export function findPlace(value: string): Place | null {
  const needle = fold(value.trim())
  if (!needle) return null
  return indexed.find((entry) => entry.name === needle)?.place ?? null
}
