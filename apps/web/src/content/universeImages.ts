import { asset } from "../lib/asset"
import sources from "./universe-images.json"

export type UniverseImage = { src: string; credit: string; source: string }

const table = sources as Record<string, { file: string; author: string; license: string; source: string }>

/** Licensed Wikimedia Commons photos (see scripts/fetch-universe-images.mjs). */
export function universeImage(key: string): UniverseImage | null {
  const entry = table[key]
  if (!entry) return null
  const author = entry.author.length > 48 ? `${entry.author.slice(0, 45)}…` : entry.author
  return { src: asset(entry.file), credit: `${author} · ${entry.license}`, source: entry.source }
}
