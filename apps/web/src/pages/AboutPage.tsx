import { ArrowRight, Camera, Car, Plane } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "../components/ui/Button"
import { founderStills, homeStills } from "../content/visuals"
import { localePath, useLocale } from "../lib/locale"

const worlds = [
  { href: "/media", icon: Camera, title: "universe.mediaTitle", text: "group.media", image: homeStills.media },
  { href: "/drive", icon: Car, title: "universe.driveTitle", text: "group.drive", image: homeStills.drive },
  { href: "/travel", icon: Plane, title: "universe.travelTitle", text: "group.travel", image: homeStills.travel },
] as const

export function AboutPage() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <div className="about-page -mt-[4.75rem] bg-[#07111f] text-ivory">
      {/* 1 — Présentation */}
      <section className="border-b border-ivory/10 bg-[#07111f] pt-[4.75rem]">
        <div className="frame grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-16">
          <div className="max-w-xl">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-gold uppercase">{t("group.eyebrow")}</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.08] text-balance text-ivory sm:text-5xl lg:text-[3.25rem]">
              {t("group.title")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ivory/90 sm:text-lg">{t("group.body")}</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted sm:text-base">{t("group.intro")}</p>
            <p className="mt-6 text-sm tracking-wide text-gold/90">{t("group.founders")}</p>
          </div>

          <figure className="relative mx-auto w-full max-w-[26rem] justify-self-end lg:max-w-[28rem]">
            <div className="overflow-hidden rounded-[1.5rem] border border-ivory/10 bg-[#12081a] shadow-[0_28px_60px_rgb(0_0_0/0.35)]">
              <img
                src={founderStills.tabletBlue}
                alt={t("group.photoTablet")}
                className="mx-auto h-auto max-h-[min(70vh,36rem)] w-full object-contain object-center"
                width={472}
                height={830}
              />
            </div>
            <figcaption className="mt-3 text-center text-xs tracking-wide text-muted lg:text-left">
              {t("group.photoTabletCaption")}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2 — Notre histoire */}
      <section className="border-b border-ivory/10 bg-[#0b1628]">
        <div className="frame grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <figure className="order-2 overflow-hidden rounded-[1.35rem] border border-ivory/10 bg-night lg:order-1">
            <img
              src={founderStills.alliance}
              alt={t("group.photoAlliance")}
              className="aspect-[4/5] w-full object-cover object-[50%_18%] sm:aspect-[5/6]"
              width={472}
              height={922}
            />
          </figure>
          <div className="order-1 max-w-xl lg:order-2">
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-gold uppercase">{t("group.storyEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{t("group.storyTitle")}</h2>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ivory/85 sm:text-base">{t("group.coupleBody")}</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted sm:text-base">{t("group.ambition")}</p>
          </div>
        </div>
      </section>

      {/* 3 — Notre vision */}
      <section className="border-b border-ivory/10 bg-[#07111f]">
        <div className="frame py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-gold uppercase">{t("group.visionEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{t("group.visionTitle")}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted sm:text-base">{t("group.visionBody")}</p>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {worlds.map((world) => (
              <li key={world.href}>
                <Link
                  to={localePath(locale, world.href)}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-ivory/10 bg-[#0b1628] transition hover:border-gold/40"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={world.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="inline-flex items-center gap-2 text-gold">
                      <world.icon className="h-4 w-4" aria-hidden="true" />
                      <span className="font-display text-xl text-ivory">{t(world.title)}</span>
                    </span>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{t(world.text)}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-gold uppercase">
                      {t("universe.discover")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-[1.25rem] border border-gold/20 bg-[#120e08] px-6 py-7 sm:px-8">
            <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">{t("group.signatureLabel")}</p>
            <p className="mt-2 font-display text-2xl text-ivory sm:text-3xl">{t("group.signatureLine")}</p>
            <p className="mt-2 text-sm text-muted">{t("group.signatureSub")}</p>
            <p className="hero-line2 mt-4 text-xl text-gold">{t("footer.signature")}</p>
          </div>
        </div>
      </section>

      {/* 4 — Les personnes */}
      <section className="border-b border-ivory/10 bg-[#0b1628]">
        <div className="frame py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-gold uppercase">{t("group.peopleEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{t("group.coupleTitle")}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted sm:text-base">{t("group.peopleBody")}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <figure className="overflow-hidden rounded-[1.25rem] border border-ivory/10 bg-night sm:col-span-2 lg:col-span-1">
              <img
                src={founderStills.tabletBlue}
                alt={t("group.photoTablet")}
                className="aspect-[3/4] w-full object-cover object-[50%_20%]"
              />
              <figcaption className="p-4 text-sm text-muted">{t("group.photoTabletCaption")}</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.25rem] border border-ivory/10 bg-night">
              <img
                src={founderStills.ceremonial}
                alt={t("group.photoCeremonial")}
                className="aspect-[3/4] w-full object-cover object-[50%_12%]"
              />
              <figcaption className="p-4 text-sm text-muted">{t("group.photoCeremonialCaption")}</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.25rem] border border-ivory/10 bg-night">
              <img
                src={founderStills.studio}
                alt={t("group.photoStudio")}
                className="aspect-[3/4] w-full object-cover object-top"
              />
              <figcaption className="p-4 text-sm text-muted">{t("group.photoStudioCaption")}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 5 — Découvrir */}
      <section className="bg-[#07111f]">
        <div className="frame py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-gold uppercase">{t("group.ctaEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{t("group.ctaTitle")}</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted sm:text-base">{t("group.ctaBody")}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={localePath(locale, "/drive")}>{t("group.ctaDrive")}</Button>
            <Button variant="ghost" to={localePath(locale, "/media")}>
              {t("group.ctaMedia")}
            </Button>
            <Button variant="ghost" to={localePath(locale, "/travel")}>
              {t("group.ctaTravel")}
            </Button>
            <Button variant="ghost" to={localePath(locale, "/")}>
              {t("nav.home")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
