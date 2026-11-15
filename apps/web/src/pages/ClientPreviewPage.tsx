import { Calendar, Compass, House, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { SearchField } from "../components/ui/SearchField"
import { marks } from "../content/marks"
import { localePath, useLocale } from "../lib/locale"

export function ClientPreviewPage() {
  const { t } = useTranslation()
  const locale = useLocale()

  const doors = [
    { href: "/media", label: "YAMOO MEDIA", mark: marks.media },
    { href: "/drive", label: "YAMOO DRIVE", mark: marks.drive },
    { href: "/travel", label: "YAMOO TRAVEL", mark: marks.travel },
  ]

  return (
    <div className="pb-24">
      <p className="bg-gold px-4 py-3 text-center text-sm font-semibold text-night">{t("preview.banner")}</p>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl text-ivory">{t("preview.hello", { name: t("preview.sampleName") })}</h1>
        <p className="mt-2 text-sm text-muted">{t("preview.sampleNote")}</p>
        <p className="mt-4 text-lg text-ivory">{t("preview.prompt")}</p>
        <SearchField
          id="preview-search"
          className="mt-6"
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          submitLabel={t("search.submit")}
        />
        <div className="mt-6 grid grid-cols-3 gap-3">
          {doors.map((door) => (
            <Link
              key={door.href}
              to={localePath(locale, door.href)}
              aria-label={door.label}
              className="grid place-items-center rounded-2xl border border-ivory/10 bg-night p-3 hover:border-gold"
            >
              <img src={door.mark} alt="" className="h-auto w-full" />
            </Link>
          ))}
        </div>

        <section id="reservations" className="mt-10 scroll-mt-24 rounded-2xl border border-ivory/10 p-6">
          <h2 className="font-display text-2xl">{t("preview.reservations")}</h2>
          <p className="mt-3 text-muted">{t("preview.reservationsEmpty")}</p>
        </section>
        <section id="notifications" className="mt-4 scroll-mt-24 rounded-2xl border border-ivory/10 p-6">
          <h2 className="font-display text-2xl">{t("preview.notifications")}</h2>
          <p className="mt-3 text-muted">{t("preview.notificationsEmpty")}</p>
        </section>
        <section id="profil" className="mt-4 scroll-mt-24 rounded-2xl border border-ivory/10 p-6">
          <h2 className="font-display text-2xl">{t("preview.profile")}</h2>
          <p className="mt-3 text-muted">{t("preview.profileEmpty")}</p>
        </section>
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory/10 bg-night/95 backdrop-blur"
        aria-label={t("preview.home")}
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          <li>
            <Link to={localePath(locale, "/apercu-client")} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-gold">
              <House aria-hidden="true" className="h-5 w-5" />
              {t("preview.home")}
            </Link>
          </li>
          <li>
            <a href="#reservations" className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-ivory">
              <Calendar aria-hidden="true" className="h-5 w-5" />
              {t("preview.reservations")}
            </a>
          </li>
          <li>
            <a href={`${localePath(locale, "/")}#univers`} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-ivory">
              <Compass aria-hidden="true" className="h-5 w-5" />
              {t("preview.discover")}
            </a>
          </li>
          <li>
            <a href="#profil" className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-ivory">
              <UserRound aria-hidden="true" className="h-5 w-5" />
              {t("preview.profile")}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}
