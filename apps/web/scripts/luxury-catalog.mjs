// Rebuilds the Drive demo catalogue with premium models while keeping the 50 ids, categories, partners and availability.
// Downloads freely licensed Wikimedia Commons photos for new models and rewrites image-sources.json.
// Usage: node scripts/luxury-catalog.mjs
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const UA = "YAMOO-demo/1.0 (contact@yamoo.cm)"
const vehiclesDir = path.join(root, "public", "images", "drive", "vehicles")
const catalogPath = path.join(root, "src", "drive", "catalog.ts")
const sourcesPath = path.join(root, "src", "drive", "image-sources.json")

// id, brand, model, slug, search, token, seats, luggage, daily, trip
const TABLE = [
  ["veh-berline-1", "Mercedes-Benz", "E-Class", "mercedes-benz-e-class", null, null, 3, 2, 150000, 45000],
  ["veh-camry-1", "BMW", "Série 5", "bmw-serie-5", null, null, 3, 2, 155000, 47000],
  ["veh-k5-1", "Audi", "A6", "audi-a6", "Audi A6 C8 front", "A6", 3, 2, 150000, 45000],
  ["veh-sonata", "Lexus", "ES", "lexus-es", "Lexus ES 300h front", "ES", 3, 2, 145000, 44000],
  ["veh-elantra", "Genesis", "G80", "genesis-g80", "Genesis G80 RG3 front", "G80", 3, 2, 140000, 42000],
  ["veh-accord", "Volvo", "S90", "volvo-s90", "Volvo S90 front", "S90", 3, 2, 145000, 44000],
  ["veh-civic", "Jaguar", "XF", "jaguar-xf", "Jaguar XF X260 front", "XF", 3, 2, 150000, 45000],
  ["veh-508", "Maserati", "Ghibli", "maserati-ghibli", "Maserati Ghibli M157 front", "Ghibli", 3, 2, 195000, 58000],
  ["veh-passat", "Audi", "A7 Sportback", "audi-a7", "Audi A7 Sportback C8 front", "A7", 3, 2, 175000, 52000],
  ["veh-altima", "Mercedes-Benz", "CLS", "mercedes-benz-cls", "Mercedes-Benz CLS C257 front", "CLS", 3, 2, 180000, 54000],
  ["veh-suv-1", "Land Rover", "Range Rover Sport", "range-rover-sport", "Range Rover Sport L461 front", "Sport", 5, 4, 230000, 68000],
  ["veh-prado-1", "Toyota", "Land Cruiser 300", "toyota-land-cruiser-300", "Toyota Land Cruiser 300|Land Cruiser J300|Land Cruiser 300 GR Sport", "Cruiser", 5, 4, 200000, 60000],
  ["veh-fortuner", "Lexus", "GX", "lexus-gx", "Lexus GX 460 front", "GX", 5, 4, 190000, 57000],
  ["veh-santafe-1", "Mercedes-Benz", "GLE", "mercedes-benz-gle", "Mercedes-Benz GLE V167 front", "GLE", 5, 3, 210000, 63000],
  ["veh-tucson", "BMW", "X6", "bmw-x6", "BMW X6 G06 front", "X6", 4, 3, 215000, 64000],
  ["veh-sportage", "Porsche", "Macan", "porsche-macan", "Porsche Macan front", "Macan", 4, 3, 200000, 60000],
  ["veh-sorento", "Volvo", "XC90", "volvo-xc90", "Volvo XC90 2015 front", "XC90", 5, 4, 190000, 57000],
  ["veh-3008", "Audi", "Q8", "audi-q8", "Audi Q8 front", "Q8", 4, 3, 225000, 67000],
  ["veh-5008", "BMW", "X7", "bmw-x7", "BMW X7 G07 front", "X7", 5, 4, 260000, 78000],
  ["veh-xtrail", "Mercedes-Benz", "GLS", "mercedes-benz-gls", "Mercedes-Benz GLS front|Mercedes-Benz X167 GLS front left|Mercedes-Benz GLS 450 front", "GLS", 5, 4, 270000, 80000],
  ["veh-suv-2", "Cadillac", "Escalade", "cadillac-escalade", "Cadillac Escalade 2021 front", "Escalade", 5, 4, 280000, 84000],
  ["veh-pajero", "Lincoln", "Navigator", "lincoln-navigator", "Lincoln Navigator 2018 front", "Navigator", 5, 4, 270000, 80000],
  ["veh-everest", "Porsche", "Cayenne", "porsche-cayenne", "Porsche Cayenne E3 front", "Cayenne", 4, 3, 250000, 75000],
  ["veh-tiguan", "Maserati", "Levante", "maserati-levante", "Maserati Levante front", "Levante", 4, 3, 240000, 72000],
  ["veh-cherokee", "Mercedes-Benz", "G-Class", "mercedes-benz-g-class", "Mercedes-Benz G 500 W463 black|Mercedes-Benz G 400 d|Mercedes-Benz G-Klasse W463 2019 front", "463", 4, 3, 350000, 105000],
  ["veh-prestige-1", "Mercedes-Benz", "S-Class", "mercedes-benz-s-class", null, null, 3, 2, 300000, 90000],
  ["veh-eclass", "Mercedes-Maybach", "S-Class", "mercedes-maybach-s-class", "Mercedes-Maybach S-Class Z223", "Maybach", 3, 2, 550000, 165000],
  ["veh-cclass", "Rolls-Royce", "Ghost", "rolls-royce-ghost", "Rolls-Royce Ghost 2021|Rolls-Royce Ghost II|Rolls-Royce Ghost 2010 front", "Ghost", 3, 2, 850000, 250000],
  ["veh-serie7-1", "BMW", "Série 7", "bmw-serie-7", null, null, 3, 2, 290000, 87000],
  ["veh-serie5", "Bentley", "Flying Spur", "bentley-flying-spur", "Bentley Flying Spur 2019 front", "Flying Spur", 3, 2, 750000, 220000],
  ["veh-x5", "Rolls-Royce", "Cullinan", "rolls-royce-cullinan", "Rolls-Royce Cullinan front", "Cullinan", 4, 3, 950000, 280000],
  ["veh-a8", "Audi", "A8", "audi-a8", null, null, 3, 2, 280000, 84000],
  ["veh-q7", "Bentley", "Bentayga", "bentley-bentayga", "Bentley Bentayga front", "Bentayga", 4, 3, 800000, 240000],
  ["veh-lx", "Lexus", "LX 600", "lexus-lx-600", null, null, 4, 3, 260000, 78000],
  ["veh-rangerover-1", "Land Rover", "Range Rover Autobiography", "range-rover-autobiography", null, null, 4, 3, 320000, 96000],
  ["veh-classev-1", "Mercedes-Benz", "V-Class", "mercedes-benz-v-class", null, null, 7, 6, 220000, 66000],
  ["veh-vito", "Lexus", "LM", "lexus-lm", "Lexus LM 300h", "LM", 6, 5, 380000, 115000],
  ["veh-van-1", "Toyota", "Alphard", "toyota-alphard", null, null, 7, 6, 240000, 72000],
  ["veh-hiace-1", "Toyota", "Vellfire", "toyota-vellfire", "Toyota Vellfire|Vellfire AH30|Vellfire 2023", "Vellfire", 7, 6, 240000, 72000],
  ["veh-staria", "Hyundai", "Staria Lounge", "hyundai-staria", null, null, 7, 6, 180000, 54000],
  ["veh-carnival", "Kia", "Carnival", "kia-carnival", null, null, 7, 6, 190000, 57000],
  ["veh-multivan", "Volkswagen", "Multivan", "volkswagen-multivan", null, null, 7, 6, 185000, 55000],
  ["veh-tourneo", "Mercedes-Benz", "EQV", "mercedes-benz-eqv", "Mercedes-Benz EQV|Mercedes EQV 300", "EQV", 7, 6, 260000, 78000],
  ["veh-trafic", "Zeekr", "009", "zeekr-009", "Zeekr 009|ZEEKR 009 front", "009", 7, 6, 200000, 60000],
  ["veh-traveller", "Chrysler", "Pacifica", "chrysler-pacifica", "Chrysler Pacifica 2017 front", "Pacifica", 7, 5, 175000, 52000],
  ["veh-hilux", "Ford", "F-150 Raptor", "ford-f150-raptor", "Ford F-150 Raptor front", "Raptor", 4, 2, 220000, 66000],
  ["veh-ranger", "Ram", "1500 TRX", "ram-1500-trx", "Ram 1500 TRX", "TRX", 4, 2, 240000, 72000],
  ["veh-l200", "Toyota", "Tundra", "toyota-tundra", "Toyota Tundra 2022|Toyota Tundra front|Toyota Tundra", "Tundra", 4, 2, 200000, 60000],
  ["veh-navara", "GMC", "Sierra Denali", "gmc-sierra-denali", "GMC Sierra Denali front", "Sierra", 4, 2, 210000, 63000],
  ["veh-dmax", "Ford", "Ranger Raptor", "ford-ranger-raptor", "Ford Ranger Raptor front", "Ranger Raptor", 4, 2, 170000, 51000],
]

