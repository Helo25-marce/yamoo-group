import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router"
import { cn } from "../lib/cn"
import { localePath, useLocale } from "../lib/locale"
import { VehicleCard } from "./VehicleCard"
import { serviceNeedsRoute } from "./services"
import { contactIssue } from "./validation"
import { DateTimeField } from "./ui/DateTimeField"
import { DriveAlert } from "./ui/DriveAlert"
import { DriveButton } from "./ui/DriveButton"
import { PlaceField } from "./ui/PlaceField"
import { DriveDemoBanner } from "./ui/DriveDemoBanner"
import { DriveStatusBadge } from "./ui/DriveStatusBadge"
import { formatFcfa, whatsappDriveLink } from "./format"
import { calculateDrivePrice } from "./pricing"
import { buildDraftSearch, criteriaIssue, listMatchingVehicles, resolveWizardEntry, toCriteria, vehicleFit } from "./search"
import { createBooking, listVehicles } from "./store"
import type { DriveBooking, DriveServiceKind, DriveVehicleCategory } from "./types"

const steps = ["service", "trip", "vehicle", "contact", "done"] as const
type Step = (typeof steps)[number]

const stepLabelKey: Record<Step, string> = {
  service: "drive.step.serviceShort",
  trip: "drive.step.tripShort",
  vehicle: "drive.step.vehicleShort",
  contact: "drive.step.contactShort",
  done: "drive.step.doneShort",
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultStart() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 2)
  return date
}

type SortKey = "price-asc" | "price-desc" | "seats-desc"

