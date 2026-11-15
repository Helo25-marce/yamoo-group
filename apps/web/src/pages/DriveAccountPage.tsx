import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, Navigate } from "react-router"
import { Button } from "../components/ui/Button"
import { formatFcfa } from "../drive/format"
import { nextStatuses } from "../drive/status"
import { getBooking, listBookings, listNotifications, markNotificationsRead, setDriveSession, transitionBooking } from "../drive/store"
import { useDriveHydrated, useDriveStore } from "../drive/useDriveStore"
import { localePath, useLocale } from "../lib/locale"

export function DriveAccountPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const ready = useDriveHydrated()
  const state = useDriveStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  if (!ready) return null
  if (!state.session || state.session.role !== "client") {
    return <Navigate to={localePath(locale, "/drive/connexion?next=compte")} replace />
  }

  const bookings = listBookings({ email: state.session.email })
  const notifications = listNotifications(state.session.email)
  const selected = selectedId ? getBooking(selectedId) : null

  function cancel(id: string) {
    try {
      transitionBooking(id, "cancelled", "client")
      setMessage(t("drive.account.cancelled"))
    } catch {
      setMessage(t("drive.err.transition"))
    }
  }

  return (
    <div className="yamoo-page-surface -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-8 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.18em] text-gold uppercase">{t("drive.demoBadge")}</p>
            <h1 className="mt-2 font-display text-3xl text-ivory">{t("drive.account.title")}</h1>
            <p className="mt-2 text-sm text-muted">{state.session.name} · {state.session.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={localePath(locale, "/drive")} className="yamoo-btn-ghost h-10 px-4 text-xs">{t("drive.nav.book")}</Link>
            <Button
              variant="ghost"
              className="h-10 px-4 text-xs"
              onClick={() => {
                setDriveSession(null)
              }}
            >
              {t("drive.auth.logout")}
            </Button>
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-gold">{message}</p> : null}

        <section className="mt-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl text-ivory">{t("drive.account.notifications")}</h2>
            <button type="button" className="text-xs text-gold" onClick={() => markNotificationsRead(state.session!.email)}>
              {t("drive.account.markRead")}
            </button>
          </div>
          <ul className="mt-3 grid gap-2">
            {notifications.slice(0, 8).map((item) => (
              <li key={item.id} className={`rounded-xl border px-3 py-2 text-sm ${item.read ? "border-ivory/10 text-muted" : "border-gold/30 text-ivory"}`}>
                {t(item.messageKey)} · {new Date(item.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB")}
              </li>
            ))}
            {notifications.length === 0 ? <li className="text-sm text-muted">{t("drive.account.noNotif")}</li> : null}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl text-ivory">{t("drive.account.bookings")}</h2>
          <ul className="mt-3 grid gap-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(booking.id)}
                  className="w-full rounded-2xl border border-ivory/15 bg-[#030c1b]/45 p-4 text-left hover:border-gold/40"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ivory">{booking.reference}</span>
                    <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs text-gold">{t(`drive.status.${booking.status}`)}</span>
                  </span>
                  <span className="mt-2 block text-sm text-muted">
                    {booking.vehicleName} · {formatFcfa(booking.priceFcfa, locale)}
                  </span>
                </button>
              </li>
            ))}
            {bookings.length === 0 ? <li className="text-sm text-muted">{t("drive.account.empty")}</li> : null}
          </ul>
        </section>

        {selected ? (
          <section className="mt-6 rounded-2xl border border-gold/30 bg-[#030c1b]/55 p-5">
            <h3 className="font-display text-2xl text-ivory">{selected.reference}</h3>
            <dl className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <div><dt>{t("drive.field.vehicle")}</dt><dd className="text-ivory">{selected.vehicleName}</dd></div>
              <div><dt>{t("drive.field.status")}</dt><dd className="text-gold">{t(`drive.status.${selected.status}`)}</dd></div>
              <div><dt>{t("drive.field.start")}</dt><dd className="text-ivory">{new Date(selected.startAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB")}</dd></div>
              <div><dt>{t("drive.field.price")}</dt><dd className="text-ivory">{formatFcfa(selected.priceFcfa, locale)}</dd></div>
              {selected.refuseReason ? <div className="sm:col-span-2"><dt>{t("drive.field.reason")}</dt><dd className="text-ivory">{selected.refuseReason}</dd></div> : null}
            </dl>
            {nextStatuses(selected.status, "client").includes("cancelled") ? (
              <Button className="mt-4" variant="ghost" onClick={() => cancel(selected.id)}>
                {t("drive.account.cancel")}
              </Button>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
