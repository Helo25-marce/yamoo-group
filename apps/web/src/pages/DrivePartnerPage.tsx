import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import { getDriveState } from "../drive/store"
import { localePath, useLocale } from "../lib/locale"

export function DrivePartnerPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { partnerId = "" } = useParams()
  const state = getDriveState()
  const partner = state.partners.find((item) => item.id === partnerId) ?? null
  const offers = partner ? state.vehicles.filter((vehicle) => vehicle.partnerId === partner.id) : []

  return (
    <div className="ui-booking drive-commerce -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-8">
        <Link to={localePath(locale, "/drive")} className="drive-text-link">
          {t("nav.drive")}
        </Link>
        {!partner ? (
          <h1 className="drive-title-section mt-4">{t("drive.results.companyMissing")}</h1>
        ) : (
          <>
            <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-[var(--drive-focus)] uppercase">{t("drive.results.demoPartner")}</p>
            <h1 className="drive-title-section mt-1">{partner.name}</h1>
            <p className="drive-body mt-2">{partner.city} · {partner.phone}</p>
            {partner.description ? <p className="drive-body mt-2">{partner.description}</p> : null}
            <p className="drive-help mt-3">{t("drive.results.noLogo")}</p>
            <h2 className="mt-6 font-semibold">{t("drive.results.companyOffers", { count: offers.length })}</h2>
            <ul className="mt-3 grid gap-2">
              {offers.map((vehicle) => (
                <li key={vehicle.id}>
                  <Link className="drive-text-link" to={localePath(locale, `/drive/vehicules/${vehicle.id}`)}>
                    {vehicle.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
