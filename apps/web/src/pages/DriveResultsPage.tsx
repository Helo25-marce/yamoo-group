import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router"
import { VehicleCard } from "../drive/VehicleCard"
import { formatFcfa } from "../drive/format"
import {
  buildDraftSearch,
  buildResultsSearch,
  buildWizardSearch,
  defaultFilters,
  listMatchingVehicles,
  parseResults,
  vehicleFit,
  vehicleQuote,
  type DriveResultFilters,
  type DriveSearchDraft,
} from "../drive/search"
import { listVehicles } from "../drive/store"
import { DriveAlert } from "../drive/ui/DriveAlert"
import { DriveDemoBanner } from "../drive/ui/DriveDemoBanner"
import { DriveSearchForm } from "../drive/ui/DriveSearchForm"
import { localePath, useLocale } from "../lib/locale"
import type { DriveVehicle, DriveVehicleCategory } from "../drive/types"

export function DriveResultsPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const vehicles = listVehicles()
  const parsed = useMemo(() => parseResults(params, vehicles), [params, vehicles])
  const [draft, setDraft] = useState<DriveSearchDraft>(parsed.draft)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    setDraft(parsed.draft)
  }, [parsed.draft])

  const label = (category: DriveVehicleCategory) => t(`drive.category.${category}`)
  const matches = parsed.query
    ? listMatchingVehicles(vehicles, parsed.query.criteria, parsed.query.filters, label)
    : []
  const compared = parsed.query
    ? parsed.query.compare
        .map((id) => vehicles.find((vehicle) => vehicle.id === id))
        .filter((vehicle): vehicle is DriveVehicle => Boolean(vehicle))
    : []

  function go(search: string) {
    navigate(`${localePath(locale, "/drive/resultats")}?${search}`)
  }

  function submit() {
    setNotice("")
    go(buildDraftSearch(draft, parsed.filters, parsed.compare))
  }

  function updateFilters(next: Partial<DriveResultFilters>, compare = parsed.compare) {
    if (!parsed.query) return
    go(
      buildResultsSearch({
        criteria: parsed.query.criteria,
        filters: { ...parsed.query.filters, ...next },
        compare,
      }),
    )
  }

  function toggleCompare(id: string) {
    if (!parsed.query) return
    const current = parsed.query.compare
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    if (next.length > 3) {
      setNotice(t("drive.err.compare"))
      return
    }
    setNotice("")
    updateFilters({}, next)
  }

  const message = notice || (parsed.errors[0] ? t(parsed.errors[0]) : parsed.warnings[0] ? t(parsed.warnings[0]) : "")
  const criteria = parsed.query?.criteria

  return (
    <div className="ui-booking drive-commerce -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-6 lg:py-8">
        <DriveDemoBanner />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="drive-title-section">{t("drive.results.title")}</h1>
            <p className="drive-body mt-1">{t("drive.results.lead")}</p>
          </div>
          <Link to={localePath(locale, "/drive")} className="drive-text-link">
            {t("drive.results.wizard")}
          </Link>
        </div>

        <section className="drive-panel mt-4 p-4 sm:p-5" aria-label={t("drive.results.edit")}>
          <h2 className="text-base font-semibold text-[var(--drive-text)]">{t("drive.results.edit")}</h2>
          <div className="mt-3">
            <DriveSearchForm draft={draft} onChange={setDraft} onSubmit={submit} />
          </div>
        </section>

        {message ? (
          <div className="mt-4">
            <DriveAlert>{message}</DriveAlert>
          </div>
        ) : null}

        {criteria ? (
          <div className="drive-results mt-4">
            <aside className="drive-filters-shell">
              <button type="button" className="drive-btn-secondary h-11 w-full lg:hidden" onClick={() => setFiltersOpen((open) => !open)}>
                {filtersOpen ? t("drive.results.closeFilters") : t("drive.results.openFilters")}
              </button>
              <div className={filtersOpen ? "drive-filters is-open" : "drive-filters"}>
                <h2 className="text-base font-semibold text-[var(--drive-text)]">{t("drive.results.filters")}</h2>
                <label className="drive-field mt-3">
                  {t("drive.filter.query")}
                  <input
                    value={parsed.filters.query}
                    onChange={(event) => updateFilters({ query: event.target.value })}
                    placeholder={t("drive.filter.queryPlaceholder")}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["all", "berline", "suv", "van", "prestige"] as const).map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`drive-chip rounded-full px-3 py-1.5 text-xs font-semibold ${parsed.filters.category === category ? "is-selected" : ""}`}
                      onClick={() => updateFilters({ category })}
                    >
                      {category === "all" ? t("drive.filter.all") : t(`drive.category.${category}`)}
                    </button>
                  ))}
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--drive-text)]">
                  <input
                    type="checkbox"
                    checked={parsed.filters.showUnavailable}
                    onChange={(event) => updateFilters({ showUnavailable: event.target.checked })}
                  />
                  {t("drive.filter.showUnavailable")}
                </label>
                <p className="drive-help mt-3">{t("drive.catalogOn")}</p>
                <button
                  type="button"
                  className="drive-text-link mt-3"
                  onClick={() =>
                    go(
                      buildResultsSearch({
                        criteria: { ...criteria, passengers: 1, luggage: 0 },
                        filters: defaultFilters(),
                        compare: parsed.query?.compare ?? [],
                      }),
                    )
                  }
                >
                  {t("drive.results.reset")}
                </button>
              </div>
            </aside>

            <div className="grid gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--drive-text)]">
                  {matches.length} {t("drive.results.count")}
                </p>
                <label className="drive-field min-w-44">
                  {t("drive.filter.sort")}
                  <select
                    value={parsed.filters.sort}
                    onChange={(event) => updateFilters({ sort: event.target.value as DriveResultFilters["sort"] })}
                  >
                    <option value="price-asc">{t("drive.filter.priceAsc")}</option>
                    <option value="price-desc">{t("drive.filter.priceDesc")}</option>
                    <option value="seats-desc">{t("drive.filter.seatsDesc")}</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {parsed.filters.category !== "all" ? (
                  <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ category: "all" })}>
                    {t(`drive.category.${parsed.filters.category}`)} · {t("drive.results.remove")}
                  </button>
                ) : null}
                {parsed.filters.query ? (
                  <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ query: "" })}>
                    {parsed.filters.query} · {t("drive.results.remove")}
                  </button>
                ) : null}
                {criteria.passengers > 1 ? (
                  <button
                    type="button"
                    className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs"
                    onClick={() =>
                      go(
                        buildResultsSearch({
                          ...parsed.query!,
                          criteria: { ...criteria, passengers: 1 },
                        }),
                      )
                    }
                  >
                    {criteria.passengers} {t("drive.seats")} · {t("drive.results.remove")}
                  </button>
                ) : null}
                {criteria.luggage > 0 ? (
                  <button
                    type="button"
                    className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs"
                    onClick={() =>
                      go(
                        buildResultsSearch({
                          ...parsed.query!,
                          criteria: { ...criteria, luggage: 0 },
                        }),
                      )
                    }
                  >
                    {criteria.luggage} {t("drive.luggage")} · {t("drive.results.remove")}
                  </button>
                ) : null}
                {parsed.filters.showUnavailable ? (
                  <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ showUnavailable: false })}>
                    {t("drive.filter.showUnavailable")} · {t("drive.results.remove")}
                  </button>
                ) : null}
              </div>

              <p className="drive-help">
                {t(`drive.service.${criteria.service === "chauffeur_daily" ? "daily" : criteria.service === "chauffeur_now" ? "now" : "later"}`)}
                {" · "}
                {criteria.startAt.replace("T", " ")}
                {criteria.service === "chauffeur_daily" ? ` → ${criteria.endAt.replace("T", " ")}` : ""}
                {criteria.pickup ? ` · ${criteria.pickup}` : ""}
                {criteria.dropoff ? ` → ${criteria.dropoff}` : ""}
              </p>

              {matches.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--drive-border)] bg-white px-4 py-8 text-center text-sm text-[var(--drive-text)]">
                  {t("drive.emptyVehicles")}
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {matches.map((vehicle) => {
                    const quote = vehicleQuote(criteria, vehicle)
                    const unit =
                      criteria.service === "chauffeur_daily"
                        ? `${quote.days} ${t(quote.days > 1 ? "drive.days" : "drive.day")}`
                        : t("drive.trip")
                    return (
                      <li key={vehicle.id}>
                        <VehicleCard
                          vehicle={vehicle}
                          service={criteria.service}
                          selected={false}
                          locale={locale}
                          priceLabel={formatFcfa(quote.priceFcfa, locale)}
                          priceUnit={unit}
                          compareOn={parsed.query?.compare.includes(vehicle.id)}
                          onCompare={() => toggleCompare(vehicle.id)}
                          selectLabel={t("drive.results.reserve")}
                          onSelect={() => {
                            if (vehicleFit(vehicle, criteria)) return
                            navigate(`${localePath(locale, "/drive")}?${buildWizardSearch(criteria, vehicle.id)}`)
                          }}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}

              {compared.length >= 2 ? (
                <section className="drive-compare" aria-label={t("drive.results.compareTitle")}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-[var(--drive-text)]">{t("drive.results.compareTitle")}</h2>
                    <button type="button" className="drive-text-link" onClick={() => updateFilters({}, [])}>
                      {t("drive.results.compareReset")}
                    </button>
                  </div>
                  <div className="drive-compare-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{t("drive.results.field")}</th>
                          {compared.map((vehicle) => (
                            <th key={vehicle.id} scope="col">
                              {vehicle.name}
                              <button type="button" className="drive-text-link" onClick={() => toggleCompare(vehicle.id)}>
                                {t("drive.results.compareRemove")}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label={t("drive.field.vehicle")} values={compared.map((vehicle) => vehicle.name)} />
                        <CompareRow label={t("drive.results.category")} values={compared.map((vehicle) => label(vehicle.category))} />
                        <CompareRow label={t("drive.seats")} values={compared.map((vehicle) => String(vehicle.seats))} />
                        <CompareRow label={t("drive.luggage")} values={compared.map((vehicle) => String(vehicle.luggage))} />
                        <CompareRow
                          label={t("drive.field.price")}
                          values={compared.map((vehicle) => formatFcfa(vehicleQuote(criteria, vehicle).priceFcfa, locale))}
                        />
                        <CompareRow
                          label={t("drive.field.status")}
                          values={compared.map((vehicle) => (vehicle.available ? t("drive.catalogOn") : t("drive.catalogOff")))}
                        />
                        <CompareRow label={t("drive.demoBadge")} values={compared.map(() => t("drive.demoPhoto"))} />
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        ) : null}

        {!criteria && parsed.errors.length === 0 && !params.toString() ? (
          <p className="drive-body mt-4">{t("drive.results.emptySearch")}</p>
        ) : null}
      </div>
    </div>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  const different = new Set(values).size > 1
  return (
    <tr className={different ? "is-diff" : undefined}>
      <th scope="row">{label}</th>
      {values.map((value, index) => (
        <td key={`${label}-${index}`}>{value}</td>
      ))}
    </tr>
  )
}
