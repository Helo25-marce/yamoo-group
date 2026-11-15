import { useTranslation } from "react-i18next"
import { UniverseShell } from "../components/layout/UniverseShell"
import { marks } from "../content/marks"
import { visuals } from "../content/visuals"

const keys = ["photo", "video", "events", "communication"] as const

export function MediaPage() {
  const { t } = useTranslation()

  return (
    <UniverseShell
      eyebrow={t("media.eyebrow")}
      title={t("media.title")}
      lead={t("media.lead")}
      caption={t("photo.caption")}
      hint={t("photo.hint")}
      tone="media"
      mark={marks.media}
      markLabel="YAMOO MEDIA"
      imageSrc={visuals.media}
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key} className="rounded-2xl border border-ivory/10 bg-night-elevated p-6">
            <h2 className="font-display text-2xl text-ivory">{t(`media.categories.${key}`)}</h2>
            <p className="mt-3 text-muted">{t("empty.offers")}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">{t("empty.detail")}</p>
    </UniverseShell>
  )
}
