import { useParams } from "react-router"
import type { Locale } from "../i18n/messages"

export function isLocale(value: string | undefined): value is Locale {
  return value === "fr" || value === "en"
}

export function useLocale(): Locale {
  const { lang } = useParams()
  return lang === "en" ? "en" : "fr"
}

export function localePath(locale: Locale, to: string) {
  const hashAt = to.indexOf("#")
  const hash = hashAt >= 0 ? to.slice(hashAt) : ""
  const path = hashAt >= 0 ? to.slice(0, hashAt) : to
  if (path === "/" || path === "") return `/${locale}${hash}`
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}${hash}`
}
