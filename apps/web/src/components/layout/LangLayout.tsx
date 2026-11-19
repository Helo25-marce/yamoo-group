import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation, useParams } from "react-router"
import { CookieNotice } from "../CookieNotice"
import { Footer } from "./Footer"
import { Header } from "./Header"
import { isLocale } from "../../lib/locale"

export function LangLayout() {
  const { lang } = useParams()
  const { i18n, t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    if (!isLocale(lang) || i18n.language === lang) return
    void i18n.changeLanguage(lang)
  }, [i18n, lang])

  useEffect(() => {
    if (!isLocale(lang)) return
    document.documentElement.lang = lang
    document.title = t("meta.title")
  }, [lang, t, location.pathname])

  if (!isLocale(lang)) return <Navigate to="/fr" replace />

  return (
    <div className="ui-institutional flex min-h-svh flex-col bg-transparent">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-night"
      >
        {t("skip")}
      </a>
      <Header />
      <main id="contenu" className="relative flex-1 bg-transparent pt-[4.75rem]">
        <Outlet />
      </main>
      <Footer />
      <CookieNotice />
    </div>
  )
}
