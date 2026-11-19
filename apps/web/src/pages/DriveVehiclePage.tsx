import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { vehicleHeld } from "../drive/checkout"
import { presentFacts } from "../drive/gallery"
import { formatFcfa } from "../drive/format"
import { buildResultsSearch, buildWizardSearch, parseResults, vehicleFit, vehicleQuote } from "../drive/search"
import { listBookings, listVehicles } from "../drive/store"
import { DriveAlert } from "../drive/ui/DriveAlert"
import { ImportantInfo } from "../drive/ui/ImportantInfo"
import { VehicleGallery } from "../drive/ui/VehicleGallery"
import { DriveProgress, TripTimeline, VehicleMini, useFlowCopy } from "../drive/ui/DriveFlow"
import { Briefcase, Car, Check, Clock, IdCard, Phone, Users } from "lucide-react"
import { localePath, useLocale } from "../lib/locale"

export function DriveVehiclePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const flow = useFlowCopy()
  const navigate = useNavigate()
  const { vehicleId = "" } = useParams()
  const [params] = useSearchParams()
  const vehicles = listVehicles()
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null
  const parsed = useMemo(() => parseResults(params, vehicles), [params, vehicles])
  const criteria = parsed.query?.criteria ?? null
  const quote = vehicle && criteria ? vehicleQuote(criteria, vehicle) : null
  const held = vehicle && criteria ? vehicleHeld(vehicle.id, criteria.startAt, criteria.endAt, listBookings()) : false
  const fit = vehicle && criteria ? vehicleFit(vehicle, criteria) ?? (held ? "drive.err.unavailable" : null) : null
  const facts = presentFacts(vehicle?.facts)
  const resultsTo = `${localePath(locale, "/drive/resultats")}${params.toString() ? `?${params.toString()}` : ""}`
  const message = !vehicle
    ? ""
    : fit
      ? t(fit)
      : parsed.errors[0]
        ? t(parsed.errors[0])
        : parsed.warnings[0]
          ? t(parsed.warnings[0])
          : ""

  function reserve() {
    if (!vehicle || !criteria || fit) return
    navigate(`${localePath(locale, "/drive/commande")}?${buildWizardSearch(criteria, vehicle.id)}&step=extras`)
  }

  return (
    <div className="ui-booking drive-commerce drive-sheet -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-6 lg:py-8">
        <nav className="drive-breadcrumb mt-4" aria-label={t("drive.sheet.breadcrumb")}>
          <Link to={localePath(locale, "/drive")}>{t("nav.drive")}</Link>
          <span aria-hidden="true">/</span>
          <Link to={resultsTo}>{t("drive.results.title")}</Link>
          {vehicle ? (
            <>
              <span aria-hidden="true">/</span>
              <span>{vehicle.name}</span>
            </>
          ) : null}
        </nav>

        {!vehicle ? (
          <section className="drive-panel mt-4 p-5">
            <h1 className="drive-title-section">{t("drive.sheet.missingTitle")}</h1>
            <p className="drive-body mt-2">{t("drive.sheet.missingBody")}</p>
            <Link to={resultsTo} className="drive-btn-primary mt-4 inline-flex">
              {t("drive.sheet.backResults")}
            </Link>
          </section>
        ) : (
          <>
          <div className="mt-4">
            <DriveProgress current="deal" />
          </div>
          <div className="drive-sheet-layout mt-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--drive-focus)] uppercase">
                {t(`drive.category.${vehicle.category}`)}
              </p>
              <h1 className="drive-title-section mt-1">{vehicle.name}</h1>
              <ul className="dflow-chips mt-2">
                <li><Users size={14} aria-hidden="true" /> {vehicle.seats} {flow.seats}</li>
                <li><Briefcase size={14} aria-hidden="true" /> {vehicle.luggage} {flow.bags}</li>
                <li><Car size={14} aria-hidden="true" /> {flow.chauffeur}</li>
              </ul>
              <p className="drive-help mt-2">{flow.similar}</p>
              {vehicle.partnerId ? (
                <p className="mt-2">
                  <Link className="drive-text-link" to={localePath(locale, `/drive/entreprises/${vehicle.partnerId}`)}>
                    {t("drive.results.viewCompany")}
                  </Link>
                </p>
              ) : null}
              <p className="mt-2">
                <ImportantInfo />
              </p>
              <VehicleGallery vehicle={vehicle} />
              <section className="dflow-card mt-5">
                <h2 className="dflow-h2">{flow.included}</h2>
                <ul className="dflow-checks">
                  {flow.includedItems.map((item) => (
                    <li key={item}><Check size={18} aria-hidden="true" /> {item}</li>
                  ))}
                </ul>
              </section>
              <section className="dflow-card mt-4">
                <h2 className="dflow-h2">{flow.checklist}</h2>
                <p className="drive-help mt-1">{flow.checklistLead}</p>
                <ol className="dflow-steps-list">
                  {flow.checks.map(([title, body], index) => {
                    const Icon = [Clock, IdCard, Phone][index]
                    return (
                      <li key={title}>
                        <Icon size={20} aria-hidden="true" />
                        <div>
                          <p className="font-semibold">{title}</p>
                          <p className="drive-help">{body}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
              <dl className="drive-sheet-facts">
                <div>
                  <dt>{t("drive.results.category")}</dt>
                  <dd>{t(`drive.category.${vehicle.category}`)}</dd>
                </div>
                <div>
                  <dt>{t("drive.seats")}</dt>
                  <dd>{vehicle.seats}</dd>
                </div>
                <div>
                  <dt>{t("drive.luggage")}</dt>
                  <dd>{vehicle.luggage}</dd>
                </div>
                <div>
                  <dt>{t("drive.field.status")}</dt>
                  <dd>{vehicle.available ? t("drive.catalogOn") : t("drive.catalogOff")}</dd>
                </div>
                {facts.map((fact) => (
                  <div key={fact.key}>
                    <dt>{t(`drive.sheet.fact.${fact.key}`)}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside className="drive-sheet-panel drive-panel p-4 sm:p-5" aria-label={t("drive.sheet.summary")}>
              <h2 className="text-base font-semibold text-[var(--drive-text)]">{t("drive.sheet.summary")}</h2>
              {message ? (
                <div className="mt-3">
                  <DriveAlert>{message}</DriveAlert>
                </div>
              ) : null}
              {criteria && quote ? (
                <>
                  <VehicleMini vehicle={vehicle} compact />
                  <TripTimeline criteria={criteria} fallbackCity={t("drive.field.cityDefault")} />
                  <div className="dflow-total">
                    <div>
                      <p className="font-semibold">{flow.total}</p>
                      <p className="drive-help">
                        {flow.vehiclePrice} · {criteria.service === "chauffeur_daily" ? `${quote.days} ${t(quote.days > 1 ? "drive.days" : "drive.day")}` : t("drive.trip")}
                      </p>
                    </div>
                    <p className="dflow-amount">{formatFcfa(quote.priceFcfa, locale)}</p>
                  </div>
                </>
              ) : (
                <p className="drive-body mt-3">{t("drive.sheet.incomplete")}</p>
              )}
              {criteria && !fit ? (
                <button type="button" className="drive-btn-primary drive-sheet-reserve mt-4 w-full" onClick={reserve}>
                  {t("drive.checkout.continue")}
                </button>
              ) : criteria && fit ? (
                <button type="button" className="drive-btn-primary drive-sheet-reserve mt-4 w-full" disabled>
                  {fit === "drive.err.unavailable" ? t("drive.unavailable") : t("drive.sheet.blocked")}
                </button>
              ) : (
                <Link to={resultsTo} className="drive-btn-primary drive-sheet-reserve mt-4 w-full">
                  {t("drive.sheet.completeSearch")}
                </Link>
              )}
              {criteria && quote ? (
                <dl className="drive-sheet-summary">
                  <div>
                    <dt>{t("drive.results.service")}</dt>
                    <dd>{t(`drive.service.${criteria.service === "chauffeur_daily" ? "daily" : criteria.service === "chauffeur_now" ? "now" : "later"}`)}</dd>
                  </div>
                  <div>
                    <dt>{t("drive.field.passengers")}</dt>
                    <dd>{criteria.passengers}</dd>
                  </div>
                  <div>
                    <dt>{t("drive.field.luggage")}</dt>
                    <dd>{criteria.luggage}</dd>
                  </div>
                </dl>
              ) : null}
              <p className="drive-help mt-3">{t("drive.demoPrices")}</p>
              {parsed.query ? (
                <p className="drive-help mt-3">
                  <Link to={`${localePath(locale, "/drive/resultats")}?${buildResultsSearch(parsed.query)}`} className="drive-text-link">
                    {t("drive.sheet.backResults")}
                  </Link>
                </p>
              ) : null}
            </aside>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
