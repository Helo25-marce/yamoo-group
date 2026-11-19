import { useEffect, useMemo, useState } from "react"
import { Bus, Car, CarFront, Gem, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"
import { VehicleCard } from "../VehicleCard"
import {
  buildDraftSearch,
  buildResultsSearch,
  buildWizardSearch,
  capacityFilter,
  criteriaIssue,
  defaultFilters,
  listBrowseVehicles,
  listOf,
  parseResults,
  toCriteria,
  vehicleFit,
  vehicleQuote,
  type DriveResultFilters,
  type DriveSearchCriteria,
  type DriveSearchDraft,
} from "../search"
import { getDriveState, listBookings, listVehicles } from "../store"
import type { DriveVehicle, DriveVehicleCategory } from "../types"
import { localePath, useLocale } from "../../lib/locale"
import { DriveAlert } from "./DriveAlert"
import { vehicleHeld } from "../checkout"
import { formatFcfa } from "../format"
import { findPlace } from "../places"
import { DriveSearchForm } from "./DriveSearchForm"
import { PlaceMap } from "./PlaceMap"
import { FacetSection, PendingFacets, type FacetOption } from "./DriveFacets"
import { COMPARE_MAX } from "./SmartCompare"
import {
  CATEGORY_TARGETS,
  FACET_FAMILIES,
  LUGGAGE_THRESHOLDS,
  SEAT_THRESHOLDS,
  familyHasData,
  familyOptions,
  matchesFamily,
  selectionWith,
  todayIso,
  toggleOption,
  type FacetKey,
  type FacetSelection,
} from "../filters"

type Props = {
  path: "/drive" | "/drive/resultats"
}

const categoryIcon = {
  berline: Car,
  suv: CarFront,
  van: Bus,
  prestige: Gem,
  pickup: Truck,
} as const

const PAGE_SIZE = 10

const PRICE_BANDS = ["0-100", "100-130", "130-160", "160+"] as const

function draftFromCriteria(criteria: DriveSearchCriteria): DriveSearchDraft {
  return {
    service: criteria.service,
    startAt: criteria.startAt,
    endAt: criteria.service === "chauffeur_daily" ? criteria.endAt : "",
    pickup: criteria.pickup,
    dropoff: criteria.dropoff,
    passengers: String(criteria.passengers),
    luggage: String(criteria.luggage),
  }
}

export function DriveCatalog({ path }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const vehicles = listVehicles()
  const parsed = useMemo(() => parseResults(params, vehicles), [params, vehicles])
  const [draft, setDraft] = useState<DriveSearchDraft>(parsed.draft)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [limit, setLimit] = useState(PAGE_SIZE)

  const searchKey = params.toString()
  useEffect(() => {
    setDraft(parsed.draft)
    setBusy(false)
  }, [searchKey, parsed.draft])

  const listKey = (() => {
    const next = new URLSearchParams(params)
    next.delete("compare")
    return next.toString()
  })()
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [listKey])

  const label = (category: DriveVehicleCategory) => t(`drive.category.${category}`)
  const quoteUnit = (search: DriveSearchCriteria, days: number) =>
    search.service === "chauffeur_daily" ? `${days} ${t(days > 1 ? "drive.days" : "drive.day")}` : `1 ${t("drive.trip")}`
  const categories = useMemo(() => {
    const seen: DriveVehicleCategory[] = []
    for (const vehicle of vehicles) {
      if (!seen.includes(vehicle.category)) seen.push(vehicle.category)
    }
    return seen
  }, [vehicles])
  const partners = getDriveState().partners.filter((partner) => partner.active)
  const brands = [...new Set(vehicles.map((vehicle) => vehicle.brand).filter((brand): brand is string => Boolean(brand)))].sort()
  const capacity = capacityFilter(parsed.draft)
  const appliedCapacity = capacity.error
    ? { passengers: null, luggage: null }
    : { passengers: capacity.passengers, luggage: capacity.luggage }
  const criteria = parsed.query?.criteria ?? null
  const booked = listBookings()
  const matches = listBrowseVehicles(vehicles, parsed.filters, criteria
    ? { passengers: criteria.passengers, luggage: criteria.luggage }
    : appliedCapacity, criteria, label)
    .filter((vehicle) => !criteria || !vehicleHeld(vehicle.id, criteria.startAt, criteria.endAt, booked))
  const compared = parsed.compare
    .map((id) => vehicles.find((vehicle) => vehicle.id === id))
    .filter((vehicle): vehicle is DriveVehicle => Boolean(vehicle))

  function go(search: string) {
    navigate(`${localePath(locale, path)}${search ? `?${search}` : ""}`)
  }

  function currentDraft() {
    return criteria ? draftFromCriteria(criteria) : parsed.draft
  }

  function write(nextDraft: DriveSearchDraft, filters: DriveResultFilters, compare: string[]) {
    const complete = toCriteria(nextDraft)
    if (complete) {
      go(buildResultsSearch({ criteria: complete, filters, compare }))
      return
    }
    const url = new URLSearchParams(buildDraftSearch(nextDraft, filters, compare))
    const trip = ["service", "start", "end", "pickup", "dropoff"].some((key) => url.has(key))
    if (!trip && !filters.showUnavailable) url.set("unavailable", "0")
    go(url.toString())
  }

  function submit() {
    setBusy(true)
    const ready: DriveSearchDraft = {
      ...draft,
      service: "chauffeur_daily",
      passengers: draft.passengers || "1",
      luggage: draft.luggage || "0",
    }
    const issue = criteriaIssue(ready)
    if (issue) {
      setBusy(false)
      setNotice(t(issue))
      const search = buildDraftSearch(ready, parsed.filters, parsed.compare)
      if (search !== params.toString()) go(search)
      return
    }
    setNotice("")
    go(buildDraftSearch(ready, parsed.filters, parsed.compare))
  }

  function updateFilters(next: Partial<DriveResultFilters>, compare = parsed.compare) {
    setNotice("")
    write(currentDraft(), { ...parsed.filters, ...next }, compare)
  }

  function setCapacity(key: "passengers" | "luggage", value: string) {
    setNotice("")
    write({ ...currentDraft(), [key]: value }, parsed.filters, parsed.compare)
  }

  function toggleCompare(id: string) {
    const current = parsed.compare
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    if (next.length > COMPARE_MAX) {
      setNotice(t("drive.sc.max"))
      return
    }
    setNotice("")
    updateFilters({}, next)
  }

  function choose(vehicle: DriveVehicle) {
    if (!criteria) {
      setNotice(t("drive.results.pricePrompt"))
      document.getElementById("drive-search")?.scrollIntoView({ block: "start" })
      return
    }
    if (vehicleFit(vehicle, criteria)) return
    navigate(`${localePath(locale, "/drive/reservation")}?${buildWizardSearch(criteria, vehicle.id)}`)
  }

  const applied = criteria
    ? { passengers: criteria.passengers, luggage: criteria.luggage }
    : appliedCapacity
  const facetVehicles = (patch: Partial<DriveResultFilters>, capacity = applied) =>
    listBrowseVehicles(vehicles, { ...parsed.filters, ...patch }, capacity, criteria, label)
      .filter((vehicle) => !criteria || !vehicleHeld(vehicle.id, criteria.startAt, criteria.endAt, booked))

  const today = todayIso()
  const facets: FacetSelection = parsed.filters.facets ?? {}
  const selectedCategories = listOf(parsed.filters.category)
  const selectedProviders = listOf(parsed.filters.provider)
  const setFacets = (next: FacetSelection) => updateFilters({ facets: next })
  const optionLabel = (key: FacetKey, option: string) => {
    const custom = key === "extras" ? vehicles.flatMap((vehicle) => vehicle.selfDrive?.extras ?? []).find((extra) => extra.id === option)?.label : undefined
    return custom ?? t(`drive.f.opt.${key}.${option}`)
  }
  const toggleList = (list: string[], items: readonly string[]) => {
    const on = items.every((item) => list.includes(item))
    return on ? list.filter((item) => !items.includes(item)) : [...new Set([...list, ...items])]
  }

  const familySections = new Map<string, FacetOption[] | null>()
  const familyHelp = new Map<string, string>()
  for (const family of FACET_FAMILIES) {
    if (!familyHasData(family, vehicles, today)) {
      familySections.set(family.key, null)
      continue
    }
    const selected = facets[family.key] ?? []
    const options = familyOptions(family, vehicles, today)
      .filter((option) => selected.includes(option) || vehicles.some((vehicle) => matchesFamily(vehicle, family, [option], today)))
      .map((option) => ({
        id: option,
        label: optionLabel(family.key, option),
        count: facetVehicles({ facets: selectionWith(facets, family.key, option) }).length,
        checked: selected.includes(option),
        onToggle: () => setFacets(toggleOption(facets, family.key, option)),
      }))
    familySections.set(family.key, options)
    const unknown = vehicles.filter((vehicle) => family.values(vehicle, today) === null).length
    const notes = [
      family.mode === "all" ? t("drive.f.allRequired") : "",
      family.source === "specs" ? t("drive.f.demoSpecs") : "",
      unknown > 0 ? t("drive.f.unknown", { count: unknown }) : "",
    ].filter(Boolean)
    familyHelp.set(family.key, notes.join(" "))
  }

  const customSections: Record<string, FacetOption[]> = {
    provider: partners.map((partner) => ({
      id: partner.id,
      label: partner.name,
      count: facetVehicles({ provider: partner.id }).length,
      checked: selectedProviders.includes(partner.id),
      onToggle: () => updateFilters({ provider: toggleList(selectedProviders, [partner.id]).join(",") }),
    })),
    luggage: LUGGAGE_THRESHOLDS.map((bags, index) => {
      const selected = (criteria ? criteria.luggage : capacity.luggage) === bags
      return {
        id: String(bags),
        label: index === LUGGAGE_THRESHOLDS.length - 1 ? t("drive.f.bagsMax", { count: bags }) : t("drive.f.bagsMin", { count: bags }),
        count: facetVehicles({}, { passengers: applied.passengers, luggage: bags }).length,
        checked: selected,
        onToggle: () => setCapacity("luggage", selected ? (criteria ? "0" : "") : String(bags)),
      }
    }),
    category: CATEGORY_TARGETS.filter((target) => target.from.length > 0).map((target) => ({
      id: target.id,
      label: t(`drive.f.opt.category.${target.id}`),
      count: facetVehicles({ category: target.from.join(",") }).length,
      checked: target.from.every((item) => selectedCategories.includes(item)),
      onToggle: () => {
        const next = toggleList(selectedCategories, target.from)
        updateFilters({ category: next.length > 0 ? next.join(",") : "all" })
      },
    })),
    seats: SEAT_THRESHOLDS.map((seats, index) => {
      const selected = (criteria ? criteria.passengers : capacity.passengers) === seats
      return {
        id: String(seats),
        label: index === SEAT_THRESHOLDS.length - 1 ? t("drive.f.seatsMax", { count: seats }) : t("drive.f.seatsMin", { count: seats }),
        count: facetVehicles({}, { passengers: seats, luggage: applied.luggage }).length,
        checked: selected,
        onToggle: () => setCapacity("passengers", selected ? (criteria ? "1" : "") : String(seats)),
      }
    }),
  }
  const customHelp: Record<string, string> = {
    luggage: t("drive.f.luggageHelp"),
    seats: t("drive.f.seatsHelp"),
  }

  const FAMILY_ORDER = [
    "pickupmode", "transmission", "provider", "promo", "mileage", "extras", "luggage", "category", "dailyband",
    "seats", "rating", "insurance", "payment", "features", "fuel", "deposit", "fuelpolicy",
  ] as const
  const pending: Array<{ key: string; title: string; reason: string }> = []
  const sections = FAMILY_ORDER.map((key) => {
    const options = key in customSections ? customSections[key] : key === "insurance" ? null : familySections.get(key) ?? null
    if (!options) {
      const source = key === "insurance" ? "insurance" : FACET_FAMILIES.find((family) => family.key === key)?.source ?? "offer"
      pending.push({ key, title: t(`drive.f.title.${key}`), reason: t(`drive.f.reason.${source}`) })
      return null
    }
    return (
      <FacetSection
        key={key}
        title={t(`drive.f.title.${key}`)}
        options={options}
        help={customHelp[key] ?? familyHelp.get(key) ?? undefined}
        compact={key === "provider" ? 5 : 6}
        searchable={key === "provider"}
        searchLabel={t("drive.f.searchProvider")}
      />
    )
  })

  function resetAll() {
    if (criteria) {
      go(buildResultsSearch({
        criteria: { ...criteria, passengers: 1, luggage: 0 },
        filters: defaultFilters(),
        compare: parsed.compare,
      }))
      return
    }
    const url = new URLSearchParams()
    if (parsed.compare.length > 0) url.set("compare", parsed.compare.join(","))
    go(url.toString())
  }


  const message = notice || (parsed.errors[0] ? t(parsed.errors[0]) : parsed.warnings[0] ? t(parsed.warnings[0]) : "")
  const knownPlace = findPlace(criteria?.pickup || draft.pickup)
  const sheetQuery = criteria
    ? buildResultsSearch(parsed.query!)
    : (() => {
        const search = buildDraftSearch(parsed.draft, parsed.filters, parsed.compare)
        const url = new URLSearchParams(search)
        if (!parsed.filters.showUnavailable) url.set("unavailable", "0")
        return url.toString()
      })()

  return (
    <div className="ui-booking drive-commerce drive-catalog -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-4">
        <section id="drive-search" className="drive-booking-shell mt-3" aria-label={t("drive.results.edit")}>
          <DriveSearchForm draft={draft} busy={busy} onChange={setDraft} onSubmit={submit} />
        </section>

        {message ? (
          <div className="mt-3">
            <DriveAlert>{message}</DriveAlert>
          </div>
        ) : null}

        <div className="drive-results mt-3">
          <aside className="drive-filters-shell">
            <button type="button" className="drive-btn-secondary drive-filters-toggle h-11 w-full" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              {t("drive.results.openFilters")}
            </button>
            {filtersOpen ? (
              <button type="button" className="drive-filters-backdrop" aria-label={t("drive.results.closeFilters")} onClick={() => setFiltersOpen(false)} />
            ) : null}
            <div className={filtersOpen ? "drive-filters is-open" : "drive-filters"}>
              {knownPlace ? (
                <div className="drive-filter-map">
                  <PlaceMap selected={knownPlace} compact />
                  <p className="drive-help">{t("drive.place.mapKnown", { name: knownPlace.n })}</p>
                </div>
              ) : null}
              <div className="drive-filter-head">
                <h2>{t("drive.results.filters")}</h2>
                <button type="button" className="drive-filters-close" onClick={() => setFiltersOpen(false)}>
                  {t("drive.results.closeFilters")}
                </button>
                <button type="button" className="drive-text-link" onClick={resetAll}>
                  {t("drive.results.reset")}
                </button>
              </div>
              <label className="drive-field mt-3">
                {t("drive.filter.query")}
                <input
                  value={parsed.filters.query}
                  onChange={(event) => updateFilters({ query: event.target.value })}
                  placeholder={t("drive.filter.queryPlaceholder")}
                />
              </label>
              {sections}
              <FacetSection
                title={t("drive.results.brand")}
                options={brands.map((brand) => ({
                  id: brand,
                  label: brand,
                  count: facetVehicles({ brand }).length,
                  checked: parsed.filters.brand === brand,
                  onToggle: () => updateFilters({ brand: parsed.filters.brand === brand ? "" : brand }),
                }))}
              />
              <FacetSection
                title={t("drive.results.priceBand")}
                options={PRICE_BANDS.filter((band) => facetVehicles({ priceBand: band }).length > 0 || parsed.filters.priceBand === band).map((band) => ({
                  id: band,
                  label: t(`drive.results.band.${band}`),
                  count: facetVehicles({ priceBand: band }).length,
                  checked: parsed.filters.priceBand === band,
                  onToggle: () => updateFilters({ priceBand: parsed.filters.priceBand === band ? "" : band }),
                }))}
              />
              {facetVehicles({ showUnavailable: true }).some((vehicle) => !vehicle.available) ? (
                <FacetSection
                  title={t("drive.field.status")}
                  options={[{
                    id: "unavailable",
                    label: t("drive.filter.showUnavailable"),
                    count: facetVehicles({ showUnavailable: true }).filter((vehicle) => !vehicle.available).length,
                    checked: parsed.filters.showUnavailable,
                    onToggle: () => updateFilters({ showUnavailable: !parsed.filters.showUnavailable }),
                  }]}
                />
              ) : null}
              <PendingFacets items={pending} />
              <div className="drive-filters-foot">
                <button type="button" className="drive-btn-primary h-11 px-4 text-sm" onClick={() => setFiltersOpen(false)}>
                  {t("drive.f.seeResults", { count: matches.length })}
                </button>
              </div>
            </div>
          </aside>

          <div className="drive-results-main grid gap-3">
            <div className="drive-results-head">
              <h1 className="drive-catalog-count">
                <span className="sr-only">{t("drive.results.title")} </span>
                {matches.length} {t("drive.results.count")}
              </h1>
              <label className="drive-field drive-sort">
                <span className="sr-only">{t("drive.filter.sort")}</span>
                <select
                  aria-label={t("drive.filter.sort")}
                  title={t("drive.filter.recommendedRule")}
                  value={parsed.filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value as DriveResultFilters["sort"] })}
                >
                  <option value="recommended">{t("drive.filter.recommended")}</option>
                  <option value="price-asc">{t("drive.filter.priceAsc")}</option>
                  <option value="price-desc">{t("drive.filter.priceDesc")}</option>
                  <option value="seats-desc">{t("drive.filter.seatsDesc")}</option>
                </select>
                <span className="sr-only">{t("drive.filter.recommendedRule")}</span>
              </label>
            </div>

            <div className="drive-categories" role="toolbar" aria-label={t("drive.results.categories")}>
              <button
                type="button"
                className={`drive-cat ${parsed.filters.category === "all" ? "is-selected" : ""}`}
                onClick={() => updateFilters({ category: "all" })}
              >
                <Car className="h-6 w-6" aria-hidden="true" />
                {t("drive.filter.all")}
              </button>
              {categories.map((category) => {
                const Icon = categoryIcon[category]
                return (
                  <button
                    key={category}
                    type="button"
                    className={`drive-cat ${parsed.filters.category === category ? "is-selected" : ""}`}
                    onClick={() => updateFilters({ category })}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    {label(category)}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {parsed.filters.category !== "all" ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ category: "all" })}>
                  {label(parsed.filters.category as DriveVehicleCategory)} · {t("drive.results.remove")}
                </button>
              ) : null}
              {parsed.filters.brand ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ brand: "" })}>
                  {parsed.filters.brand} · {t("drive.results.remove")}
                </button>
              ) : null}
              {parsed.filters.provider ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ provider: "" })}>
                  {partners.find((partner) => partner.id === parsed.filters.provider)?.name ?? parsed.filters.provider} · {t("drive.results.remove")}
                </button>
              ) : null}
              {parsed.filters.priceBand ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ priceBand: "" })}>
                  {t(`drive.results.band.${parsed.filters.priceBand}`)} · {t("drive.results.remove")}
                </button>
              ) : null}
              {parsed.filters.query ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ query: "" })}>
                  {parsed.filters.query} · {t("drive.results.remove")}
                </button>
              ) : null}
              {(criteria ? criteria.passengers > 1 : capacity.passengers !== null && capacity.passengers > 1) ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => setCapacity("passengers", criteria ? "1" : "")}>
                  {(criteria ? criteria.passengers : capacity.passengers)} {t("drive.seats")} · {t("drive.results.remove")}
                </button>
              ) : null}
              {(criteria ? criteria.luggage > 0 : capacity.luggage !== null && capacity.luggage > 0) ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => setCapacity("luggage", "0")}>
                  {(criteria ? criteria.luggage : capacity.luggage)} {t("drive.luggage")} · {t("drive.results.remove")}
                </button>
              ) : null}
              {parsed.filters.showUnavailable && criteria ? (
                <button type="button" className="drive-chip is-selected rounded-full px-3 py-1.5 text-xs" onClick={() => updateFilters({ showUnavailable: false })}>
                  {t("drive.filter.showUnavailable")} · {t("drive.results.remove")}
                </button>
              ) : null}
            </div>

            {criteria ? (
              <p className="drive-help">
                {t(`drive.service.${criteria.service === "chauffeur_daily" ? "daily" : criteria.service === "chauffeur_now" ? "now" : "later"}`)}
                {" · "}
                {criteria.startAt.replace("T", " ")}
                {criteria.service === "chauffeur_daily" ? ` → ${criteria.endAt.replace("T", " ")}` : ""}
                {criteria.pickup ? ` · ${criteria.pickup}` : ""}
                {criteria.dropoff ? ` → ${criteria.dropoff}` : ""}
              </p>
            ) : (
              <p className="drive-help">{t("drive.results.lead")}</p>
            )}

            {matches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--drive-border)] bg-white px-4 py-8 text-center text-sm text-[var(--drive-text)]">
                {t("drive.emptyVehicles")}
              </p>
            ) : (
              <>
              <ul className="grid gap-4">
                {matches.slice(0, limit).map((vehicle) => {
                  const quote = criteria ? vehicleQuote(criteria, vehicle) : null
                  return (
                    <li key={vehicle.id}>
                      <VehicleCard
                        vehicle={vehicle}
                        service={criteria?.service ?? "chauffeur_daily"}
                        selected={false}
                        locale={locale}
                        layout="row"
                        priceLabel={quote ? formatFcfa(quote.priceFcfa, locale) : undefined}
                        priceUnit={criteria && quote ? quoteUnit(criteria, quote.days) : undefined}
                        pricePrompt={criteria ? undefined : t("drive.results.pricePrompt")}
                        compareOn={parsed.compare.includes(vehicle.id)}
                        onCompare={() => toggleCompare(vehicle.id)}
                        selectLabel={t("drive.results.choose")}
                        sheetLabel={t("drive.results.viewOffer")}
                        supplier={partners.find((partner) => partner.id === (vehicle.partnerId ?? "yamoo")) ?? null}
                        sheetHref={`${localePath(locale, `/drive/vehicules/${vehicle.id}`)}${sheetQuery ? `?${sheetQuery}` : ""}`}
                        pickup={criteria?.pickup ?? ""}
                        onSelect={() => choose(vehicle)}
                      />
                    </li>
                  )
                })}
              </ul>
              <div className="drive-pager">
                <p aria-live="polite">{t("drive.results.shown", { shown: Math.min(limit, matches.length), total: matches.length })}</p>
                {matches.length > limit ? (
                  <button type="button" className="drive-btn-secondary h-11 px-6 text-sm" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                    {t("drive.filter.showMore")}
                  </button>
                ) : null}
              </div>
              </>
            )}

            {compared.length >= 2 && !parsed.errors.includes("drive.err.compare") ? (
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
                        values={compared.map((vehicle) => (criteria ? formatFcfa(vehicleQuote(criteria, vehicle).priceFcfa, locale) : "—"))}
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
