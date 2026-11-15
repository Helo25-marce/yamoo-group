import { useTranslation } from "react-i18next"
import { UniverseShell } from "../components/layout/UniverseShell"
import { marks } from "../content/marks"
import { visuals } from "../content/visuals"

export function TravelPage() {
  const { t } = useTranslation()

  return (
    <UniverseShell
      eyebrow={t("travel.eyebrow")}
      title={t("travel.title")}
      lead={t("travel.lead")}
      caption={t("photo.caption")}
      hint={t("photo.hint")}
      tone="travel"
      mark={marks.travel}
      markLabel="YAMOO TRAVEL"
      imageSrc={visuals.travel}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[t("travel.destinations"), t("travel.circuits"), t("travel.custom")].map((title) => (
          <section key={title} className="rounded-2xl border border-ivory/10 bg-night-elevated p-6">
            <h2 className="font-display text-2xl text-ivory">{title}</h2>
            <p className="mt-3 text-muted">{t("empty.offers")}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">{t("empty.detail")}</p>
    </UniverseShell>
  )
}
