import { useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"
import { Button } from "../components/ui/Button"
import { DEMO_ADMIN, DEMO_CLIENT } from "../drive/catalog"
import { setDriveSession } from "../drive/store"
import { localePath, useLocale } from "../lib/locale"

export function DriveLoginPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get("next") === "admin" ? "admin" : params.get("next") === "retour" ? "retour" : "compte"
  const [email, setEmail] = useState(next === "admin" ? DEMO_ADMIN.email : DEMO_CLIENT.email)
  const [password, setPassword] = useState("demo")
  const [error, setError] = useState("")

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const client = email === DEMO_CLIENT.email && password === DEMO_CLIENT.password
    const admin = email === DEMO_ADMIN.email && password === DEMO_ADMIN.password
    if (!client && !admin) {
      setError(t("drive.auth.invalid"))
      return
    }
    if (next === "admin" && !admin) {
      setError(t("drive.auth.notAdmin"))
      return
    }
    setDriveSession(
      admin
        ? { role: "admin", email: DEMO_ADMIN.email, name: DEMO_ADMIN.name, demo: true }
        : { role: "client", email: DEMO_CLIENT.email, name: DEMO_CLIENT.name, demo: true },
    )
    const back = sessionStorage.getItem("yamoo.drive.return")
    if (next === "retour" && back?.startsWith("/")) {
      navigate(back)
      return
    }
    navigate(localePath(locale, admin && next === "admin" ? "/drive/admin" : "/drive/compte"))
  }

  return (
    <div className="yamoo-page-surface -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame max-w-lg py-10">
        <p className="text-[0.65rem] tracking-[0.18em] text-gold uppercase">{t("drive.demoBadge")}</p>
        <h1 className="mt-2 font-display text-3xl text-ivory">{t("drive.auth.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("drive.auth.hint")}</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-ivory/10 bg-[#030c1b]/45 p-5 backdrop-blur-sm">
          <label className="grid gap-1 text-sm text-muted">
            {t("drive.field.email")}
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-ivory/15 bg-night/50 px-3 py-2.5 text-ivory outline-none focus:border-gold" />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("drive.auth.password")}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-ivory/15 bg-night/50 px-3 py-2.5 text-ivory outline-none focus:border-gold" />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit">{t("drive.auth.submit")}</Button>
          <p className="text-xs text-muted">
            {t("drive.auth.accounts")}
            <br />
            {DEMO_CLIENT.email} / demo
            <br />
            {DEMO_ADMIN.email} / demo
          </p>
        </form>
      </div>
    </div>
  )
}
