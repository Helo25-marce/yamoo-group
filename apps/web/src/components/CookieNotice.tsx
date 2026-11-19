import { useState } from "react"
import { useTranslation } from "react-i18next"

const KEY = "yamoo.cookie"

export function CookieNotice() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return "essential"
    }
  })

  if (choice) return null

  function save(value: "essential" | "all") {
    localStorage.setItem(KEY, value)
    document.cookie = `yamoo_cookie=${value}; Path=/; Max-Age=15552000; SameSite=Lax`
    setChoice(value)
  }

  return (
    <div className="cookie-notice" role="dialog" aria-label={t("cookies.title")}>
      <p className="font-semibold">{t("cookies.title")}</p>
      <p className="mt-1 text-sm">{t("cookies.body")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="drive-btn-primary h-10" onClick={() => save("all")}>{t("cookies.accept")}</button>
        <button type="button" className="drive-btn-secondary h-10" onClick={() => save("essential")}>{t("cookies.essential")}</button>
      </div>
    </div>
  )
}
