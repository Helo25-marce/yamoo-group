import { ArrowUp, CreditCard, Headphones, Instagram, Linkedin, MapPin, ShieldCheck, Sparkles, Youtube } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Logo } from "../ui/Logo"
import { localePath, useLocale } from "../../lib/locale"

const benefits = [
  { icon: ShieldCheck, key: "footer.benefitSecure" },
  { icon: CreditCard, key: "footer.benefitPay" },
  { icon: Headphones, key: "footer.benefitSupport" },
  { icon: Sparkles, key: "footer.benefitQuality" },
  { icon: MapPin, key: "footer.benefitLocal" },
] as const

export function Footer() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <footer className="border-t border-ivory/10 bg-transparent">
      <div className="frame flex flex-col items-center gap-5 py-6 lg:flex-row lg:justify-between">
        <Logo to={localePath(locale, "/")} label="YAMOO GROUP" className="h-10 w-auto" />
        <p className="hero-line2 text-center text-xl leading-none lg:text-2xl">{t("footer.signature")}</p>
        <div className="flex items-center gap-2.5 text-gold" aria-label={t("footer.social")}>
          <a href="#demo-youtube" className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 transition duration-200 hover:bg-gold/10" aria-label="YouTube">
            <Youtube className="h-3.5 w-3.5" />
          </a>
          <a href="#demo-instagram" className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 transition duration-200 hover:bg-gold/10" aria-label="Instagram">
            <Instagram className="h-3.5 w-3.5" />
          </a>
          <a href="#demo-linkedin" className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 transition duration-200 hover:bg-gold/10" aria-label="LinkedIn">
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="frame flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-[0.68rem] tracking-[0.14em] text-muted uppercase">{t("footer.rights")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[0.68rem] text-muted">{t("footer.phone")}</span>
            <a href={`mailto:${t("footer.contact")}`} className="text-[0.68rem] tracking-wide text-muted hover:text-gold">
              {t("footer.contact")}
            </a>
            <Link to={localePath(locale, "/informations")} className="text-[0.68rem] tracking-wide text-muted hover:text-gold">
              {t("footer.legal")}
            </Link>
            <Link to={localePath(locale, "/informations")} className="text-[0.68rem] tracking-wide text-muted hover:text-gold">
              {t("footer.privacy")}
            </Link>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full bg-gold text-night"
              aria-label={t("footer.top")}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ArrowUp aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <ul className="yamoo-benefits frame" aria-label={t("footer.benefitsDemo")}>
        {benefits.map((item) => (
          <li key={item.key}>
            <item.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
            <span>{t(item.key)}</span>
          </li>
        ))}
      </ul>
    </footer>
  )
}
