import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "../components/ui/Button"
import { cn } from "../lib/cn"
import { localePath, useLocale } from "../lib/locale"
import { VehicleCard } from "./VehicleCard"
import { formatFcfa, whatsappDriveLink } from "./format"
import { calculateDrivePrice } from "./pricing"
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
  const [step, setStep] = useState<Step>("service")
  const [service, setService] = useState<DriveServiceKind | null>(null)
  const [startAt, setStartAt] = useState(toLocalInput(defaultStart()))
  const [endAt, setEndAt] = useState(() => {
    const date = defaultStart()
    date.setDate(date.getDate() + 1)
    return toLocalInput(date)
  })
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [passengers, setPassengers] = useState(2)
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<DriveVehicleCategory | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("price-asc")
  const [vehicleQuery, setVehicleQuery] = useState("")
  const [showUnavailable, setShowUnavailable] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [booking, setBooking] = useState<DriveBooking | null>(null)

  const vehicles = listVehicles()
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null
  const stepIndex = steps.indexOf(step)
  const needsRoute = service === "chauffeur_now" || service === "chauffeur_later"

  const filteredVehicles = useMemo(() => {
    const rate = (item: (typeof vehicles)[number]) =>
      service === "chauffeur_daily" ? item.dailyRateFcfa : item.tripRateFcfa
    const q = vehicleQuery.trim().toLowerCase()

    return vehicles
      .filter((item) => (showUnavailable ? true : item.available))
      .filter((item) => item.seats >= passengers)
      .filter((item) => (categoryFilter === "all" ? true : item.category === categoryFilter))
      .filter((item) => {
        if (!q) return true
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          t(`drive.category.${item.category}`).toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortKey === "seats-desc") return b.seats - a.seats
        if (sortKey === "price-desc") return rate(b) - rate(a)
        return rate(a) - rate(b)
      })
  }, [vehicles, showUnavailable, passengers, categoryFilter, sortKey, service, vehicleQuery, t])

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
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError(t("drive.err.dates"))
      return false
    }
    if (service === "chauffeur_daily" && end < start) {
      setError(t("drive.err.range"))
      return false
    }
    if (needsRoute && (!pickup.trim() || !dropoff.trim())) {
      setError(t("drive.err.places"))
      return false
    }
    if (passengers < 1 || passengers > 8) {
      setError(t("drive.err.passengers"))
      return false
    }
    return true
  }

  function validateContact() {
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setError(t("drive.err.contact"))
      return false
    }
    if (!clientEmail.includes("@")) {
      setError(t("drive.err.email"))
      return false
    }
    return true
  }

  function confirm() {
    if (!service || !vehicleId || !validateContact()) return
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-[0.72rem] font-semibold tracking-wide text-amber-900 uppercase">{t("drive.demoBadge")}</p>
        <p className="text-xs text-amber-800/90">{t("drive.demoPersist")}</p>
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("drive.stepsLabel")}>
        {steps.map((item, index) => {
          const active = index === stepIndex
          const done = index < stepIndex
          return (
            <li
              key={item}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-[0.72rem] font-semibold",
                active && "border-[#b8923a] bg-[#fff8eb] text-[#7a5a14]",
                done && !active && "border-emerald-200 bg-emerald-50 text-emerald-800",
                !active && !done && "border-slate-200 bg-slate-50 text-slate-500",
              )}
            >
              <span className="block text-[0.62rem] font-medium opacity-70">{index + 1}</span>
              {t(stepLabelKey[item])}
            </li>
          )
        })}
      </ol>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === "service" ? (
        <section className="mt-6 grid gap-3">
          <h2 className="font-display text-2xl text-slate-900">{t("drive.step.service")}</h2>
          <p className="text-sm text-slate-600">{t("drive.step.serviceHelp")}</p>
          {services.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setService(value)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                service === value ? "border-[#b8923a] bg-[#fff8eb]" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="block font-semibold text-slate-900">{label}</span>
              <span className="mt-1 block text-sm text-slate-600">{t(`drive.service.${value}Hint`)}</span>
            </button>
          ))}
          <div className="mt-2 flex justify-end">
            <Button className="min-w-36" disabled={!service} onClick={() => service && go("trip")}>
              {t("drive.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === "trip" ? (
        <section className="mt-6 grid gap-4">
          <h2 className="font-display text-2xl text-slate-900">{t("drive.step.trip")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="drive-field">
              {t("drive.field.start")}
              <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
            </label>
            {service === "chauffeur_daily" ? (
              <label className="drive-field">
                {t("drive.field.end")}
                <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
              </label>
            ) : (
              <label className="drive-field">
                {t("drive.field.passengers")}
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value) || 1)}
                />
              </label>
            )}
          </div>
          {service === "chauffeur_daily" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="drive-field">
                {t("drive.field.city")}
                <input
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  placeholder={t("drive.field.cityPlaceholder")}
                />
              </label>
              <label className="drive-field">
                {t("drive.field.passengers")}
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value) || 1)}
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="drive-field">
                {t("drive.field.pickup")}
                <input
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  placeholder={t("drive.field.pickupPlaceholder")}
                />
              </label>
              <label className="drive-field">
                {t("drive.field.dropoff")}
                <input
                  value={dropoff}
                  onChange={(event) => setDropoff(event.target.value)}
                  placeholder={t("drive.field.dropoffPlaceholder")}
                />
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="drive-btn-secondary" onClick={() => go("service")}>
              <ArrowLeft className="h-4 w-4" />
              {t("drive.back")}
            </button>
            <Button
              onClick={() => {
                if (validateTrip()) go("vehicle")
              }}
            >
              {t("drive.searchVehicles")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === "vehicle" ? (
        <section className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-slate-900">{t("drive.step.vehicle")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("drive.demoPrices")}</p>
            </div>
            <p className="text-sm text-slate-500">
              {filteredVehicles.length} {t("drive.results")}
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
              <input
                type="number"
                min={1}
                max={8}
                value={passengers}
                onChange={(event) => setPassengers(Number(event.target.value) || 1)}
              />
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
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  categoryFilter === category
                    ? "border-[#b8923a] bg-[#fff8eb] text-[#7a5a14]"
                    : "border-slate-200 bg-white text-slate-600",
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
            <Button disabled={!vehicleId} onClick={() => vehicleId && go("contact")}>
              {t("drive.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === "contact" ? (
        <section className="mt-6 grid gap-4">
          <h2 className="font-display text-2xl text-slate-900">{t("drive.step.contact")}</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {service
                ? t(`drive.service.${service === "chauffeur_daily" ? "daily" : service === "chauffeur_now" ? "now" : "later"}`)
                : ""}
            </p>
            <p className="mt-2">{vehicle?.name}</p>
            <p className="mt-2 inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#b8923a]" aria-hidden="true" />
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
              {passengers} {t("drive.seats")}
            </p>
            {quote ? (
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {formatFcfa(quote.priceFcfa, locale)}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  · {quote.days} {t("drive.days")}
                </span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-amber-800">{t("drive.demoPrices")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="text-xs font-semibold text-[#8a6a20] underline" onClick={() => go("service")}>
                {t("drive.editService")}
              </button>
              <button type="button" className="text-xs font-semibold text-[#8a6a20] underline" onClick={() => go("trip")}>
                {t("drive.editTrip")}
              </button>
              <button type="button" className="text-xs font-semibold text-[#8a6a20] underline" onClick={() => go("vehicle")}>
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
            <Button disabled={busy} onClick={confirm}>
              {busy ? t("drive.saving") : t("drive.confirm")}
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === "done" && booking ? (
        <section className="mt-6 grid gap-4">
          <h2 className="font-display text-2xl text-slate-900">{t("drive.step.done")}</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">{t("drive.demoSaved")}</p>
            <p className="mt-3 text-sm text-slate-600">{t("drive.reference")}</p>
            <p className="mt-1 font-display text-3xl text-slate-900">{booking.reference}</p>
            <p className="mt-3 text-sm font-semibold text-slate-800">{t("drive.status.pending")}</p>
            <p className="mt-2 text-sm text-slate-600">
              {formatFcfa(booking.priceFcfa, locale)} · {t("drive.demoPrices")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to={localePath(locale, "/drive/compte")}>{t("drive.openAccount")}</Button>
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