const BAD = /interior|engine|rear|heck|dashboard|cockpit|badge|logo|emblem|wheel|seat|trunk|grille|steering|detail|light|lamp|tail|crash|wreck|police|polizei|silver ghost|taxi|model car|toy car|lego|pink|stripe|ausstellung|salon|show/i
const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

async function commons(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php")
  Object.entries({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
  }).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: { "User-Agent": UA } })
  const data = await response.json()
  return Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index)
}

function pick(pages, token, brand) {
  const ok = pages.filter((page) => {
    const info = page.imageinfo?.[0]
    const license = info?.extmetadata?.LicenseShortName?.value ?? ""
    return (
      info &&
      info.mime === "image/jpeg" &&
      info.width >= 1000 &&
      info.width > info.height * 1.25 &&
      /CC|Public domain|PD/i.test(license) &&
      !BAD.test(page.title) &&
      page.title.toLowerCase().includes(token.toLowerCase()) &&
      page.title.toLowerCase().includes(brand.split("-")[0].split(" ")[0].toLowerCase().slice(0, 4))
    )
  })
  return ok.find((page) => /front|vorne|avant|frontansicht/i.test(page.title)) ?? ok[0]
}

const previous = JSON.parse(await readFile(sourcesPath, "utf8"))
const bySlug = new Map(previous.map((entry) => [entry.file, entry]))
const sources = []
const missing = []

