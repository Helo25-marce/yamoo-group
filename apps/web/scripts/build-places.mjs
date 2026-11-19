import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(here, "../src/drive/places-src")
const out = path.resolve(here, "../src/drive/places.cm.json")

const regions = JSON.parse(fs.readFileSync(path.join(src, "regions.json"), "utf8"))
const divisions = JSON.parse(fs.readFileSync(path.join(src, "divisions.json"), "utf8"))
const subdivisions = JSON.parse(fs.readFileSync(path.join(src, "subdivisions.json"), "utf8"))

function norm(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : null
}

const regionName = new Map(regions.map((item) => [item.id, item.name.local]))
const divisionById = new Map(divisions.map((item) => [item.id, item]))

const capitals = new Set(
  [
    "Ngaoundéré",
    "Yaoundé",
    "Bertoua",
    "Maroua",
    "Douala",
    "Garoua",
    "Bamenda",
    "Bafoussam",
    "Ebolowa",
    "Buea",
    "Buéa",
    "Limbe",
    "Kribi",
    "Kumba",
    "Edéa",
    "Nkongsamba",
    "Dschang",
    "Foumban",
    "Mbalmayo",
    "Bafia",
    "Sangmélima",
    "Kousséri",
    "Ngaoundere",
  ].map(norm),
)

const places = []

function add(place) {
  if (place.lat == null || place.lng == null) return
  if (place.lat < 1.5 || place.lat > 13.2 || place.lng < 8.3 || place.lng > 16.3) return
  places.push(place)
}

for (const item of subdivisions) {
  const department = divisionById.get(item.parent?.id)
  const region = regionName.get(item.ancestors?.[0]?.id) ?? item.ancestors?.[0]?.name?.local ?? ""
  const departmentName = department?.name.local ?? item.parent?.name?.local ?? ""
  const name = item.name.local
  const city = capitals.has(norm(name)) || norm(name) === norm(departmentName)
  add({
    id: item.id,
    k: city ? "city" : "commune",
    n: name,
    h: [departmentName, region].filter(Boolean).join(", "),
    lat: num(item.geo?.lat),
    lng: num(item.geo?.lon),
  })
}

const metros = [
  ["Douala", "Wouri, Littoral", /^douala /],
  ["Yaoundé", "Mfoundi, Centre", /^yaounde /],
  ["Garoua", "Bénoué, Nord", /^garoua /],
  ["Bamenda", "Mezam, Nord-Ouest", /^bamenda /],
  ["Maroua", "Diamaré, Extrême-Nord", /^maroua /],
  ["Bafoussam", "Mifi, Ouest", /^bafoussam /],
  ["Bertoua", "Lom-et-Djérem, Est", /^bertoua /],
  ["Ebolowa", "Mvila, Sud", /^ebolowa /],
  ["Kribi", "Océan, Sud", /^kribi /],
  ["Limbe", "Fako, Sud-Ouest", /^limbe /],
  ["Ngaoundéré", "Vina, Adamaoua", /^ngaoundere /],
  ["Kumba", "Meme, Sud-Ouest", /^kumba /],
  ["Edéa", "Sanaga-Maritime, Littoral", /^edea /],
  ["Nkongsamba", "Moungo, Littoral", /^nkongsamba /],
]

for (const [name, hint, test] of metros) {
  const parts = places.filter((place) => (place.k === "commune" || place.k === "city") && test.test(norm(place.n)))
  if (parts.length === 0) continue
  if (parts.length === 1 && norm(parts[0].n) === norm(name)) {
    parts[0].k = "city"
    continue
  }
  const lat = parts.reduce((sum, place) => sum + place.lat, 0) / parts.length
  const lng = parts.reduce((sum, place) => sum + place.lng, 0) / parts.length
  add({
    id: `city-${norm(name).replaceAll(" ", "-")}`,
    k: "city",
    n: name,
    h: hint,
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000,
  })
}

const cityPlaces = places.filter((place) => place.k === "city")
for (const city of cityPlaces) {
  const spots = [
    ["Centre-ville", 0, 0],
    ["Gare routière", 0.012, 0.008],
    ["Marché central", -0.01, 0.006],
    ["Hôpital", 0.008, -0.01],
  ]
  for (const [title, dLat, dLng] of spots) {
    add({
      id: `${city.id}-${norm(title).replaceAll(" ", "-")}`,
      k: "place",
      n: `${title} de ${city.n}`,
      h: city.h || city.n,
      lat: Math.round((city.lat + dLat) * 10000) / 10000,
      lng: Math.round((city.lng + dLng) * 10000) / 10000,
    })
  }
}

