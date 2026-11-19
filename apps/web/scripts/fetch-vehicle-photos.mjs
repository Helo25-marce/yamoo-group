/**
 * Downloads one Wikimedia Commons photograph per model.
 * Keeps only free licenses (public domain, CC0, CC BY, CC BY-SA, GFDL).
 * Rejects non-commercial and non-free files. Does not touch Booking.com.
 */
import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outDir = path.join(root, "public", "images", "drive", "vehicles")
const reportPath = path.join(root, "src", "drive", "image-sources.json")

const UA = "YAMOODriveCatalog/1.0 (demo catalogue; contact@yamoo.cm)"

const models = [
  { file: "toyota-camry", q: "Toyota Camry sedan", need: ["camry"], ban: ["solara", "logo", "engine", "interior"] },
  { file: "toyota-corolla", q: "Toyota Corolla sedan", need: ["corolla"], ban: ["cross", "logo", "interior", "engine"] },
  { file: "kia-k5", q: "Kia K5 sedan", need: ["k5"], ban: ["logo", "interior"] },
  { file: "hyundai-sonata", q: "Hyundai Sonata sedan", need: ["sonata"], ban: ["logo", "interior", "engine"] },
  { file: "hyundai-elantra", q: "Hyundai Elantra sedan", need: ["elantra"], ban: ["logo", "interior"] },
  { file: "honda-accord", q: "Honda Accord sedan", need: ["accord"], ban: ["logo", "interior", "crosstour"] },
  { file: "honda-civic", q: "Honda Civic sedan", need: ["civic"], ban: ["logo", "interior", "type r", "typer"] },
  { file: "peugeot-508", q: "Peugeot 508 sedan", need: ["508"], ban: ["logo", "interior", "sw"] },
  { file: "volkswagen-passat", q: "Volkswagen Passat sedan", need: ["passat"], ban: ["logo", "interior", "variant"] },
  { file: "nissan-altima", q: "Nissan Altima sedan", need: ["altima"], ban: ["logo", "interior"] },
  { file: "toyota-land-cruiser-prado", q: "Toyota Land Cruiser Prado", need: ["prado"], ban: ["logo", "interior"] },
  { file: "toyota-rav4", q: "Toyota RAV4", need: ["rav4"], ban: ["logo", "interior"] },
  { file: "toyota-fortuner", q: "Toyota Fortuner", need: ["fortuner"], ban: ["logo", "interior"] },
  { file: "hyundai-santa-fe", q: "Hyundai Santa Fe", need: ["santa"], ban: ["logo", "interior"] },
  { file: "hyundai-tucson", q: "Hyundai Tucson", need: ["tucson"], ban: ["logo", "interior"] },
  { file: "kia-sportage", q: "Kia Sportage", need: ["sportage"], ban: ["logo", "interior"] },
  { file: "kia-sorento", q: "Kia Sorento", need: ["sorento"], ban: ["logo", "interior"] },
  { file: "peugeot-3008", q: "Peugeot 3008", need: ["3008"], ban: ["logo", "interior"] },
  { file: "peugeot-5008", q: "Peugeot 5008", need: ["5008"], ban: ["logo", "interior"] },
  { file: "nissan-x-trail", q: "Nissan X-Trail", need: ["x-trail"], ban: ["logo", "interior"] },
  { file: "nissan-patrol", q: "Nissan Patrol SUV", need: ["patrol"], ban: ["logo", "interior"] },
  { file: "mitsubishi-pajero-sport", q: "Mitsubishi Pajero Sport", need: ["pajero"], ban: ["logo", "interior"] },
  { file: "ford-everest", q: "Ford Everest SUV", need: ["everest"], ban: ["logo", "interior"] },
  { file: "volkswagen-tiguan", q: "Volkswagen Tiguan", need: ["tiguan"], ban: ["logo", "interior"] },
  { file: "jeep-grand-cherokee", q: "Jeep Grand Cherokee", need: ["cherokee"], ban: ["logo", "interior", "compass"] },
  { file: "mercedes-benz-s-class", q: "Mercedes-Benz S-Class W223", need: ["s-class"], ban: ["logo", "interior", "maybach", "crash", "wreck"] },
  { file: "mercedes-benz-e-class", q: "Mercedes-Benz E-Class sedan", need: ["e-class"], ban: ["logo", "interior", "coupe", "cabriolet"] },
  { file: "mercedes-benz-c-class", q: "Mercedes-Benz C-Class sedan", need: ["c-class"], ban: ["logo", "interior", "coupe"] },
  { file: "bmw-serie-7", q: "BMW 7 Series sedan", need: ["7 series"], ban: ["logo", "interior"] },
  { file: "bmw-serie-5", q: "BMW 5 Series sedan", need: ["5 series"], ban: ["logo", "interior", "touring"] },
  { file: "bmw-x5", q: "BMW X5", need: ["x5"], ban: ["logo", "interior"] },
  { file: "audi-a8", q: "Audi A8", need: ["a8"], ban: ["logo", "interior"] },
  { file: "audi-q7", q: "Audi Q7", need: ["q7"], ban: ["logo", "interior"] },
  { file: "lexus-lx-600", q: "Lexus LX 600", need: ["lx", "600"], ban: ["logo", "interior", "450", "470", "570"] },
  { file: "range-rover-autobiography", q: "Range Rover Autobiography", need: ["range rover"], ban: ["logo", "interior", "evoque", "velar", "sport"] },
  { file: "mercedes-benz-v-class", q: "Mercedes-Benz V-Class", need: ["v-class"], ban: ["logo", "interior"] },
  { file: "mercedes-benz-vito", q: "Mercedes-Benz Vito", need: ["vito"], ban: ["logo", "interior"] },
  { file: "toyota-alphard", q: "Toyota Alphard", need: ["alphard"], ban: ["logo", "interior"] },
  { file: "toyota-hiace", q: "Toyota Hiace", need: ["hiace"], ban: ["logo", "interior"] },
  { file: "hyundai-staria", q: "Hyundai Staria", need: ["staria"], ban: ["logo", "interior"] },
  { file: "kia-carnival", q: "Kia Carnival", need: ["carnival"], ban: ["logo", "interior"] },
  { file: "volkswagen-multivan", q: "Volkswagen Multivan", need: ["multivan"], ban: ["logo", "interior"] },
  { file: "ford-tourneo-custom", q: "Ford Tourneo Custom", need: ["tourneo"], ban: ["logo", "interior", "connect"] },
  { file: "renault-trafic", q: "Renault Trafic", need: ["trafic"], ban: ["logo", "interior"] },
  { file: "peugeot-traveller", q: "Peugeot Traveller", need: ["traveller"], ban: ["logo", "interior"] },
  { file: "toyota-hilux", q: "Toyota Hilux", need: ["hilux"], ban: ["logo", "interior"] },
  { file: "ford-ranger", q: "Ford Ranger pickup", need: ["ranger"], ban: ["logo", "interior"] },
  { file: "mitsubishi-l200", q: "Mitsubishi L200", need: ["l200"], ban: ["logo", "interior"] },
  { file: "nissan-navara", q: "Nissan Navara", need: ["navara"], ban: ["logo", "interior"] },
  { file: "isuzu-d-max", q: "Isuzu D-Max", need: ["d-max"], ban: ["logo", "interior"] },
]

