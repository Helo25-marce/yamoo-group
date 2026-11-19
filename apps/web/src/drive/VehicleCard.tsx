import { Briefcase, BriefcaseBusiness, Building2, Car, Check, Gauge, GitBranch, Info, MapPin, User, UserRound, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { cn } from "../lib/cn"
import { localePath } from "../lib/locale"
import { formatFcfa } from "./format"
import type { DrivePartner, DriveServiceKind, DriveVehicle } from "./types"
import { ImportantInfo } from "./ui/ImportantInfo"
import type { Locale } from "../i18n/messages"

type Props = {
  vehicle: DriveVehicle
  service: DriveServiceKind
  selected: boolean
  locale: Locale
  onSelect: () => void
  priceLabel?: string
  priceUnit?: string
  onCompare?: () => void
  compareOn?: boolean
  selectLabel?: string
  sheetHref?: string
  sheetLabel?: string
  supplier?: DrivePartner | null
  pricePrompt?: string
  layout?: "stack" | "row"
  pickup?: string
  chauffeur?: boolean
}

export function VehicleCard({
  vehicle,
  service,
  selected,
  locale,
  onSelect,
  priceLabel,
  priceUnit,
  onCompare,
  compareOn = false,
  selectLabel,
  sheetHref,
  sheetLabel,
  supplier,
  pricePrompt,
  layout = "stack",
  pickup = "",
  chauffeur = false,
}: Props) {
  const { t } = useTranslation()
  const [hintOpen, setHintOpen] = useState(false)
  const hintRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hintOpen) return
    function onPointer(event: PointerEvent) {
      if (!hintRef.current?.contains(event.target as Node)) setHintOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setHintOpen(false)
    }
    window.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [hintOpen])
  const price = pricePrompt
    ? null
    : (priceLabel ??
      (service === "chauffeur_daily"
        ? `${formatFcfa(vehicle.dailyRateFcfa, locale)} / ${t("drive.day")}`
        : formatFcfa(vehicle.tripRateFcfa, locale)))

  if (layout === "row") {
    const brand = vehicle.brand?.trim() ?? ""
    const model = vehicle.model?.trim() || vehicle.name
    const specs: Array<{ key: string; icon: LucideIcon; text: string }> = [
      { key: "seats", icon: UserRound, text: `${vehicle.seats} ${t("drive.seats")}` },
      { key: "luggage", icon: BriefcaseBusiness, text: `${vehicle.luggage} ${t("drive.luggage")}` },
    ]
    if (vehicle.facts?.transmission) specs.push({ key: "transmission", icon: GitBranch, text: vehicle.facts.transmission })
    if (vehicle.facts?.mileagePolicy) specs.push({ key: "mileage", icon: Gauge, text: vehicle.facts.mileagePolicy })
    const deal = !vehicle.available ? (
      <button type="button" className="drive-btn-primary drive-offer-deal" disabled onClick={onSelect}>
        {t("drive.unavailable")}
      </button>
    ) : sheetHref && pricePrompt ? (
      <div className="drive-offer-pop" ref={hintRef}>
        <button type="button" className="drive-btn-primary drive-offer-deal" aria-expanded={hintOpen} onClick={() => setHintOpen(true)}>
          {sheetLabel ?? t("drive.results.viewOffer")}
        </button>
        {hintOpen ? (
          <p className="drive-offer-popup" role="status">
            {pricePrompt}
            <button type="button" className="drive-offer-popup-close" aria-label={t("drive.sheet.close")} onClick={() => setHintOpen(false)}>
              ×
            </button>
          </p>
        ) : null}
      </div>
    ) : sheetHref ? (
      <Link to={sheetHref} className="drive-btn-primary drive-offer-deal">
        {sheetLabel ?? t("drive.results.viewOffer")}
      </Link>
    ) : (
      <button type="button" className="drive-btn-primary drive-offer-deal" onClick={onSelect}>
        {selectLabel ?? t("drive.selectVehicle")}
      </button>
    )
    return (
      <article className={cn("drive-offer", !vehicle.available && "is-unavailable")}>
        <div className="drive-offer-body">
          <div className="drive-offer-media">
            <img
              src={vehicle.imageSrc}
              alt={vehicle.name}
              width={320}
              height={200}
              loading="lazy"
              className="drive-offer-photo"
              style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
              onLoad={(event) => {
                const img = event.currentTarget
                const ratio = img.naturalWidth / Math.max(1, img.naturalHeight)
                img.dataset.fit = img.dataset.fallback !== "1" && ratio >= 1.25 && ratio <= 1.95 ? "cover" : "contain"
              }}
              onError={(event) => {
                const img = event.currentTarget
                if (img.dataset.fallback === "1") return
                img.dataset.fallback = "1"
                img.src = "/images/drive/vehicles/pending.svg"
              }}
            />
          </div>
          <div className="drive-offer-copy">
            <h3 className="drive-offer-title">{brand ? `${brand} ${model}` : vehicle.name}</h3>
            <p className="drive-offer-category">{t(`drive.category.${vehicle.category}`)}</p>
            <ul className="drive-offer-specs">
              {specs.map(({ key, icon: Icon, text }) => (
                <li key={key}>
                  <Icon className="drive-offer-icon" strokeWidth={1.85} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            {pickup || chauffeur ? (
              <ul className="drive-offer-meta">
                {pickup ? (
                  <li className="drive-offer-pickup">
                    <MapPin className="drive-offer-icon" strokeWidth={1.85} aria-hidden="true" />
                    <span>{pickup}</span>
                  </li>
                ) : null}
                {chauffeur ? (
                  <li>
                    <UserRound className="drive-offer-icon" strokeWidth={1.85} aria-hidden="true" />
                    <span>{t("drive.withChauffeur")}</span>
                  </li>
                ) : null}
              </ul>
            ) : null}
            <p className="drive-offer-note">
              <Info className="drive-offer-icon is-small" strokeWidth={1.85} aria-hidden="true" />
              {vehicle.available ? t("drive.catalogOn") : t("drive.catalogOff")}
            </p>
          </div>
          <div className="drive-offer-action">
            {price ? (
              <>
                {priceUnit ? <p className="drive-offer-unit">{t("drive.results.priceFor", { unit: priceUnit })}</p> : null}
                <p className={cn("drive-offer-price", !priceUnit && "is-quote")}>{price}</p>
              </>
            ) : pricePrompt ? (
              <>
                <p className="drive-offer-unit">{pricePrompt}</p>
                <p className="drive-offer-price is-quote">{t("drive.results.needDates")}</p>
              </>
            ) : null}
            {deal}
          </div>
        </div>
        <footer className="drive-offer-supplier">
          <p className="drive-offer-partner">
            <Building2 className="drive-offer-icon" strokeWidth={1.85} aria-hidden="true" />
            <span>
              {t("drive.results.suppliedBy")} <strong>{supplier?.name ?? "YAMOO Drive"}</strong>
              {supplier?.city ? <span className="drive-offer-city"> · {supplier.city}</span> : null}
            </span>
          </p>
          <div className="drive-offer-links">
            <ImportantInfo icon />
            {supplier ? (
              <Link to={localePath(locale, `/drive/entreprises/${supplier.id}`)} className="drive-text-link">
                {t("drive.results.viewCompany")}
              </Link>
            ) : null}
            {onCompare ? (
              <button type="button" className={cn("drive-text-link drive-offer-compare", compareOn && "is-selected")} aria-pressed={compareOn} onClick={onCompare}>
                {compareOn ? t("drive.results.compared") : t("drive.results.compare")}
              </button>
            ) : null}
          </div>
        </footer>
      </article>
    )
  }

  return (
    <article className={cn("drive-choice overflow-hidden rounded-2xl border bg-white transition", selected ? "is-selected" : "hover:border-slate-300", !vehicle.available && "opacity-55")}>
      <div className="relative aspect-[16/10] bg-slate-100">
        <img
          src={vehicle.imageSrc}
          alt={vehicle.name}
          width={320}
          height={180}
          loading="lazy"
          className="h-full w-full object-contain"
          style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
          onError={(event) => {
            const img = event.currentTarget
            if (img.dataset.fallback === "1") return
            img.dataset.fallback = "1"
            img.src = "/images/drive/vehicles/pending.svg"
          }}
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-700 uppercase">
          {t(`drive.category.${vehicle.category}`)}
        </span>
        {selected ? (
          <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--drive-focus)] text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Car className="h-4 w-4 text-[var(--drive-focus)]" aria-hidden="true" />
          {vehicle.name}
        </h3>
        <p className="flex flex-wrap gap-3">
          {sheetHref ? (
            <Link to={sheetHref} className="drive-text-link w-fit">
              {sheetLabel ?? t("drive.sheet.view")}
            </Link>
          ) : null}
          <ImportantInfo />
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
          <li className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {vehicle.seats} {t("drive.seats")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            {vehicle.luggage} {t("drive.luggage")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" aria-hidden="true" />
            {t("drive.withChauffeur")}
          </li>
        </ul>
        {vehicle.images?.some((image) => image.demo) ? <p className="drive-help">{t("drive.demoPhoto")}</p> : null}
        <p className="drive-help">{vehicle.available ? t("drive.catalogOn") : t("drive.catalogOff")}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 p-4">
        {pricePrompt ? (
          <p className="text-sm font-semibold leading-snug text-slate-900">{pricePrompt}</p>
        ) : (
          <p className="text-lg font-semibold text-slate-900">
            {price}
            {priceUnit ? <span className="ml-2 text-xs font-normal text-slate-500">{priceUnit}</span> : null}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!vehicle.available}
            onClick={onSelect}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition",
              selected ? "bg-[var(--drive-night)] text-white" : "border border-slate-300 text-slate-800 hover:border-[var(--drive-focus)]",
              !vehicle.available && "cursor-not-allowed opacity-50",
            )}
          >
            {!vehicle.available ? t("drive.unavailable") : selected ? t("drive.selected") : (selectLabel ?? t("drive.selectVehicle"))}
          </button>
          {onCompare ? (
            <button type="button" className={cn("drive-btn-secondary h-10 px-3 text-sm", compareOn && "is-selected")} onClick={onCompare}>
              {compareOn ? t("drive.results.compared") : t("drive.results.compare")}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