export function BookingWizard() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [params] = useSearchParams()
  const entry = resolveWizardEntry(params, listVehicles())
  const prefill = entry.kind === "prefill" ? entry : null
  const [step, setStep] = useState<Step>(prefill?.step ?? "service")
  const [service, setService] = useState<DriveServiceKind | null>(prefill?.service ?? null)
  const [startAt, setStartAt] = useState(prefill ? prefill.startAt : toLocalInput(defaultStart()))
  const [endAt, setEndAt] = useState(() => {
    if (prefill) return prefill.endAt
    const date = defaultStart()
    date.setDate(date.getDate() + 1)
    return toLocalInput(date)
  })
  const [pickup, setPickup] = useState(prefill?.pickup ?? "")
  const [dropoff, setDropoff] = useState(prefill?.dropoff ?? "")
  const [passengers, setPassengers] = useState(prefill ? prefill.passengers : "2")
  const [luggage, setLuggage] = useState(prefill ? prefill.luggage : "0")
  const [vehicleId, setVehicleId] = useState<string | null>(prefill?.vehicleId ?? null)
  const [categoryFilter, setCategoryFilter] = useState<DriveVehicleCategory | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("price-asc")
  const [vehicleQuery, setVehicleQuery] = useState("")
  const [showUnavailable, setShowUnavailable] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [error, setError] = useState(prefill?.error ? t(prefill.error) : prefill?.warning ? t(prefill.warning) : "")
  const [busy, setBusy] = useState(false)
  const [booking, setBooking] = useState<DriveBooking | null>(null)

  const vehicles = listVehicles()
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null
  const stepIndex = steps.indexOf(step)
  const needsRoute = service ? serviceNeedsRoute(service) : false

  const tripDraft = {
    service: service ?? "",
    startAt,
    endAt: service === "chauffeur_daily" ? endAt : startAt,
    pickup,
    dropoff,
    passengers,
    luggage,
  }

  const filteredVehicles = useMemo(() => {
    if (!service) return []
    const criteria = toCriteria({
      service,
      startAt,
      endAt: service === "chauffeur_daily" ? endAt : startAt,
      pickup,
      dropoff,
      passengers,
      luggage,
    })
    if (!criteria) return []
    return listMatchingVehicles(
      vehicles,
      criteria,
      { category: categoryFilter, query: vehicleQuery, showUnavailable, sort: sortKey, brand: "", provider: "", priceBand: "" },
      (category) => t(`drive.category.${category}`),
    )
  }, [vehicles, showUnavailable, passengers, luggage, categoryFilter, sortKey, service, vehicleQuery, startAt, endAt, pickup, dropoff, t])

  const quote = useMemo(() => {
    if (!service || !vehicle) return null
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    return calculateDrivePrice({ service, vehicle, startAt: start, endAt: end })
  }, [service, vehicle, startAt, endAt])

  function go(next: Step) {
    setError("")
    setStep(next)
  }

  function validateTrip() {
    if (!service) return false
    const issue = criteriaIssue(tripDraft)
    if (issue) {
      setError(t(issue))
      return false
    }
    return true
  }

  function validateContact() {
    const issue = contactIssue({ name: clientName, phone: clientPhone, email: clientEmail })
    if (issue) {
      setError(t(issue))
      return false
    }
    return true
  }

  function confirm() {
    if (!service || !vehicleId || !validateTrip() || !validateContact()) return
    setBusy(true)
    setError("")
    try {
      const created = createBooking({
        service,
        vehicleId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(service === "chauffeur_daily" ? endAt : startAt).toISOString(),
        pickup: needsRoute ? pickup : pickup || t("drive.field.cityDefault"),
        dropoff: needsRoute ? dropoff : dropoff || "—",
        clientName,
        clientPhone,
        clientEmail,
      })
      setBooking(created)
      go("done")
    } catch {
      setError(t("drive.err.save"))
    } finally {
      setBusy(false)
    }
  }

  const services = [
    ["chauffeur_daily", t("drive.service.daily")],
    ["chauffeur_now", t("drive.service.now")],
    ["chauffeur_later", t("drive.service.later")],
  ] as const

  return (
    <div>
      <DriveDemoBanner />

      <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("drive.stepsLabel")}>
        {steps.map((item, index) => {
          const active = index === stepIndex
          const done = index < stepIndex
          return (
            <li
              key={item}
              className={cn(
                "drive-step rounded-xl px-2 py-2 text-center text-xs font-semibold",
                active && "is-active",
                done && !active && "is-done",
                !active && !done && "text-[var(--drive-text-muted)]",
              )}
            >
              <span className="block text-xs font-medium opacity-70">{index + 1}</span>
              {t(stepLabelKey[item])}
            </li>
          )
        })}
      </ol>

      {error ? <div className="mt-4"><DriveAlert>{error}</DriveAlert></div> : null}

      {step === "service" ? (
        <section className="mt-6 grid gap-3">
          <h2 className="drive-title-section">{t("drive.step.service")}</h2>
          <p className="drive-body">{t("drive.step.serviceHelp")}</p>
          {services.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setService(value)}
              className={cn(
                "drive-choice rounded-2xl px-4 py-4 text-left transition",
                service === value && "is-selected",
              )}
            >
              <span className="block font-semibold text-slate-900">{label}</span>
              <span className="mt-1 block text-sm text-slate-600">{t(`drive.service.${value}Hint`)}</span>
            </button>
          ))}
          <div className="mt-2 flex justify-end">
            <DriveButton className="min-w-36" disabled={!service} onClick={() => service && go("trip")}>
              {t("drive.next")}
              <ArrowRight className="h-4 w-4" />
            </DriveButton>
          </div>
        </section>
      ) : null}

      {step === "trip" ? (
        <section className="mt-6 grid gap-4">
          <h2 className="drive-title-section">{t("drive.step.trip")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateTimeField dateLabel={t("drive.field.start")} value={startAt} onChange={setStartAt} />
            {service === "chauffeur_daily" ? (
              <DateTimeField dateLabel={t("drive.field.end")} value={endAt} onChange={setEndAt} />
            ) : (
              <label className="drive-field">
                {t("drive.field.passengers")}
                <input
                  inputMode="numeric"
                  value={passengers}
                  onChange={(event) => setPassengers(event.target.value)}
                />
              </label>
            )}
          </div>
          {service === "chauffeur_daily" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceField
                label={t("drive.field.city")}
                value={pickup}
                placeholder={t("drive.place.placeholder")}
                onChange={setPickup}
              />
              <label className="drive-field">
                {t("drive.field.passengers")}
                <input
                  inputMode="numeric"
                  value={passengers}
                  onChange={(event) => setPassengers(event.target.value)}
                />
              </label>
              <label className="drive-field">
                {t("drive.field.luggage")}
                <input
                  inputMode="numeric"
                  value={luggage}
                  onChange={(event) => setLuggage(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceField
                label={t("drive.field.pickup")}
                value={pickup}
                placeholder={t("drive.place.placeholder")}
                onChange={setPickup}
              />
              <PlaceField
                label={t("drive.field.dropoff")}
                value={dropoff}
                placeholder={t("drive.field.dropoffPlaceholder")}
                onChange={setDropoff}
              />
              <label className="drive-field">
                {t("drive.field.luggage")}
                <input
                  inputMode="numeric"
                  value={luggage}
                  onChange={(event) => setLuggage(event.target.value)}
                />
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="drive-btn-secondary" onClick={() => go("service")}>
              <ArrowLeft className="h-4 w-4" />
              {t("drive.back")}
            </button>
            <DriveButton
              onClick={() => {
                if (validateTrip()) go("vehicle")
              }}
            >
              {t("drive.searchVehicles")}
              <ArrowRight className="h-4 w-4" />
            </DriveButton>
          </div>
        </section>
      ) : null}

      {step === "vehicle" ? (
        <section className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="drive-title-section">{t("drive.step.vehicle")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("drive.demoPrices")}</p>
            </div>
            <p className="text-sm text-slate-500">
              {filteredVehicles.length} {t("drive.resultCount")}
            </p>
          </div>

          <div className="drive-search-bar" role="search" aria-label={t("drive.filter.searchBar")}>
            <label className="drive-field">
              {t("drive.filter.query")}
              <input
                value={vehicleQuery}
                onChange={(event) => setVehicleQuery(event.target.value)}
                placeholder={t("drive.filter.queryPlaceholder")}
              />
            </label>
            <label className="drive-field">
              {t("drive.field.passengers")}
              <input inputMode="numeric" value={passengers} onChange={(event) => setPassengers(event.target.value)} />
            </label>
            <label className="drive-field">
              {t("drive.filter.sort")}
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                <option value="price-asc">{t("drive.filter.priceAsc")}</option>
                <option value="price-desc">{t("drive.filter.priceDesc")}</option>
                <option value="seats-desc">{t("drive.filter.seatsDesc")}</option>
              </select>
            </label>
            <button
              type="button"
              className="drive-btn-secondary h-11 w-full md:w-auto"
              onClick={() => setVehicleId(null)}
            >
              {t("drive.filter.apply")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["all", "berline", "suv", "van", "prestige"] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={cn(
                  "drive-chip rounded-full px-3 py-1.5 text-xs font-semibold",
                  categoryFilter === category && "is-selected",
                )}
              >
                {category === "all" ? t("drive.filter.all") : t(`drive.category.${category}`)}
              </button>
            ))}
            <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showUnavailable}
                onChange={(event) => setShowUnavailable(event.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              {t("drive.filter.showUnavailable")}
            </label>
          </div>

          {filteredVehicles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              {t("drive.emptyVehicles")}
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {filteredVehicles.map((item) => (
                <li key={item.id}>
                  <VehicleCard
                    vehicle={item}
                    service={service ?? "chauffeur_daily"}
                    selected={vehicleId === item.id}
                    locale={locale}
                    sheetHref={
                      service
                        ? `${localePath(locale, `/drive/vehicules/${item.id}`)}?${buildDraftSearch(
                            {
                              service,
                              startAt,
                              endAt: service === "chauffeur_daily" ? endAt : startAt,
                              pickup,
                              dropoff,
                              passengers,
                              luggage,
                            },
                            { category: categoryFilter, query: vehicleQuery, showUnavailable, sort: sortKey, brand: "", provider: "", priceBand: "" },
                            [],
                          )}`
                        : localePath(locale, `/drive/vehicules/${item.id}`)
                    }
                    onSelect={() => setVehicleId(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="drive-btn-secondary" onClick={() => go("trip")}>
              <ArrowLeft className="h-4 w-4" />
              {t("drive.back")}
            </button>
            <DriveButton
              disabled={!vehicleId}
              onClick={() => {
                if (!service || !vehicleId || !validateTrip()) return
                const chosen = vehicles.find((item) => item.id === vehicleId)
                const criteria = toCriteria(tripDraft)
                if (!chosen || !criteria) {
                  setError(t(chosen ? "drive.err.incomplete" : "drive.err.vehicle"))
                  return
                }
                const fit = vehicleFit(chosen, criteria)
                if (fit) {
                  setError(t(fit))
                  return
                }
                go("contact")
              }}
            >
              {t("drive.next")}
              <ArrowRight className="h-4 w-4" />
            </DriveButton>
          </div>
        </section>
      ) : null}

      {step === "contact" ? (
        <section className="mt-6 grid gap-4">
          <h2 className="drive-title-section">{t("drive.step.contact")}</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {service
                ? t(`drive.service.${service === "chauffeur_daily" ? "daily" : service === "chauffeur_now" ? "now" : "later"}`)
                : ""}
            </p>
            <p className="mt-2">{vehicle?.name}</p>
            <p className="mt-2 inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[var(--drive-focus)]" aria-hidden="true" />
              {new Date(startAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB")}
            </p>
            {service === "chauffeur_daily" ? (
              <p className="mt-1">{new Date(endAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB")}</p>
            ) : null}
            {pickup ? (
              <p className="mt-2">
                {t("drive.field.pickup")}: {pickup}
              </p>
            ) : null}
            {dropoff ? (
              <p>
                {t("drive.field.dropoff")}: {dropoff}
              </p>
            ) : null}
            <p className="mt-1">
              {passengers} {t("drive.seats")} · {luggage} {t("drive.luggage")}
            </p>
            {quote ? (
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {formatFcfa(quote.priceFcfa, locale)}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  · {quote.days} {t("drive.days")}
                </span>
              </p>
            ) : null}
            <p className="drive-help mt-2 text-[var(--drive-warning)]">{t("drive.demoPrices")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="drive-text-link" onClick={() => go("service")}>
                {t("drive.editService")}
              </button>
              <button type="button" className="drive-text-link" onClick={() => go("trip")}>
                {t("drive.editTrip")}
              </button>
              <button type="button" className="drive-text-link" onClick={() => go("vehicle")}>
                {t("drive.editVehicle")}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="drive-field">
              {t("drive.field.name")}
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" />
            </label>
            <label className="drive-field">
              {t("drive.field.phone")}
              <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} autoComplete="tel" />
            </label>
            <label className="drive-field">
              {t("drive.field.email")}
              <input
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                autoComplete="email"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">{t("drive.contactHint")}</p>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="drive-btn-secondary" onClick={() => go("vehicle")}>
              <ArrowLeft className="h-4 w-4" />
              {t("drive.back")}
            </button>
            <DriveButton disabled={busy} onClick={confirm}>
              {busy ? t("drive.saving") : t("drive.confirm")}
              <Check className="h-4 w-4" />
            </DriveButton>
          </div>
        </section>
      ) : null}

      {step === "done" && booking ? (
        <section className="mt-6 grid gap-4">
          <h2 className="drive-title-section">{t("drive.step.done")}</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">{t("drive.demoSaved")}</p>
            <p className="mt-3 text-sm text-slate-600">{t("drive.reference")}</p>
            <p className="mt-1 font-display text-3xl text-slate-900">{booking.reference}</p>
            <p className="mt-3"><DriveStatusBadge status="pending" /></p>
            <p className="mt-2 text-sm text-slate-600">
              {formatFcfa(booking.priceFcfa, locale)} · {t("drive.demoPrices")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DriveButton to={localePath(locale, "/drive/compte")}>{t("drive.openAccount")}</DriveButton>
            <a href={whatsappDriveLink(booking)} target="_blank" rel="noreferrer" className="drive-btn-secondary">
              {t("drive.whatsapp")}
            </a>
            <Link
              to={localePath(locale, "/drive")}
              className="drive-btn-secondary"
              onClick={() => {
                setBooking(null)
                setStep("service")
                setVehicleId(null)
              }}
            >
              {t("drive.newBooking")}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
