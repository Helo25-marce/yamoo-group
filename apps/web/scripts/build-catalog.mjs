import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const report = JSON.parse(await readFile(path.join(root, "src", "drive", "image-sources.json"), "utf8"))
const byFile = new Map(report.map((item) => [item.file, item]))

const rows = [
  ["veh-berline-1", "Toyota", "Corolla", "berline", 3, 2, 85000, 25000, true, "yamoo", "toyota-corolla"],
  ["veh-camry-1", "Toyota", "Camry", "berline", 3, 2, 95000, 30000, true, "yamoo", "toyota-camry"],
  ["veh-k5-1", "Kia", "K5", "berline", 3, 2, 105000, 32000, true, "co-wouri", "kia-k5"],
  ["veh-sonata", "Hyundai", "Sonata", "berline", 3, 2, 98000, 30000, true, "co-nsimalen", "hyundai-sonata"],
  ["veh-elantra", "Hyundai", "Elantra", "berline", 3, 2, 90000, 28000, true, "yamoo", "hyundai-elantra"],
  ["veh-accord", "Honda", "Accord", "berline", 3, 2, 112000, 34000, true, "co-wouri", "honda-accord"],
  ["veh-civic", "Honda", "Civic", "berline", 3, 2, 88000, 27000, true, "co-sanaga", "honda-civic"],
  ["veh-508", "Peugeot", "508", "berline", 3, 2, 108000, 33000, true, "co-nsimalen", "peugeot-508"],
  ["veh-passat", "Volkswagen", "Passat", "berline", 3, 2, 118000, 36000, true, "co-bonaberi", "volkswagen-passat"],
  ["veh-altima", "Nissan", "Altima", "berline", 3, 2, 102000, 31000, true, "yamoo", "nissan-altima"],
  ["veh-suv-1", "Toyota", "RAV4", "suv", 5, 4, 110000, 35000, true, "co-wouri", "toyota-rav4"],
  ["veh-prado-1", "Toyota", "Land Cruiser Prado", "suv", 5, 4, 140000, 42000, true, "co-bonaberi", "toyota-land-cruiser-prado"],
  ["veh-fortuner", "Toyota", "Fortuner", "suv", 5, 4, 135000, 40000, true, "co-bonaberi", "toyota-fortuner"],
  ["veh-santafe-1", "Hyundai", "Santa Fe", "suv", 5, 3, 120000, 38000, true, "co-wouri", "hyundai-santa-fe"],
  ["veh-tucson", "Hyundai", "Tucson", "suv", 5, 3, 115000, 35000, true, "co-wouri", "hyundai-tucson"],
  ["veh-sportage", "Kia", "Sportage", "suv", 5, 3, 116000, 35000, true, "co-nsimalen", "kia-sportage"],
  ["veh-sorento", "Kia", "Sorento", "suv", 5, 4, 128000, 39000, true, "co-wouri", "kia-sorento"],
  ["veh-3008", "Peugeot", "3008", "suv", 5, 4, 122000, 37000, true, "co-sanaga", "peugeot-3008"],
  ["veh-5008", "Peugeot", "5008", "suv", 5, 4, 132000, 40000, true, "co-nsimalen", "peugeot-5008"],
  ["veh-xtrail", "Nissan", "X-Trail", "suv", 5, 4, 126000, 38000, true, "co-bonaberi", "nissan-x-trail"],
  ["veh-suv-2", "Nissan", "Patrol", "suv", 5, 4, 125000, 40000, false, "co-bonaberi", "nissan-patrol"],
  ["veh-pajero", "Mitsubishi", "Pajero Sport", "suv", 5, 4, 138000, 41000, true, "co-bonaberi", "mitsubishi-pajero-sport"],
  ["veh-everest", "Ford", "Everest", "suv", 5, 4, 142000, 43000, true, "co-sanaga", "ford-everest"],
  ["veh-tiguan", "Volkswagen", "Tiguan", "suv", 5, 3, 124000, 37000, true, "co-wouri", "volkswagen-tiguan"],
  ["veh-cherokee", "Jeep", "Grand Cherokee", "suv", 5, 4, 148000, 45000, true, "co-mfoundi", "jeep-grand-cherokee"],
  ["veh-prestige-1", "Mercedes-Benz", "S-Class", "prestige", 3, 2, 180000, 60000, true, "co-mfoundi", "mercedes-benz-s-class"],
  ["veh-eclass", "Mercedes-Benz", "E-Class", "prestige", 3, 2, 165000, 52000, true, "co-mfoundi", "mercedes-benz-e-class"],
  ["veh-cclass", "Mercedes-Benz", "C-Class", "prestige", 3, 2, 145000, 44000, true, "co-mfoundi", "mercedes-benz-c-class"],
  ["veh-serie7-1", "BMW", "Série 7", "prestige", 3, 2, 170000, 55000, true, "co-mfoundi", "bmw-serie-7"],
  ["veh-serie5", "BMW", "Série 5", "prestige", 3, 2, 155000, 48000, true, "co-mfoundi", "bmw-serie-5"],
  ["veh-x5", "BMW", "X5", "prestige", 4, 3, 168000, 52000, true, "co-mfoundi", "bmw-x5"],
  ["veh-a8", "Audi", "A8", "prestige", 3, 2, 172000, 54000, true, "co-mfoundi", "audi-a8"],
  ["veh-q7", "Audi", "Q7", "prestige", 4, 3, 162000, 50000, true, "co-mfoundi", "audi-q7"],
  ["veh-lx", "Lexus", "LX 600", "prestige", 4, 3, 175000, 56000, true, "co-mfoundi", "lexus-lx-600"],
  ["veh-rangerover-1", "Range Rover", "Autobiography", "prestige", 4, 3, 150000, 48000, false, "co-mfoundi", "range-rover-autobiography"],
  ["veh-classev-1", "Mercedes-Benz", "V-Class", "van", 7, 6, 160000, 50000, true, "co-mfoundi", "mercedes-benz-v-class"],
  ["veh-vito", "Mercedes-Benz", "Vito", "van", 7, 6, 125000, 38000, true, "co-sanaga", "mercedes-benz-vito"],
  ["veh-van-1", "Toyota", "Alphard", "van", 7, 6, 130000, 45000, true, "co-nsimalen", "toyota-alphard"],
  ["veh-hiace-1", "Toyota", "Hiace", "van", 6, 5, 115000, 36000, true, "co-sanaga", "toyota-hiace"],
  ["veh-staria", "Hyundai", "Staria", "van", 7, 6, 128000, 39000, true, "co-nsimalen", "hyundai-staria"],
  ["veh-carnival", "Kia", "Carnival", "van", 7, 6, 135000, 41000, true, "co-wouri", "kia-carnival"],
  ["veh-multivan", "Volkswagen", "Multivan", "van", 7, 6, 148000, 45000, true, "co-mfoundi", "volkswagen-multivan"],
  ["veh-tourneo", "Ford", "Tourneo Custom", "van", 7, 5, 122000, 37000, true, "co-sanaga", "ford-tourneo-custom"],
  ["veh-trafic", "Renault", "Trafic", "van", 6, 5, 98000, 30000, true, "co-bonaberi", "renault-trafic"],
  ["veh-traveller", "Peugeot", "Traveller", "van", 7, 6, 118000, 36000, true, "co-nsimalen", "peugeot-traveller"],
  ["veh-hilux", "Toyota", "Hilux", "pickup", 3, 2, 110000, 34000, true, "co-bonaberi", "toyota-hilux"],
  ["veh-ranger", "Ford", "Ranger", "pickup", 3, 2, 112000, 34000, true, "co-sanaga", "ford-ranger"],
  ["veh-l200", "Mitsubishi", "L200", "pickup", 3, 2, 108000, 33000, true, "co-wouri", "mitsubishi-l200"],
  ["veh-navara", "Nissan", "Navara", "pickup", 3, 2, 109000, 33000, true, "co-bonaberi", "nissan-navara"],
  ["veh-dmax", "Isuzu", "D-Max", "pickup", 3, 2, 107000, 32000, true, "co-sanaga", "isuzu-d-max"],
]

