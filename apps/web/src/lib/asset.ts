/** Prefix public asset paths with Vite `base` (required for GitHub Pages project sites). */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL || "/"
  const normalized = path.replace(/^\//, "")
  return `${base}${normalized}`
}
