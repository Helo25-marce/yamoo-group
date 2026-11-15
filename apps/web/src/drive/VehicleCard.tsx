import { Briefcase, Car, Check, User, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"
import { formatFcfa } from "./format"
import type { DriveServiceKind, DriveVehicle } from "./types"
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
}: Props) {
  const { t } = useTranslation()
  const price =
    priceLabel ??
    (service === "chauffeur_daily"
      ? `${formatFcfa(vehicle.dailyRateFcfa, locale)} / ${t("drive.day")}`
      : formatFcfa(vehicle.tripRateFcfa, locale))

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition",
        selected ? "is-selected" : "hover:border-slate-300",
        "drive-choice",
        !vehicle.available && "opacity-55",
      )}
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        <img
          src={vehicle.imageSrc}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
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
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
          <li className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {vehicle.seats} {t("drive.seats")}
          </li>
          <li className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            {vehicle.luggage} {t("drive.luggage")}
          </li>
          <li className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {t("drive.withChauffeur")}
          </li>
        </ul>
        {vehicle.images?.some((image) => image.demo) ? <p className="drive-help">{t("drive.demoPhoto")}</p> : null}
        <p className="drive-help">{vehicle.available ? t("drive.catalogOn") : t("drive.catalogOff")}</p>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-lg font-semibold text-slate-900">
            {price}
            {priceUnit ? <span className="ml-2 text-xs font-normal text-slate-500">{priceUnit}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {onCompare ? (
              <button type="button" className={cn("drive-btn-secondary h-10 px-3 text-sm", compareOn && "is-selected")} onClick={onCompare}>
                {compareOn ? t("drive.results.compared") : t("drive.results.compare")}
              </button>
            ) : null}
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
          </div>
        </div>
      </div>
    </article>
  )
}