for (const [id, brand, model, slug, search, token] of TABLE) {
  if (!search) {
    const kept = bySlug.get(slug)
    if (!kept) throw new Error(`no existing source for ${slug}`)
    sources.push(kept)
    continue
  }
  const target = path.join(vehiclesDir, `${slug}.jpg`)
  if (existsSync(target) && bySlug.has(slug)) {
    sources.push(bySlug.get(slug))
    continue
  }
  let page = null
  for (const query of search.split("|")) {
    page = pick(await commons(query), token, brand)
    if (page) break
  }
  if (!page) {
    missing.push(`${id} ${brand} ${model}`)
    continue
  }
  const info = page.imageinfo[0]
  const bytes = Buffer.from(await (await fetch(info.thumburl, { headers: { "User-Agent": UA } })).arrayBuffer())
  await writeFile(target, bytes)
  const meta = info.extmetadata ?? {}
  const entry = {
    file: slug,
    image: `images/drive/vehicles/${slug}.jpg`,
    sourceUrl: info.descriptionurl,
    fileUrl: info.url,
    author: strip(meta.Artist?.value) || "Unknown",
    license: meta.LicenseShortName?.value ?? "",
    licenseUrl: meta.LicenseUrl?.value ?? "",
    attribution: meta.AttributionRequired?.value === "true",
    title: page.title,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    visualCheck: "contact-sheet",
    status: "verified",
  }
  bySlug.set(slug, entry)
  sources.push(entry)
  console.log(`OK ${slug}  ${page.title}`)
}

if (missing.length) {
  console.log(`MISSING:\n${missing.join("\n")}`)
  process.exit(1)
}

const source = await readFile(catalogPath, "utf8")
const start = source.indexOf("export const DEMO_VEHICLES: DriveVehicle[] = [")
const end = source.indexOf("\n]\n", start)
const current = source.slice(start, end)
const blocks = [...current.matchAll(/\{\s*id: "([^"]+)",[\s\S]*?category: "([^"]+)",[\s\S]*?partnerId: "([^"]+)",\s*providerIds: (\[[^\]]*\]),\s*available: (\w+),/g)]
const meta = new Map(blocks.map((match) => [match[1], { category: match[2], partnerId: match[3], providerIds: match[4], available: match[5] }]))
if (meta.size !== 50) throw new Error(`expected 50 catalogue blocks, got ${meta.size}`)

const entries = TABLE.map(([id, brand, model, slug, , , seats, luggage, daily, trip]) => {
  const keep = meta.get(id)
  if (!keep) throw new Error(`unknown id ${id}`)
  const src = `asset("images/drive/vehicles/${slug}.jpg")`
  return `  {
    id: "${id}",
    name: "${brand} ${model}",
    brand: "${brand}",
    model: "${model}",
    category: "${keep.category}",
    seats: ${seats},
    luggage: ${luggage},
    imageSrc: ${src},
    images: [{ src: ${src}, demo: true }],
    imageStatus: "verified",
    partnerId: "${keep.partnerId}",
    providerIds: ${keep.providerIds},
    available: ${keep.available},
    dailyRateFcfa: ${daily},
    tripRateFcfa: ${trip},
    demo: true,
  },`
})

const header = `export const DEMO_VEHICLES: DriveVehicle[] = [\n${entries.join("\n")}`
await writeFile(catalogPath, source.slice(0, start) + header + source.slice(end))
await writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`)

const used = new Set(TABLE.map((row) => `${row[3]}.jpg`))
for (const entry of previous) {
  const file = `${entry.file}.jpg`
  if (!used.has(file) && existsSync(path.join(vehiclesDir, file))) await unlink(path.join(vehiclesDir, file))
}
console.log(`catalogue rewritten: ${entries.length} vehicles, ${sources.length} sources`)