function fold(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[_]+/g, " ")
}

function licenseOk(meta) {
  const name = fold(meta?.LicenseShortName?.value ?? "")
  const url = fold(meta?.LicenseUrl?.value ?? "")
  if (!name && !url) return false
  if (name.includes("non-free") || name.includes("nonfree") || name.includes("all rights reserved")) return false
  if (/(^|[^a-z])nc([^a-z]|$)/.test(name) || name.includes("noncommercial") || name.includes("non-commercial")) return false
  const blob = `${name} ${url}`
  return (
    blob.includes("public domain") ||
    blob.includes("cc0") ||
    blob.includes("cc-zero") ||
    blob.includes("cc by") ||
    blob.includes("cc-by") ||
    blob.includes("gfdl") ||
    blob.includes("attribution")
  )
}

async function commons(params) {
  const url = new URL("https://commons.wikimedia.org/w/api.php")
  url.search = new URLSearchParams({ format: "json", origin: "*", ...params }).toString()
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } })
  if (!response.ok) throw new Error(`commons ${response.status}`)
  return response.json()
}

async function candidates(model) {
  const data = await commons({
    action: "query",
    generator: "search",
    gsrsearch: `${model.q} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "960",
  })
  const pages = Object.values(data.query?.pages ?? {})
  const ranked = []
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    const title = fold(page.title ?? "")
    if (!model.need.every((token) => title.includes(token))) continue
    if (model.ban.some((token) => title.includes(token))) continue
    if (/(crash|wreck|damag|accident|scrap|burnt|fire)/.test(title)) continue
    if (!["image/jpeg", "image/png", "image/webp"].includes(info.mime)) continue
    if (!licenseOk(info.extmetadata)) continue
    const width = info.thumbwidth || info.width || 0
    if (width < 480) continue
    ranked.push({ page, info, title, score: /201[5-9]|202/.test(title) ? 2 : /200|201/.test(title) ? 1 : 0 })
  }
  return ranked.sort((a, b) => b.score - a.score)
}

const hashes = new Set()
const only = new Set(process.argv.slice(2))
const previous = only.size
  ? JSON.parse(await (await import("node:fs/promises")).readFile(reportPath, "utf8"))
  : []
const report = only.size ? previous.filter((item) => !only.has(item.file)) : []

await mkdir(outDir, { recursive: true })

for (const model of models) {
  if (only.size && !only.has(model.file)) continue
  let chosen = null
  let reason = "no-free-match"
  try {
    const found = await candidates(model)
    for (const item of found) {
      const src = item.info.thumburl || item.info.url
      const response = await fetch(src, { headers: { "User-Agent": UA } })
      if (!response.ok) continue
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length < 8_000) continue
      const hash = createHash("sha256").update(bytes).digest("hex")
      if (hashes.has(hash)) continue
      hashes.add(hash)
      const filename = `${model.file}.jpg`
      await writeFile(path.join(outDir, filename), bytes)
      const meta = item.info.extmetadata ?? {}
      chosen = {
        file: model.file,
        image: `images/drive/vehicles/${filename}`,
        sourceUrl: item.info.descriptionurl,
        fileUrl: item.info.url,
        author: (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim(),
        license: meta.LicenseShortName?.value ?? "",
        licenseUrl: meta.LicenseUrl?.value ?? "",
        attribution: meta.AttributionRequired?.value === "true",
        title: item.page.title,
        bytes: bytes.length,
        sha256: hash,
        visualCheck: "filename-and-license",
        status: "verified",
      }
      break
    }
  } catch (error) {
    reason = error instanceof Error ? error.message : "fetch-failed"
  }
  if (!chosen) {
    report.push({ file: model.file, image: "", status: "pending", reason, visualCheck: "missing" })
    console.log(`PENDING ${model.file} ${reason}`)
  } else {
    report.push(chosen)
    console.log(`OK ${model.file} ${chosen.license} ${chosen.bytes}`)
  }
  await new Promise((resolve) => setTimeout(resolve, 250))
}

await writeFile(reportPath, JSON.stringify(report, null, 2))
const verified = report.filter((item) => item.status === "verified").length
console.log(`verified ${verified} / ${models.length}`)
