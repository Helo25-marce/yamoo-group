import { useState } from "react"
import type { FormEvent } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Camera, Car, Crown, Globe, Headset, Mail, Plane, Play, ShieldCheck, Smartphone, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { FounderFilm } from "../components/home/FounderFilm"
import { UniverseCard } from "../components/home/UniverseCard"
import { Button } from "../components/ui/Button"
import { SearchField } from "../components/ui/SearchField"
import { founderStills, homeStills } from "../content/visuals"
import { localePath, useLocale } from "../lib/locale"

const principles = [
  { icon: Crown, title: "why.qualityTitle" },
  { icon: Zap, title: "why.simpleTitle" },
  { icon: ShieldCheck, title: "why.securityTitle" },
  { icon: Headset, title: "why.careTitle" },
  { icon: Globe, title: "why.presenceTitle" },
] as const

const worlds = [
  { href: "/media", icon: Camera, title: "universe.mediaTitle", text: "universe.mediaText", verb: "universe.mediaVerb", image: homeStills.media },
  { href: "/drive", icon: Car, title: "universe.driveTitle", text: "universe.driveText", verb: "universe.driveVerb", image: homeStills.drive },
  { href: "/travel", icon: Plane, title: "universe.travelTitle", text: "universe.travelText", verb: "universe.travelVerb", image: homeStills.travel },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const reduce = useReducedMotion()
  const home = localePath(locale, "/")
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  function onSubscribe(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
  }

  const heroCopy = (
    <div className="max-w-[26rem]">
      <p className="text-[0.65rem] tracking-[0.28em] text-gold uppercase">{t("home.eyebrow")}</p>
      <h1 className="mt-2 font-display text-[2.1rem] leading-[1.05] text-ivory sm:text-[2.55rem] lg:text-[2.85rem]">
        <span className="block">{t("home.line1")}</span>
        <span className="hero-line2 mt-0.5 block text-[2.15rem] sm:text-[2.65rem] lg:text-[2.95rem]">{t("home.line2")}</span>
      </h1>
      <p className="mt-3 text-[0.72rem] tracking-[0.18em] text-ivory/85 uppercase">{t("home.kicker")}</p>
      <p className="mt-2.5 max-w-sm text-[0.88rem] leading-relaxed text-ivory/80">{t("home.lead")}</p>
      <div className="mt-3.5 lg:hidden">
        <SearchField
          id="home-search"
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          submitLabel={t("search.submit")}
        />
      </div>
      <div className="mt-4">
        <Button to={`${home}#univers`} className="h-10 px-4">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1a1208] text-[#f2bc60]">
            <Play aria-hidden="true" className="ml-px h-2.5 w-2.5 fill-current" />
          </span>
          {t("home.discover")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="yamoo-page-surface -mt-[4.75rem] pt-[4.75rem]">
      <div className="hero-dusk relative">
        <div className="frame relative py-6 lg:py-7">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,32rem)]">
            {reduce ? heroCopy : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                {heroCopy}
              </motion.div>
            )}
            <div className="order-3 min-w-0 lg:order-none">
              <div className="mb-3 grid grid-cols-3 gap-2 lg:hidden">
                {worlds.map((world) => (
                  <Link
                    key={world.href}
                    to={localePath(locale, world.href)}
                    className="rounded-2xl border border-ivory/10 bg-night/70 px-2 py-3 text-center transition duration-200 hover:border-gold/60"
                  >
                    <world.icon aria-hidden="true" className="mx-auto h-5 w-5 text-gold" />
                    <span className="mt-2 block text-[0.68rem] font-semibold tracking-wide text-ivory">{t(world.title)}</span>
                    <span className="mt-0.5 block text-[0.62rem] text-muted">{t(world.verb)}</span>
                  </Link>
                ))}
              </div>
              <FounderFilm
                title={t("film.title")}
                line={t("film.line")}
                playLabel={t("film.play")}
                pauseLabel={t("film.pause")}
                errorLabel={t("film.error")}
                soundOn={t("film.soundOn")}
                soundOff={t("film.soundOff")}
                watchLabel={t("film.vision")}
              />
            </div>
          </div>

          <section id="univers" className="mt-5 hidden scroll-mt-24 gap-3.5 lg:grid lg:grid-cols-3">
            {worlds.map((world) => (
              <UniverseCard
                key={world.href}
                href={localePath(locale, world.href)}
                title={t(world.title)}
                text={t(world.text)}
                action={t("universe.discover")}
                imageSrc={world.image}
                icon={world.icon}
              />
            ))}
          </section>
        </div>
      </div>

      <section className="frame py-5 lg:hidden">
        <h2 className="font-display text-lg text-ivory">{t("home.worlds")}</h2>
        <ul className="mt-3 grid gap-2">
          {worlds.map((world) => (
            <li key={world.href}>
              <Link to={localePath(locale, world.href)} className="flex items-center gap-3 rounded-2xl border border-ivory/10 bg-night-elevated/50 p-2">
                <img src={world.image} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ivory">{t(world.title)}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{t(world.text)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Button to={localePath(locale, "/informations")} className="w-full">
            {t("home.writeAction")}
          </Button>
        </div>
      </section>

      <section className="frame py-7 lg:py-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          <div className="min-w-0 lg:max-w-[13.5rem]">
            <h2 className="font-display text-[1.65rem] leading-tight text-ivory lg:text-[1.85rem]">{t("why.title")}</h2>
            <p className="mt-1.5 text-[0.8rem] text-muted">{t("why.intro")}</p>
          </div>
          <div className="yamoo-why-row min-w-0 flex-1">
            <ul className="yamoo-why-list">
              {principles.map((item) => (
                <li key={item.title} className="yamoo-why-item">
                  <span className="yamoo-why-icon">
                    <item.icon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.5} />
                  </span>
                  <p className="mx-auto mt-2 max-w-[7.5rem] text-[0.68rem] leading-tight text-ivory/90">{t(item.title)}</p>
                </li>
              ))}
            </ul>
            <svg className="yamoo-why-curve" viewBox="0 0 72 38" aria-hidden="true">
              <path d="M2 10 C 18 10, 22 32, 38 32 S 58 10, 70 10" />
            </svg>
            <Button variant="ghost" size="sm" to={localePath(locale, "/a-propos")} className="shrink-0 self-center">
              {t("why.more")}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>

      <section id="groupe" className="scroll-mt-24 border-t border-ivory/10 bg-[#07111f]/80">
        <div className="frame grid items-center gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-16">
          <figure className="overflow-hidden rounded-[1.35rem] border border-ivory/10 bg-[#12081a]">
            <img
              src={founderStills.tabletBlue}
              alt={t("group.photoTablet")}
              className="mx-auto h-auto max-h-[32rem] w-full object-contain"
              width={472}
              height={830}
            />
          </figure>
          <div className="max-w-xl">
            <p className="text-[0.65rem] tracking-[0.22em] text-gold uppercase">{t("group.eyebrow")}</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ivory sm:text-4xl">{t("group.title")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ivory/85 sm:text-base">{t("group.body")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("group.intro")}</p>
            <div className="mt-6">
              <Button to={localePath(locale, "/a-propos")}>{t("group.teaserCta")}</Button>
            </div>
          </div>
        </div>

        <div id="application" className="frame grid gap-3.5 pb-9 lg:grid-cols-2">
          <div className="yamoo-panel relative min-h-48 overflow-hidden">
            <img src={homeStills.group} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030c1b]/80 via-[#030c1b]/45 to-transparent" />
            <div className="relative flex h-full min-h-48 flex-col justify-end p-5">
              <Smartphone aria-hidden="true" className="mb-2.5 h-5 w-5 text-gold" />
              <h2 className="font-display text-xl text-ivory lg:text-2xl">{t("home.appTitle")}</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ivory/80">{t("home.appText")}</p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-ivory/25 bg-night/70 px-3.5 py-2 text-xs font-semibold text-ivory">
                  {t("home.appStore")}
                </span>
                <span className="inline-flex items-center rounded-full border border-ivory/25 bg-night/70 px-3.5 py-2 text-xs font-semibold text-ivory">
                  {t("home.playStore")}
                </span>
              </div>
            </div>
          </div>
          <div className="yamoo-panel-gold flex min-h-48 flex-col justify-center p-5">
            <Mail aria-hidden="true" className="h-5 w-5 text-gold" />
            <h2 className="mt-2.5 font-display text-xl text-ivory lg:text-2xl">{t("home.stayTitle")}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t("home.stayText")}</p>
            <form onSubmit={onSubscribe} className="mt-3.5 flex max-w-md items-center gap-2 rounded-full border border-gold/40 bg-ivory px-2 py-1.5">
              <label htmlFor="demo-newsletter" className="sr-only">
                {t("home.stayPlaceholder")}
              </label>
              <input
                id="demo-newsletter"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("home.stayPlaceholder")}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-night outline-none placeholder:text-night/45"
              />
              <button
                type="submit"
                className="yamoo-btn-gold !h-9 !w-9 shrink-0 !rounded-full !px-0"
                aria-label={t("home.stayAction")}
              >
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
            {subscribed ? <p className="mt-2 text-xs text-gold">{t("home.demoNote")} — OK</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}
