// Downloads freely licensed Wikimedia Commons photos for MEDIA and TRAVEL and records their sources.
// Usage: node scripts/fetch-universe-images.mjs
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const UA = "YAMOO-demo/1.0 (contact@yamoo.cm)"

const targets = [
  ["travel", "kribi", "Kribi beach Cameroon"],
  ["travel", "buea", "Mount Cameroon"],
  ["travel", "limbe", "Limbe Cameroon beach"],
  ["travel", "bafoussam", "Chefferie Bandjoun"],
  ["travel", "garoua", "Benoue National Park"],
  ["travel", "douala", "Douala International Airport"],
  ["travel", "yaounde", "Yaoundé city view"],
  ["media", "p1", "photographer studio flash"],
  ["media", "p2", "wedding photographer ceremony"],
  ["media", "p3", "video camera operator filming"],
  ["media", "p4", "conference Africa audience"],
  ["media", "p5", "product launch event stage"],
  ["media", "p6", "graduation ceremony gowns"],
  ["media", "p7", "graphic design studio"],
  ["media", "p8", "content creator filming smartphone gimbal"],
]

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

async function find(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php")
  Object.entries({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
  }).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: { "User-Agent": UA } })
  const data = await response.json()
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index)
  return pages.find((page) => {
    const info = page.imageinfo?.[0]
    const license = info?.extmetadata?.LicenseShortName?.value ?? ""
    return info && info.mime === "image/jpeg" && info.width >= 1000 && info.width > info.height * 1.2 && /CC|Public domain|PD/i.test(license)
  })
}

const sources = {}
for (const [scope, id, query] of targets) {
  const page = await find(query)
  if (!page) {
    console.log(`MISSING ${scope}/${id} (${query})`)
    continue
  }
  const info = page.imageinfo[0]
  const file = `images/${scope}/${id}.jpg`
  const image = await fetch(info.thumburl, { headers: { "User-Agent": UA } })
  await mkdir(path.join(root, "public", "images", scope), { recursive: true })
  await writeFile(path.join(root, "public", file), Buffer.from(await image.arrayBuffer()))
  sources[`${scope}/${id}`] = {
    file,
    title: page.title,
    source: info.descriptionurl,
    author: strip(info.extmetadata?.Artist?.value) || "Unknown",
    license: info.extmetadata?.LicenseShortName?.value ?? "",
  }
  console.log(`OK ${scope}/${id}  ${page.title}  [${sources[`${scope}/${id}`].license}]`)
}
await writeFile(path.join(root, "src", "content", "universe-images.json"), `${JSON.stringify(sources, null, 2)}\n`)
