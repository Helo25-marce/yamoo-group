import { useMemo, useState } from "react"
import { CarFront, ClipboardList, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, Navigate } from "react-router"
import { Button } from "../components/ui/Button"
import { formatFcfa } from "../drive/format"
import { addPartner, addVehicle, listBookings, listVehicles, savePromo, setDriveSession, transitionBooking, updateVehicle } from "../drive/store"
import { useDriveHydrated, useDriveStore } from "../drive/useDriveStore"
import type { DriveBookingStatus, DriveVehicleCategory } from "../drive/types"
import { asset } from "../lib/asset"
import { localePath, useLocale } from "../lib/locale"

const statuses: Array<DriveBookingStatus | "all"> = ["all", "pending", "confirmed", "refused", "cancelled", "completed"]

export function DriveAdminPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const ready = useDriveHydrated()
  const state = useDriveStore()
  const [filter, setFilter] = useState<DriveBookingStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")
  const [tab, setTab] = useState<"bookings" | "vehicles" | "partners" | "promos">("bookings")
  const [partnerName, setPartnerName] = useState("")
  const [partnerCity, setPartnerCity] = useState("Douala")
  const [partnerPhone, setPartnerPhone] = useState("")
  const [carName, setCarName] = useState("")
  const [carCategory, setCarCategory] = useState<DriveVehicleCategory>("berline")
  const [carPartner, setCarPartner] = useState("yamoo")
  const [promoCode, setPromoCode] = useState("")
  const [promoValue, setPromoValue] = useState("10")

  const bookings = useMemo(() => {
    const base = filter === "all" ? listBookings() : listBookings({ status: filter })
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (booking) =>
        booking.reference.toLowerCase().includes(q) ||
        booking.clientName.toLowerCase().includes(q) ||
        booking.clientEmail.toLowerCase().includes(q) ||
        booking.vehicleName.toLowerCase().includes(q),
    )
  }, [filter, query, state.bookings])

  const vehicles = listVehicles()
  const selected =
    selectedId
      ? bookings.find((booking) => booking.id === selectedId) ?? state.bookings.find((booking) => booking.id === selectedId)
      : null

  if (!ready) return null
  if (!state.session || state.session.role !== "admin") {
    return <Navigate to={localePath(locale, "/drive/connexion?next=admin")} replace />
  }

  function act(to: DriveBookingStatus) {
    if (!selectedId) return
    try {
      transitionBooking(selectedId, to, "admin", to === "refused" ? reason : undefined)
      setMessage(t("drive.admin.updated"))
      setReason("")
    } catch {
      setMessage(t("drive.err.transition"))
    }
  }

  return (
    <div className="ui-admin drive-admin-shell -mt-[4.75rem] pt-[4.75rem]">
      <div className="drive-admin-layout">
        <aside className="drive-admin-sidebar" aria-label={t("drive.admin.title")}>
          <div className="drive-admin-brand">
            <p>{t("drive.demoBadge")}</p>
            <h1 className="mt-2 text-base font-semibold text-white">{t("drive.admin.title")}</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{t("drive.admin.sidebarHint")}</p>
          </div>

          <button
            type="button"
            className={`drive-admin-nav-btn ${tab === "bookings" ? "is-active" : ""}`}
            onClick={() => setTab("bookings")}
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("drive.admin.tabBookings")}
          </button>
          <button
            type="button"
            className={`drive-admin-nav-btn ${tab === "vehicles" ? "is-active" : ""}`}
            onClick={() => setTab("vehicles")}
          >
            <CarFront className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("drive.admin.tabVehicles")}
          </button>
          <button type="button" className={`drive-admin-nav-btn ${tab === "partners" ? "is-active" : ""}`} onClick={() => setTab("partners")}>
            {t("drive.admin.tabPartners")}
          </button>
          <button type="button" className={`drive-admin-nav-btn ${tab === "promos" ? "is-active" : ""}`} onClick={() => setTab("promos")}>
            {t("drive.admin.tabPromos")}
          </button>

          <div className="mt-auto grid gap-2 pt-6">
            <Link to={localePath(locale, "/drive")} className="drive-admin-nav-btn">
              {t("drive.nav.book")}
            </Link>
            <button type="button" className="drive-admin-nav-btn" onClick={() => setDriveSession(null)}>
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("drive.auth.logout")}
            </button>
          </div>
        </aside>

        <div className="drive-admin-main">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {tab === "bookings" ? t("drive.admin.tabBookings") : tab === "vehicles" ? t("drive.admin.tabVehicles") : tab === "partners" ? t("drive.admin.tabPartners") : t("drive.admin.tabPromos")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t("drive.admin.subtitle")}</p>
            </div>
          </header>

          {message ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
          ) : null}

          {tab === "partners" ? (
            <section className="grid gap-4">
              <form
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!partnerName.trim()) return
                  addPartner({ name: partnerName, city: partnerCity, phone: partnerPhone })
                  setPartnerName("")
                  setMessage(t("drive.admin.partnerSaved"))
                }}
              >
                <label className="drive-field">{t("drive.admin.partnerName")}<input value={partnerName} onChange={(event) => setPartnerName(event.target.value)} /></label>
                <label className="drive-field">{t("drive.field.city")}<input value={partnerCity} onChange={(event) => setPartnerCity(event.target.value)} /></label>
                <label className="drive-field">{t("drive.field.phone")}<input value={partnerPhone} onChange={(event) => setPartnerPhone(event.target.value)} /></label>
                <button type="submit" className="drive-btn-primary h-11 self-end">{t("drive.admin.addPartner")}</button>
              </form>
              <ul className="grid gap-2">
                {(state.partners ?? []).map((partner) => (
                  <li key={partner.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                    <strong>{partner.name}</strong> · {partner.city} · {partner.phone}
                  </li>
                ))}
              </ul>
            </section>
          ) : tab === "promos" ? (
            <section className="grid gap-4">
              <form
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  const value = Number(promoValue)
                  if (!promoCode.trim() || !Number.isFinite(value) || value <= 0) return
                  savePromo({ code: promoCode, kind: "percent", value, active: true })
                  setPromoCode("")
                  setMessage(t("drive.admin.promoSaved"))
                }}
              >
                <label className="drive-field">{t("drive.checkout.promo")}<input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} /></label>
                <label className="drive-field">{t("drive.admin.promoPercent")}<input inputMode="numeric" value={promoValue} onChange={(event) => setPromoValue(event.target.value)} /></label>
                <button type="submit" className="drive-btn-primary h-11 self-end">{t("drive.admin.addPromo")}</button>
              </form>
              <ul className="grid gap-2">
                {(state.promos ?? []).map((promo) => (
                  <li key={promo.code} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                    <span><strong>{promo.code}</strong> · {promo.kind === "percent" ? `${promo.value} %` : formatFcfa(promo.value, locale)}</span>
                    <button type="button" className="drive-text-link" onClick={() => savePromo({ ...promo, active: !promo.active })}>
                      {promo.active ? t("drive.admin.disable") : t("drive.admin.enable")}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : tab === "bookings" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.75fr)]">
              <section className="min-w-0">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="drive-field min-w-[14rem] flex-1">
                    {t("drive.admin.search")}
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("drive.admin.searchPlaceholder")}
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFilter(status)}
                        className={`rounded-md border px-2.5 py-1.5 text-[0.7rem] font-semibold ${
                          filter === status
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-300 bg-white text-slate-600"
                        }`}
                      >
                        {status === "all" ? t("drive.admin.all") : t(`drive.status.${status}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="drive-admin-table min-w-full text-left">
                      <thead>
                        <tr>
                          <th>{t("drive.reference")}</th>
                          <th>{t("drive.field.name")}</th>
                          <th>{t("drive.field.vehicle")}</th>
                          <th>{t("drive.field.status")}</th>
                          <th>{t("drive.field.price")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className={`cursor-pointer ${selectedId === booking.id ? "is-selected" : ""}`}
                            onClick={() => setSelectedId(booking.id)}
                          >
                            <td className="font-semibold text-slate-900">{booking.reference}</td>
                            <td>{booking.clientName}</td>
                            <td>{booking.vehicleName}</td>
                            <td>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-slate-700">
                                {t(`drive.status.${booking.status}`)}
                              </span>
                            </td>
                            <td>{formatFcfa(booking.priceFcfa, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">{t("drive.admin.empty")}</p>
                  ) : null}
                </div>
              </section>

              <aside className="rounded-xl border border-slate-200 bg-white p-4">
                {selected ? (
                  <>
                    <h3 className="text-base font-semibold text-slate-900">{selected.reference}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selected.clientEmail} · {selected.clientPhone}
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-800">{selected.vehicleName}</p>
                    <p className="mt-1 font-semibold text-slate-900">{formatFcfa(selected.priceFcfa, locale)}</p>
                    <p className="mt-2 text-sm text-slate-600">{t(`drive.status.${selected.status}`)}</p>
                    <label className="drive-field mt-4">
                      {t("drive.field.reason")}
                      <input value={reason} onChange={(event) => setReason(event.target.value)} />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => act("confirmed")}>{t("drive.admin.confirm")}</Button>
                      <button type="button" className="drive-btn-secondary" onClick={() => act("refused")}>
                        {t("drive.admin.refuse")}
                      </button>
                      <button type="button" className="drive-btn-secondary" onClick={() => act("completed")}>
                        {t("drive.admin.complete")}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">{t("drive.admin.pick")}</p>
                )}
              </aside>
            </div>
          ) : (
            <section>
              <p className="text-sm text-slate-600">{t("drive.demoPrices")}</p>
              <form
                className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!carName.trim()) return
                  addVehicle({
                    name: carName,
                    category: carCategory,
                    seats: carCategory === "van" ? 7 : carCategory === "suv" ? 5 : 3,
                    luggage: carCategory === "van" ? 6 : carCategory === "suv" ? 4 : 2,
                    dailyRateFcfa: 100_000,
                    tripRateFcfa: 30_000,
                    partnerId: carPartner,
                    imageSrc: vehicles[0]?.imageSrc ?? asset("visuals/drive/vehicles/berline-executive.jpg"),
                  })
                  setCarName("")
                  setMessage(t("drive.admin.carSaved"))
                }}
              >
                <label className="drive-field">{t("drive.field.vehicle")}<input value={carName} onChange={(event) => setCarName(event.target.value)} /></label>
                <label className="drive-field">{t("drive.results.category")}
                  <select value={carCategory} onChange={(event) => setCarCategory(event.target.value as DriveVehicleCategory)}>
                    <option value="berline">{t("drive.category.berline")}</option>
                    <option value="suv">{t("drive.category.suv")}</option>
                    <option value="van">{t("drive.category.van")}</option>
                    <option value="prestige">{t("drive.category.prestige")}</option>
                    <option value="pickup">{t("drive.category.pickup")}</option>
                  </select>
                </label>
                <label className="drive-field">{t("drive.admin.tabPartners")}
                  <select value={carPartner} onChange={(event) => setCarPartner(event.target.value)}>
                    {(state.partners ?? []).map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
                  </select>
                </label>
                <button type="submit" className="drive-btn-primary h-11 md:col-span-3">{t("drive.admin.addCar")}</button>
              </form>
              <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={vehicle.imageSrc}
                      alt=""
                      className="h-28 w-full object-cover"
                      style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
                    />
                    <div className="p-3">
                      <p className="font-semibold text-slate-900">{vehicle.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatFcfa(vehicle.dailyRateFcfa, locale)} / {t("drive.day")} · {formatFcfa(vehicle.tripRateFcfa, locale)}{" "}
                        {t("drive.trip")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {vehicle.available ? t("drive.admin.enable") : t("drive.unavailable")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="drive-btn-secondary h-9 text-xs"
                          onClick={() => updateVehicle(vehicle.id, { available: !vehicle.available })}
                        >
                          {vehicle.available ? t("drive.admin.disable") : t("drive.admin.enable")}
                        </button>
                        <button
                          type="button"
                          className="drive-btn-secondary h-9 text-xs"
                          onClick={() => updateVehicle(vehicle.id, { dailyRateFcfa: vehicle.dailyRateFcfa + 5_000 })}
                        >
                          {t("drive.admin.bumpRate")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
