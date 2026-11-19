export type DemoRequest = {
  reference: string
  createdAt: string
  summary: Record<string, string>
}

type Scope = "media" | "travel"

const KEYS: Record<Scope, string> = {
  media: "yamoo.media.v1",
  travel: "yamoo.travel.v1",
}

const PREFIX: Record<Scope, string> = {
  media: "YM",
  travel: "YT",
}

export function loadRequests(scope: Scope): DemoRequest[] {
  try {
    const raw = window.localStorage.getItem(KEYS[scope])
    const parsed = raw ? (JSON.parse(raw) as { requests?: DemoRequest[] }) : null
    return Array.isArray(parsed?.requests) ? parsed.requests : []
  } catch {
    return []
  }
}

export function saveRequest(scope: Scope, summary: Record<string, string>): DemoRequest {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0")
  const request: DemoRequest = { reference: `${PREFIX[scope]}-${stamp}-${random}`, createdAt: now.toISOString(), summary }
  const requests = [request, ...loadRequests(scope)]
  window.localStorage.setItem(KEYS[scope], JSON.stringify({ version: 1, requests }))
  return request
}

/** Cameroon mobile numbers: optional +237 / 237, then 9 digits starting with 6. */
export function isCameroonPhone(value: string) {
  return /^(?:\+?237)?6\d{8}$/.test(value.replace(/[\s.-]/g, ""))
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}
