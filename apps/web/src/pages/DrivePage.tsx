import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { BookingWizard } from "../drive/BookingWizard"
import { homeStills } from "../content/visuals"
import { localePath, useLocale } from "../lib/locale"

export function DrivePage() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <div className="ui-booking drive-commerce -mt-[4.75rem]">
      <section className="drive-commerce-hero pt-[4.75rem]">
        <img
          src={homeStills.drive}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="frame relative z-10 py-7 lg:py-9">
          <div className="flex w-full max-w-xl flex-col gap-3">
            <p className="text-[0.65rem] tracking-[0.28em] text-gold uppercase">{t("drive.eyebrow")}</p>
            <h1 className="font-display text-[1.85rem] leading-[1.15] text-balance text-ivory sm:text-3xl lg:text-[2.35rem]">
              {t("drive.title")}
            </h1>
            <p className="text-sm leading-relaxed text-pretty text-ivory/85 sm:text-[0.95rem]">{t("drive.leadApp")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link
                to={localePath(locale, "/drive/resultats")}
                className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-xs font-semibold text-[var(--color-night-elevated,#07172d)]"
              >
                {t("drive.results.openSearch")}
              </Link>
              <Link
                to={localePath(locale, "/drive/compte")}
                className="inline-flex h-9 items-center rounded-full border border-ivory/30 px-3.5 text-xs font-semibold text-ivory transition hover:border-gold hover:text-gold"
              >
                {t("drive.nav.account")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="frame relative z-10 -mt-6 pb-12 lg:-mt-8 lg:pb-16">
        <div className="drive-panel p-4 sm:p-6 lg:p-8">
          <BookingWizard />
        </div>
      </section>
    </div>
  )
}
