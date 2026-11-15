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
}

export function VehicleCard({ vehicle, service, selected, locale, onSelect }: Props) {
  const { t } = useTranslation()
  const price =
    service === "chauffeur_daily"
      ? `${formatFcfa(vehicle.dailyRateFcfa, locale)} / ${t("drive.day")}`
      : formatFcfa(vehicle.tripRateFcfa, locale)

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition",
        selected ? "border-[#b8923a] shadow-[0_0_0_3px_rgb(184_146_58/0.18)]" : "border-slate-200 hover:border-slate-300",
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
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-slate-700 uppercase">
          {t(`drive.category.${vehicle.category}`)}
        </span>
        {selected ? (
          <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#b8923a] text-night">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Car className="h-4 w-4 text-[#b8923a]" aria-hidden="true" />
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
        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-lg font-semibold text-slate-900">{price}</p>
          <button
            type="button"
            disabled={!vehicle.available}
            onClick={onSelect}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition",
              selected ? "bg-[#b8923a] text-[#1a1208]" : "border border-slate-300 text-slate-800 hover:border-[#b8923a]",
              !vehicle.available && "cursor-not-allowed opacity-50",
            )}
          >
            {!vehicle.available ? t("drive.unavailable") : selected ? t("drive.selected") : t("drive.selectVehicle")}
          </button>
        </div>
      </div>
    </article>
  )
}