const landmarks = [
  ["Port autonome de Douala", "Douala, Littoral", 4.0406, 9.685],
  ["Marché Mboppi", "Douala, Littoral", 4.051, 9.731],
  ["Stade de Japoma", "Douala, Littoral", 4.0305, 9.778],
  ["Hôpital Laquintinie", "Douala, Littoral", 4.048, 9.697],
  ["Université de Douala", "Douala, Littoral", 4.061, 9.734],
  ["Bonanjo", "Douala, Littoral", 4.041, 9.688],
  ["Akwa", "Douala, Littoral", 4.049, 9.704],
  ["Bonapriso", "Douala, Littoral", 4.026, 9.704],
  ["Bonabéri", "Douala, Littoral", 4.081, 9.668],
  ["Deido", "Douala, Littoral", 4.066, 9.716],
  ["Makepe", "Douala, Littoral", 4.089, 9.749],
  ["Ndokoti", "Douala, Littoral", 4.055, 9.736],
  ["New Bell", "Douala, Littoral", 4.032, 9.718],
  ["Logpom", "Douala, Littoral", 4.078, 9.762],
  ["Bassa", "Douala, Littoral", 4.038, 9.758],
  ["Cité des Palmiers", "Douala, Littoral", 4.018, 9.742],
  ["Palais de l'Unité", "Yaoundé, Centre", 3.8667, 11.5167],
  ["Poste centrale de Yaoundé", "Yaoundé, Centre", 3.866, 11.518],
  ["Marché Mokolo", "Yaoundé, Centre", 3.875, 11.492],
  ["Gare routière de Mvan", "Yaoundé, Centre", 3.838, 11.522],
  ["Stade omnisports Ahmadou Ahidjo", "Yaoundé, Centre", 3.886, 11.541],
  ["CHU de Yaoundé", "Yaoundé, Centre", 3.868, 11.498],
  ["Université de Yaoundé I", "Yaoundé, Centre", 3.857, 11.5],
  ["Bastos", "Yaoundé, Centre", 3.892, 11.507],
  ["Nlongkak", "Yaoundé, Centre", 3.884, 11.528],
  ["Essos", "Yaoundé, Centre", 3.867, 11.548],
  ["Mvog-Ada", "Yaoundé, Centre", 3.861, 11.531],
  ["Mvan", "Yaoundé, Centre", 3.841, 11.518],
  ["Biyem-Assi", "Yaoundé, Centre", 3.834, 11.486],
  ["Nsimeyong", "Yaoundé, Centre", 3.844, 11.492],
  ["Mendong", "Yaoundé, Centre", 3.838, 11.468],
  ["Nkolbisson", "Yaoundé, Centre", 3.871, 11.451],
  ["Emombo", "Yaoundé, Centre", 3.855, 11.54],
  ["Mont Fébé", "Yaoundé, Centre", 3.905, 11.498],
  ["Plage de Kribi", "Kribi, Sud", 2.94, 9.91],
  ["Chutes de la Lobé", "Kribi, Sud", 2.883, 9.9],
  ["Port en eau profonde de Kribi", "Kribi, Sud", 2.817, 9.85],
  ["Down Beach", "Limbe, Sud-Ouest", 4.008, 9.206],
  ["Jardin botanique de Limbe", "Limbe, Sud-Ouest", 4.013, 9.207],
  ["Mont Cameroun", "Buéa, Sud-Ouest", 4.217, 9.17],
  ["Palais royal de Foumban", "Foumban, Ouest", 5.728, 10.899],
  ["Chefferie de Bandjoun", "Bandjoun, Ouest", 5.373, 10.413],
  ["Parc national de Waza", "Waza, Extrême-Nord", 11.35, 14.65],
  ["Rhumsiki", "Rhumsiki, Extrême-Nord", 10.467, 13.6],
]

for (const [name, hint, lat, lng] of landmarks) {
  add({ id: `lm-${norm(name).replaceAll(" ", "-")}`, k: "place", n: name, h: hint, lat, lng })
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else quoted = false
      } else cell += char
    } else if (char === '"') quoted = true
    else if (char === ",") {
      row.push(cell)
      cell = ""
    } else if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (char !== "\r") cell += char
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const airportFr = {
  DLA: "Aéroport international de Douala",
  NSI: "Aéroport international de Yaoundé-Nsimalen",
  YAO: "Aéroport de Yaoundé-Ville",
  GOU: "Aéroport international de Garoua",
  MVR: "Aéroport international de Maroua-Salak",
  BPC: "Aéroport de Bamenda",
  BFX: "Aéroport de Bafoussam",
  BTA: "Aéroport de Bertoua",
  NGE: "Aéroport de Ngaoundéré",
  TKC: "Aéroport de Tiko",
  KBI: "Aéroport de Kribi",
  EBW: "Aéroport d'Ebolowa",
  DSC: "Aéroport de Dschang",
  FOM: "Aéroport de Foumban",
  MMF: "Aéroport de Mamfe",
  NKS: "Aéroport de Nkongsamba",
  KLE: "Aéroport de Kaélé",
  GXX: "Aéroport de Yagoua",
  OUR: "Aéroport de Batouri",
  BLC: "Aéroport de Bali",
  KOB: "Aéroport de Koutaba",
  VCC: "Aéroport de Limbe",
}

const csv = parseCsv(fs.readFileSync(path.join(src, "airports.csv"), "utf8"))
const header = csv[0]
const col = Object.fromEntries(header.map((name, index) => [name, index]))
for (const row of csv.slice(1)) {
  if (row[col.iso_country] !== "CM") continue
  const type = row[col.type]
  if (!["large_airport", "medium_airport", "small_airport"].includes(type)) continue
  const iata = row[col.iata_code] || ""
  const municipality = row[col.municipality] || ""
  if (!iata && !municipality) continue
  const name = airportFr[iata] || (municipality ? `Aérodrome de ${municipality}` : row[col.name])
  add({
    id: `apt-${row[col.ident]}`,
    k: "airport",
    n: name,
    h: [iata, municipality].filter(Boolean).join(" · "),
    lat: num(row[col.latitude_deg]),
    lng: num(row[col.longitude_deg]),
  })
}

const seen = new Set()
const unique = []
for (const place of places) {
  const key = `${place.k}|${norm(place.n)}|${norm(place.h)}`
  if (seen.has(key)) continue
  seen.add(key)
  unique.push(place)
}

const counts = unique.reduce((bag, place) => {
  bag[place.k] = (bag[place.k] ?? 0) + 1
  return bag
}, {})

fs.writeFileSync(out, JSON.stringify(unique))
console.log(JSON.stringify({ total: unique.length, counts, bytes: fs.statSync(out).size }))