const objects = rows.map((row) => {
  const [id, brand, model, category, seats, luggage, daily, trip, available, partner, file] = row
  const photo = byFile.get(file)
  const verified = photo?.status === "verified"
  const src = verified ? `images/drive/vehicles/${file}.jpg` : "images/drive/vehicles/pending.svg"
  const name = `${brand} ${model}`
  return `  {
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(name)},
    brand: ${JSON.stringify(brand)},
    model: ${JSON.stringify(model)},
    category: ${JSON.stringify(category)},
    seats: ${seats},
    luggage: ${luggage},
    imageSrc: asset(${JSON.stringify(src)}),
    images: [{ src: asset(${JSON.stringify(src)}), demo: true }],
    imageStatus: ${JSON.stringify(verified ? "verified" : "pending")},
    partnerId: ${JSON.stringify(partner)},
    providerIds: [${JSON.stringify(partner)}],
    available: ${available},
    dailyRateFcfa: ${daily},
    tripRateFcfa: ${trip},
    demo: true,
  }`
})

const catalog = `import { asset } from "../lib/asset"
import type { DriveVehicle } from "./types"

/** Demonstration catalogue. Rates are fictional. Photos are licensed model pictures, not the YAMOO fleet. */
export const DEMO_VEHICLES: DriveVehicle[] = [
${objects.join(",\n")}
]

export const DEMO_CLIENT = {
  email: "demo.client@yamoo.demo",
  password: "demo",
  name: "Client Démo",
  role: "client" as const,
}

export const DEMO_ADMIN = {
  email: "demo.admin@yamoo.demo",
  password: "demo",
  name: "Admin Drive Démo",
  role: "admin" as const,
}
`

await writeFile(path.join(root, "src", "drive", "catalog.ts"), catalog)

const lines = [
  "# Sources des photographies Drive",
  "",
  "Photos de modèles sous licence libre (Wikimedia Commons). Ce ne sont pas les véhicules possédés par YAMOO. Aucune image Booking.com.",
  "",
  "| Modèle | Fichier | Source | Auteur | Licence | Attribution | Vérification | Statut |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
]
for (const row of rows) {
  const file = row[10]
  const photo = byFile.get(file)
  const model = `${row[1]} ${row[2]}`
  if (!photo || photo.status !== "verified") {
    lines.push(`| ${model} | pending.svg | — | — | — | non | manquante | pending |`)
    continue
  }
  const author = String(photo.author || "").replace(/\|/g, "/").replace(/\s+/g, " ").slice(0, 80)
  lines.push(`| ${model} | ${photo.image} | ${photo.sourceUrl} | ${author} | ${photo.license} | ${photo.attribution ? "oui" : "non"} | titre de fichier et licence | verified |`)
}
await writeFile(path.join(root, "docs", "quality", "DRIVE-IMAGE-SOURCES.md"), `${lines.join("\n")}\n`)
const verified = rows.filter((row) => byFile.get(row[10])?.status === "verified").length
console.log(`catalog ${rows.length} verified ${verified} pending ${rows.length - verified}`)
