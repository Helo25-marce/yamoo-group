import { useTranslation } from "react-i18next"
import { serviceNeedsRoute } from "../services"
import { isService, type DriveSearchDraft } from "../search"
import { DriveButton } from "./DriveButton"

type Props = {
  draft: DriveSearchDraft
  onChange: (draft: DriveSearchDraft) => void
  onSubmit: () => void
}

export function DriveSearchForm({ draft, onChange, onSubmit }: Props) {
  const { t } = useTranslation()
  const needsRoute = isService(draft.service) && serviceNeedsRoute(draft.service)
  const daily = draft.service === "chauffeur_daily"

  function set<K extends keyof DriveSearchDraft>(key: K, value: DriveSearchDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="drive-field">
          {t("drive.results.service")}
          <select value={draft.service} onChange={(event) => set("service", event.target.value)}>
            <option value="">{t("drive.results.chooseService")}</option>
            <option value="chauffeur_daily">{t("drive.service.daily")}</option>
            <option value="chauffeur_now">{t("drive.service.now")}</option>
            <option value="chauffeur_later">{t("drive.service.later")}</option>
          </select>
        </label>
        <label className="drive-field">
          {t("drive.field.start")}
          <input type="datetime-local" value={draft.startAt} onChange={(event) => set("startAt", event.target.value)} />
        </label>
        {daily ? (
          <label className="drive-field">
            {t("drive.field.end")}
            <input type="datetime-local" value={draft.endAt} onChange={(event) => set("endAt", event.target.value)} />
          </label>
        ) : null}
        <label className="drive-field">
          {t("drive.field.passengers")}
          <input
            inputMode="numeric"
            value={draft.passengers}
            onChange={(event) => set("passengers", event.target.value)}
          />
        </label>
        <label className="drive-field">
          {t("drive.field.luggage")}
          <input inputMode="numeric" value={draft.luggage} onChange={(event) => set("luggage", event.target.value)} />
        </label>
      </div>
      {needsRoute ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="drive-field">
            {t("drive.field.pickup")}
            <input
              value={draft.pickup}
              onChange={(event) => set("pickup", event.target.value)}
              placeholder={t("drive.field.pickupPlaceholder")}
            />
          </label>
          <label className="drive-field">
            {t("drive.field.dropoff")}
            <input
              value={draft.dropoff}
              onChange={(event) => set("dropoff", event.target.value)}
              placeholder={t("drive.field.dropoffPlaceholder")}
            />
          </label>
        </div>
      ) : draft.service === "chauffeur_daily" ? (
        <label className="drive-field">
          {t("drive.field.city")}
          <input
            value={draft.pickup}
            onChange={(event) => set("pickup", event.target.value)}
            placeholder={t("drive.field.cityPlaceholder")}
          />
        </label>
      ) : null}
      <div className="flex justify-end">
        <DriveButton type="submit">{t("drive.results.submit")}</DriveButton>
      </div>
    </form>
  )
}
