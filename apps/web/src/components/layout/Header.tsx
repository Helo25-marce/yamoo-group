import { useEffect, useState } from "react"
import { ChevronDown, Menu, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, useLocation, useNavigate } from "react-router"
import type { Locale } from "../../i18n/messages"
import { localePath, useLocale } from "../../lib/locale"
import { homeStills } from "../../content/visuals"
import { Button } from "../ui/Button"
import { Logo } from "../ui/Logo"
import { SearchField } from "../ui/SearchField"
import { cn } from "../../lib/cn"

export function Header() {
  const { t, i18n } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [finding, setFinding] = useState(false)
  const [worldsOpen, setWorldsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isHome = /^\/(fr|en)\/?$/.test(location.pathname)
  const solid = scrolled || open || finding || !isHome

  useEffect(() => {
    setOpen(false)
    setWorldsOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [location.pathname])

  useEffect(() => {
    if (!open && !finding && !worldsOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setOpen(false)
      setFinding(false)
      setWorldsOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, finding, worldsOpen])

  function switchLocale(next: Locale) {
    if (next === locale) return
    const path = location.pathname.replace(/^\/(fr|en)/, `/${next}`)
    void i18n.changeLanguage(next)
    navigate(`${path}${location.search}${location.hash}`)
  }

  const worldsActive = ["/media", "/drive", "/travel"].some((path) => location.pathname.endsWith(path))

  return (
    <header className={cn("yamoo-header", solid && "is-solid")}>
      <div className="yamoo-header-bg overflow-hidden" aria-hidden="true">
        <img src={homeStills.header} alt="" />
      </div>
      <div className="frame relative grid h-[4.75rem] grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5">
        <div className="justify-self-start -ml-0.5 pt-2.5 sm:-ml-1 sm:pt-3">
          <Logo to={localePath(locale, "/")} label="YAMOO GROUP" className="h-12 w-auto sm:h-[3.35rem]" />
        </div>

        <nav className="hidden items-center justify-center gap-7 xl:gap-8 lg:flex" aria-label="YAMOO">
          <NavLink to={localePath(locale, "/")} end className={({ isActive }) => cn("yamoo-nav-link", isActive && "is-active")}>
            {t("nav.home")}
          </NavLink>
          <NavLink to={localePath(locale, "/a-propos")} className={({ isActive }) => cn("yamoo-nav-link", isActive && "is-active")}>
            {t("nav.about")}
          </NavLink>
          <div className="relative">
            <button
              type="button"
              className={cn("yamoo-nav-link inline-flex items-center gap-1", worldsActive && "is-active")}
              aria-expanded={worldsOpen}
              onClick={() => setWorldsOpen((value) => !value)}
            >
              {t("nav.worlds")}
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 opacity-80" />
            </button>
            {worldsOpen ? (
              <div className="absolute top-[calc(100%-0.5rem)] left-1/2 z-50 min-w-44 -translate-x-1/2 rounded-xl border border-ivory/10 bg-night/95 py-2 shadow-[0_16px_32px_rgb(0_0_0/0.45)] backdrop-blur-md">
                {[
                  { to: "/media", label: "MEDIA" },
                  { to: "/drive", label: "DRIVE" },
                  { to: "/travel", label: "TRAVEL" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={localePath(locale, item.to)}
                    className="block px-4 py-2.5 text-sm text-ivory/85 hover:bg-night-elevated hover:text-gold"
                    onClick={() => setWorldsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link to={localePath(locale, "/informations")} className="yamoo-nav-link">
            {t("nav.works")}
          </Link>
          <Link to={localePath(locale, "/informations")} className="yamoo-nav-link">
            {t("nav.news")}
          </Link>
          <NavLink to={localePath(locale, "/informations")} className={({ isActive }) => cn("yamoo-nav-link", isActive && "is-active")}>
            {t("nav.contact")}
          </NavLink>
        </nav>

        <div className="flex items-center justify-self-end gap-3">
          <button
            type="button"
            className="hidden h-9 w-9 place-items-center text-ivory/90 transition duration-200 hover:text-gold md:grid"
            aria-expanded={finding}
            aria-controls="header-search-panel"
            aria-label={t("search.label")}
            onClick={() => setFinding((value) => !value)}
          >
            <Search aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
          </button>
          <div
            className="hidden items-center gap-1 text-[0.62rem] tracking-[0.14em] uppercase md:flex"
            role="group"
            aria-label={t("nav.language")}
          >
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={locale === code}
                onClick={() => switchLocale(code)}
                className={cn("px-0.5 transition duration-200 hover:text-ivory", locale === code ? "text-gold" : "text-muted/80")}
              >
                {code}
              </button>
            ))}
          </div>
          <div className="hidden lg:block">
            <Button to={`${localePath(locale, "/")}#univers`}>{t("nav.reserve")}</Button>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-ivory/15 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? t("nav.closeMenu") : t("nav.openMenu")}</span>
          </button>
        </div>
      </div>

      {finding ? (
        <div id="header-search-panel" className="hidden border-t border-ivory/10 py-3 md:block">
          <div className="frame">
            <SearchField
              id="header-search"
              autoFocus
              label={t("search.label")}
              placeholder={t("search.placeholder")}
              submitLabel={t("search.submit")}
            />
          </div>
        </div>
      ) : null}

      {open ? (
        <div id="mobile-menu" className="border-t border-ivory/10 bg-night/95 px-4 py-4 lg:hidden">
          <div className="mb-3 flex items-center gap-2 text-xs tracking-[0.14em] uppercase" role="group" aria-label={t("nav.language")}>
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={locale === code}
                onClick={() => switchLocale(code)}
                className={cn(locale === code ? "text-gold" : "text-muted")}
              >
                {code}
              </button>
            ))}
          </div>
          <SearchField
            id="menu-search"
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            submitLabel={t("search.submit")}
          />
          <nav className="mt-4 grid gap-1" aria-label="YAMOO">
            {[
              { to: "/", label: t("nav.home") },
              { to: "/a-propos", label: t("nav.about") },
              { to: "/media", label: "MEDIA" },
              { to: "/drive", label: "DRIVE" },
              { to: "/travel", label: "TRAVEL" },
              { to: "/informations", label: t("nav.works") },
              { to: "/informations", label: t("nav.news") },
              { to: "/informations", label: t("nav.contact") },
            ].map((item, index) => (
              <Link
                key={`${item.to}-${item.label}-${index}`}
                to={item.to.startsWith("/#") ? `${localePath(locale, "/")}#groupe` : localePath(locale, item.to)}
                className="rounded-xl px-3 py-3 text-lg text-ivory hover:bg-night-elevated"
              >
                {item.label}
              </Link>
            ))}
            <Link to={`${localePath(locale, "/")}#univers`} className="mt-2 rounded-full bg-gold px-3 py-3 text-center text-base font-semibold text-night">
              {t("nav.reserve")}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
