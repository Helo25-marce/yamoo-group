import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocale } from "../../lib/locale"
import type { DriveSearchDraft } from "../search"
import { DateTimeField } from "./DateTimeField"
import { DriveButton } from "./DriveButton"
import { PlaceField } from "./PlaceField"

type Props = {
  draft: DriveSearchDraft
  busy?: boolean
  onChange: (draft: DriveSearchDraft) => void
  onSubmit: () => void
}

const copy = {
  fr: {
    pickup: "Lieu de prise en charge",
    dropoff: "Lieu de restitution",
    pickupDate: "Date de prise en charge",
    dropoffDate: "Date de restitution",
    otherPlace: "Restituer le véhicule à un autre lieu",
    driverAge: "Conducteur âgé de 30 à 65 ans ?",
    age: "Âge du conducteur",
  },
  en: {
    pickup: "Pick-up location",
    dropoff: "Drop-off location",
    pickupDate: "Pick-up date",
    dropoffDate: "Drop-off date",
    otherPlace: "Drop car off at different location",
    driverAge: "Driver aged between 30 - 65?",
    age: "Driver's age",
  },
}

export function DriveSearchForm({ draft, busy = false, onChange, onSubmit }: Props) {
  const { t } = useTranslation()
  const c = copy[useLocale()]
  const [otherPlace, setOtherPlace] = useState(() => Boolean(draft.dropoff))
  const [ageOk, setAgeOk] = useState(true)
  const [age, setAge] = useState("")

  function set<K extends keyof DriveSearchDraft>(key: K, value: DriveSearchDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <form
      className="drive-booking-form drive-bk"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className={otherPlace ? "drive-bk-bar has-dropoff" : "drive-bk-bar"}>
        <PlaceField
          className="drive-bk-place"
          label={c.pickup}
          value={draft.pickup}
          placeholder={t("drive.place.placeholder")}
          onChange={(value) => set("pickup", value)}
        />
        {otherPlace ? (
          <PlaceField
            className="drive-bk-place"
            label={c.dropoff}
            value={draft.dropoff}
            placeholder={t("drive.place.placeholder")}
            onChange={(value) => set("dropoff", value)}
          />
        ) : null}
        <DateTimeField dateLabel={c.pickupDate} value={draft.startAt} onChange={(value) => set("startAt", value)} />
        <DateTimeField dateLabel={c.dropoffDate} value={draft.endAt} onChange={(value) => set("endAt", value)} />
        <div className="drive-bk-submit">
          <DriveButton type="submit">{busy ? t("drive.results.searching") : t("drive.results.submit")}</DriveButton>
        </div>
      </div>
      <div className="drive-bk-options">
        <label className="drive-check">
          <input
            type="checkbox"
            checked={otherPlace}
            onChange={(event) => {
              setOtherPlace(event.target.checked)
              if (!event.target.checked) set("dropoff", "")
            }}
          />
          {c.otherPlace}
        </label>
        <label className="drive-check">
          <input type="checkbox" checked={ageOk} onChange={(event) => setAgeOk(event.target.checked)} />
          {c.driverAge}
        </label>
        {ageOk ? null : (
          <label className="drive-field drive-bk-age">
            {c.age}
            <input inputMode="numeric" maxLength={2} value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, ""))} />
          </label>
        )}
      </div>
    </form>
  )
}
