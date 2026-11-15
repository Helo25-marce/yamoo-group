import { Navigate } from "react-router"
import { localePath, useLocale } from "../lib/locale"

/** Legacy route — institutional content lives on /a-propos. */
export function InfoPage() {
  const locale = useLocale()
  return <Navigate to={localePath(locale, "/a-propos")} replace />
}
