import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

export function SearchPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = params.get("q")?.trim() ?? ""

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl text-ivory sm:text-5xl">{t("search.title")}</h1>
      {query ? <p className="mt-4 text-lg text-muted">{t("search.for", { query })}</p> : null}
      <div className="mt-10 rounded-2xl border border-ivory/10 bg-night-elevated p-8">
        <h2 className="font-display text-2xl text-ivory">{t("search.emptyTitle")}</h2>
        <p className="mt-3 text-muted">{t("search.emptyBody")}</p>
      </div>
    </section>
  )
}
