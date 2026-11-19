import { useMemo, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router"
import {
  Armchair,
  Baby,
  Check,
  CheckCircle2,
  CreditCard,
  Hand,
  Lock,
  Luggage,
  MapPin,
  Minus,
  Smartphone,
  Smile,
  type LucideIcon,
} from "lucide-react"
import {
  EXTRAS,
  FULL_COVER_FCFA,
  emptyExtras,
  findPromo,
  quoteCheckout,
  vehicleHeld,
  type ExtraId,
  type ExtraQty,
} from "../drive/checkout"
import { CONTACT_EMAIL, formatFcfa, whatsappDriveLink } from "../drive/format"
import { parseResults, vehicleFit, vehicleQuote } from "../drive/search"
import { createBooking, listBookings, listVehicles } from "../drive/store"
import { useDriveStore } from "../drive/useDriveStore"
import { DriveAlert } from "../drive/ui/DriveAlert"
import { DriveProgress, TripTimeline, VehicleMini, useFlowCopy } from "../drive/ui/DriveFlow"
import { localePath, useLocale } from "../lib/locale"

const STEPS = ["extras", "cover", "pay", "done"] as const
type Step = (typeof STEPS)[number]

const EXTRA_ICONS: Record<ExtraId, LucideIcon> = {
  baby: Baby,
  child: Smile,
  booster: Armchair,
  welcome: Hand,
  luggage: Luggage,
  stop: MapPin,
}

const copy = {
  fr: {
    extrasTitle: "Ajoutez des options",
    extrasLead: "Réglées à la prise en charge auprès du prestataire. Rien n'est débité ici.",
    coverTitle: "Choisissez votre formule",
    coverLead: "Une option de souplesse pour le trajet avec chauffeur. Ce n'est pas une assurance.",
    essential: "Essentielle",
    serenity: "Sérénité",
    included: "Incluse",
    recommended: "Conseillée",
    perBooking: "par réservation",
    rows: [
      ["Chauffeur professionnel et véhicule de la catégorie choisie", true, true],
      ["Suivi de la demande par e-mail et WhatsApp", true, true],
      ["Annulation tant que le prestataire n'a pas validé", true, true],
      ["Changement d'horaire sans frais jusqu'à 12 h avant", false, true],
      ["Attente du chauffeur prolongée à 60 minutes", false, true],
      ["Ligne d'assistance prioritaire pendant le trajet", false, true],
    ] as [string, boolean, boolean][],
    coverNote: "Conditions présentées à titre d'exemple : le prestataire les fixe avant toute réservation réelle.",
    chooseEssential: "Continuer avec Essentielle",
    chooseSerenity: "Choisir Sérénité",
    yes: "Inclus",
    no: "Non inclus",
    driverTitle: "Passager principal",
    driverLead: "Ces coordonnées servent au prestataire pour vous joindre.",
    methodTitle: "Moyen de paiement prévu",
    methodLead: "Le paiement en ligne n'est pas encore branché : aucun montant n'est débité.",
    methods: {
      mtn: ["MTN Mobile Money", "Paiement depuis votre téléphone"],
      orange: ["Orange Money", "Paiement depuis votre téléphone"],
      card: ["Carte bancaire", "Visa ou Mastercard"],
    },
    promoTitle: "Code promo",
    termsTitle: "Avant d'enregistrer",
    termsItems: [
      "Votre demande reçoit une référence et reste enregistrée sur cet appareil.",
      "Le prestataire doit valider la disponibilité avant toute réservation.",
      "Aucun débit n'est effectué à cette étape.",
    ],
    secure: "Vos coordonnées ne quittent pas cet appareil.",
    status: "Statut : en attente de validation par le prestataire",
    vehicleLine: "Véhicule avec chauffeur",
    coverLine: (name: string) => `Formule ${name}`,
  },
  en: {
    extrasTitle: "Add extras",
    extrasLead: "Paid to the provider at pick-up. Nothing is charged here.",
    coverTitle: "Choose your plan",
    coverLead: "A flexibility option for the chauffeur trip. This is not insurance.",
    essential: "Essential",
    serenity: "Serenity",
    included: "Included",
    recommended: "Recommended",
    perBooking: "per booking",
    rows: [
      ["Professional chauffeur and vehicle of the chosen category", true, true],
      ["Request updates by email and WhatsApp", true, true],
      ["Cancellation while the provider has not validated", true, true],
      ["Free time change up to 12 h before", false, true],
      ["Chauffeur waiting time extended to 60 minutes", false, true],
      ["Priority assistance line during the trip", false, true],
    ] as [string, boolean, boolean][],
    coverNote: "Sample conditions: the provider sets them before any real booking.",
    chooseEssential: "Continue with Essential",
    chooseSerenity: "Choose Serenity",
    yes: "Included",
    no: "Not included",
    driverTitle: "Main passenger",
    driverLead: "The provider uses these details to reach you.",
    methodTitle: "Planned payment method",
    methodLead: "Online payment is not connected yet: nothing is charged.",
    methods: {
      mtn: ["MTN Mobile Money", "Pay from your phone"],
      orange: ["Orange Money", "Pay from your phone"],
      card: ["Bank card", "Visa or Mastercard"],
    },
    promoTitle: "Promo code",
    termsTitle: "Before you save",
    termsItems: [
      "Your request gets a reference and stays saved on this device.",
      "The provider must validate availability before any booking.",
      "Nothing is charged at this step.",
    ],
    secure: "Your details stay on this device.",
    status: "Status: awaiting provider validation",
    vehicleLine: "Chauffeur-driven vehicle",
    coverLine: (name: string) => `${name} plan`,
  },
}

function isStep(value: string | null): value is Step {
  return STEPS.includes(value as Step)
}

export function DriveCheckoutPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const c = copy[locale]
  const flow = useFlowCopy()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const state = useDriveStore()
  const vehicles = listVehicles()
  const parsed = useMemo(() => parseResults(params, vehicles), [params, vehicles])
  const criteria = parsed.query?.criteria ?? null
  const vehicle = vehicles.find((item) => item.id === (params.get("vehicle") ?? "")) ?? null
  const step: Step = isStep(params.get("step")) ? (params.get("step") as Step) : "extras"
  const base = vehicle && criteria ? vehicleQuote(criteria, vehicle).priceFcfa : 0
  const held = vehicle && criteria ? vehicleHeld(vehicle.id, criteria.startAt, criteria.endAt, listBookings()) : false
  const fit = vehicle && criteria ? vehicleFit(vehicle, criteria) : "drive.err.incomplete"

  const [qty, setQty] = useState<ExtraQty>(emptyExtras)
  const [protection, setProtection] = useState<"basic" | "full">("basic")
  const [promoInput, setPromoInput] = useState("")
  const [promoApplied, setPromoApplied] = useState<string | null>(null)
  const [promoError, setPromoError] = useState("")
  const [email, setEmail] = useState(state.session?.email ?? "")
  const [firstName, setFirstName] = useState(state.session?.name ?? "")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState(criteria?.pickup ?? "")
  const [method, setMethod] = useState<"mtn" | "orange" | "card" | "">("")
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<{ reference: string; email: string; whatsapp: string; mailto: string } | null>(null)

  const promo = findPromo(state.promos ?? [], promoApplied ?? "")
  const priced = quoteCheckout({ baseFcfa: base, qty, protection, promo })
  const chosenExtras = EXTRAS.filter((extra) => qty[extra.id] > 0)

  function go(next: Step) {
    const url = new URLSearchParams(params)
    url.set("step", next)
    setParams(url, { replace: false })
    setError("")
    window.scrollTo({ top: 0 })
  }

  function bump(id: ExtraId, delta: number) {
    setQty((current) => ({ ...current, [id]: Math.max(0, Math.min(3, current[id] + delta)) }))
  }

  function applyPromo() {
    const found = findPromo(state.promos, promoInput)
    if (!found) {
      setPromoApplied(null)
      setPromoError(t("drive.checkout.promoInvalid"))
      return
    }
    setPromoApplied(found.code)
    setPromoError("")
  }

  function pay(event: FormEvent) {
    event.preventDefault()
    if (!vehicle || !criteria || fit || held) {
      setError(t("drive.checkout.unavailable"))
      return
    }
    if (!firstName.trim() || !lastName.trim() || !email.includes("@") || phone.trim().length < 8) {
      setError(t("drive.checkout.contactInvalid"))
      return
    }
    if (!method) {
      setError(t("drive.checkout.methodNote"))
      return
    }
    if (!terms) {
      setError(t("drive.checkout.termsRequired"))
      return
    }
    try {
      const booking = createBooking({
        service: criteria.service,
        vehicleId: vehicle.id,
        startAt: criteria.startAt,
        endAt: criteria.service === "chauffeur_daily" ? criteria.endAt : criteria.startAt,
        pickup: criteria.pickup || city,
        dropoff: criteria.dropoff || criteria.pickup || city,
        clientName: `${firstName.trim()} ${lastName.trim()}`,
        clientPhone: phone.trim(),
        clientEmail: email.trim(),
        priceFcfa: priced.totalFcfa,
        extras: chosenExtras.map((extra) => ({
          id: extra.id,
          qty: qty[extra.id],
          amountFcfa: extra.amountFcfa * qty[extra.id],
        })),
        protection,
        promoCode: promo?.code,
        discountFcfa: priced.discountFcfa,
        payNowFcfa: priced.payNowFcfa,
        payPickupFcfa: priced.payPickupFcfa,
      })
      const mailBody = [
        t("drive.checkout.mailHello", { name: firstName.trim() }),
        t("drive.checkout.mailRef", { reference: booking.reference }),
        `${vehicle.name} — ${formatFcfa(priced.totalFcfa, locale)}`,
        t("drive.checkout.mailHold"),
        `${firstName.trim()} ${lastName.trim()}`,
        email.trim(),
        phone.trim(),
      ].join("\n")
      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`YAMOO DRIVE ${booking.reference}`)}&body=${encodeURIComponent(mailBody)}`
      const whatsapp = whatsappDriveLink({
        reference: booking.reference,
        vehicleName: vehicle.name,
        startAt: criteria.startAt,
        priceFcfa: priced.totalFcfa,
        clientName: `${firstName.trim()} ${lastName.trim()}`,
      })
      setDone({ reference: booking.reference, email: email.trim(), whatsapp, mailto })
      window.open(whatsapp, "_blank", "noopener,noreferrer")
      go("done")
    } catch {
      setError(t("drive.checkout.unavailable"))
    }
  }

  if (!vehicle || !criteria || fit) {
    return (
      <div className="frame py-8">
        <DriveAlert>{t("drive.sheet.incomplete")}</DriveAlert>
        <Link to={localePath(locale, "/drive")} className="drive-btn-primary mt-4 inline-flex">{t("drive.sheet.completeSearch")}</Link>
      </div>
    )
  }

  const planName = protection === "full" ? c.serenity : c.essential

  return (
    <div className="ui-booking drive-commerce drive-checkout -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-6">
        {step !== "done" ? <DriveProgress current={step} /> : null}

        {held ? <div className="mt-4"><DriveAlert>{t("drive.checkout.held")}</DriveAlert></div> : null}
        {error ? <div className="mt-4"><DriveAlert>{error}</DriveAlert></div> : null}

        <div className="drive-checkout-grid mt-5">
          <div className="min-w-0">
            {step === "extras" ? (
              <section>
                <h1 className="drive-title-section">{c.extrasTitle}</h1>
                <p className="drive-body mt-1">{c.extrasLead}</p>
                <ul className="dflow-extras mt-5">
                  {EXTRAS.map((extra) => {
                    const Icon = EXTRA_ICONS[extra.id]
                    const count = qty[extra.id]
                    return (
                      <li key={extra.id} className={count ? "is-on" : ""}>
                        <span className="dflow-extra-icon"><Icon size={22} aria-hidden="true" /></span>
                        <div className="min-w-0">
                          <h2 className="font-semibold">{t(`drive.checkout.extra.${extra.id}`)}</h2>
                          <p className="drive-help mt-0.5">{t(`drive.checkout.extra.${extra.id}Hint`)}</p>
                          <p className="mt-1.5 text-sm font-semibold">
                            {formatFcfa(extra.amountFcfa, locale)} <span className="font-normal text-[var(--drive-text-muted)]">· {t("drive.checkout.perRental")}</span>
                          </p>
                        </div>
                        <div className="dflow-counter" role="group" aria-label={t(`drive.checkout.extra.${extra.id}`)}>
                          <button type="button" onClick={() => bump(extra.id, -1)} disabled={!count} aria-label={t("drive.checkout.less")}>−</button>
                          <output aria-live="polite">{count}</output>
                          <button type="button" onClick={() => bump(extra.id, 1)} disabled={count >= 3} aria-label={t("drive.checkout.more")}>+</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="dflow-actions">
                  <Link to={`${localePath(locale, `/drive/vehicules/${vehicle.id}`)}?${(() => { const url = new URLSearchParams(params); url.delete("step"); url.delete("vehicle"); return url.toString() })()}`} className="drive-text-link">
                    {flow.deal}
                  </Link>
                  <button type="button" className="drive-btn-primary" onClick={() => go("cover")}>{t("drive.checkout.toCover")}</button>
                </div>
              </section>
            ) : null}

            {step === "cover" ? (
              <section>
                <h1 className="drive-title-section">{c.coverTitle}</h1>
                <p className="drive-body mt-1">{c.coverLead}</p>
                <div className="dflow-compare mt-5">
                  <table>
                    <thead>
                      <tr>
                        <td />
                        <th scope="col" className={protection === "basic" ? "is-picked" : ""}>
                          <span className="dflow-plan">{c.essential}</span>
                          <span className="dflow-plan-price">{c.included}</span>
                        </th>
                        <th scope="col" className={protection === "full" ? "is-picked" : ""}>
                          <span className="dflow-badge">{c.recommended}</span>
                          <span className="dflow-plan">{c.serenity}</span>
                          <span className="dflow-plan-price">+ {formatFcfa(FULL_COVER_FCFA, locale)} <small>{c.perBooking}</small></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map(([label, basic, full]) => (
                        <tr key={label}>
                          <th scope="row">{label}</th>
                          {[basic, full].map((on, index) => (
                            <td key={index}>
                              {on ? <Check className="dflow-yes" size={20} aria-label={c.yes} /> : <Minus className="dflow-no" size={20} aria-label={c.no} />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td />
                        <td>
                          <button type="button" className="drive-btn-secondary w-full" disabled={held} onClick={() => { setProtection("basic"); go("pay") }}>
                            {c.chooseEssential}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="drive-btn-primary w-full" disabled={held} onClick={() => { setProtection("full"); go("pay") }}>
                            {c.chooseSerenity}
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="drive-help mt-3">{c.coverNote}</p>
                <div className="dflow-actions">
                  <button type="button" className="drive-text-link" onClick={() => go("extras")}>{t("drive.checkout.backExtras")}</button>
                </div>
              </section>
            ) : null}

            {step === "pay" ? (
              <form onSubmit={pay} className="grid gap-5" noValidate>
                <h1 className="drive-title-section">{t("drive.checkout.payTitle")}</h1>
                <section className="dflow-card">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="dflow-h2">{c.driverTitle}</h2>
                    {state.session ? (
                      <p className="drive-help">{t("drive.checkout.signedIn", { name: state.session.name })}</p>
                    ) : (
                      <p className="drive-help">
                        {t("drive.checkout.guest")}{" "}
                        <button
                          type="button"
                          className="drive-text-link"
                          onClick={() => {
                            sessionStorage.setItem("yamoo.drive.return", window.location.pathname + window.location.search)
                            navigate(localePath(locale, "/drive/connexion?next=retour"))
                          }}
                        >
                          {t("drive.checkout.signIn")}
                        </button>
                      </p>
                    )}
                  </div>
                  <p className="drive-help mt-1">{c.driverLead}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="drive-field">{t("drive.checkout.first")}
                      <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
                    </label>
                    <label className="drive-field">{t("drive.checkout.last")}
                      <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
                    </label>
                    <label className="drive-field">{t("drive.field.email")}
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                    </label>
                    <label className="drive-field">{t("drive.field.phone")}
                      <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+237 6XX XX XX XX" required />
                    </label>
                    <label className="drive-field sm:col-span-2">{t("drive.checkout.city")}
                      <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
                    </label>
                  </div>
                </section>

                <fieldset className="dflow-card">
                  <legend className="dflow-h2">{c.methodTitle}</legend>
                  <p className="drive-help mt-1">{c.methodLead}</p>
                  <div className="dflow-tiles mt-4">
                    {(["mtn", "orange", "card"] as const).map((item) => {
                      const Icon = item === "card" ? CreditCard : Smartphone
                      return (
                        <label key={item} className={`dflow-tile is-${item}${method === item ? " is-on" : ""}`}>
                          <input type="radio" name="pay-method" checked={method === item} onChange={() => setMethod(item)} />
                          <span className="dflow-tile-mark" aria-hidden="true"><Icon size={20} /></span>
                          <span className="font-semibold">{c.methods[item][0]}</span>
                          <span className="drive-help">{c.methods[item][1]}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <section className="dflow-card">
                  <h2 className="dflow-h2">{c.promoTitle}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="drive-field min-w-[12rem] flex-1">
                      <span className="sr-only">{t("drive.checkout.promo")}</span>
                      <input value={promoInput} onChange={(event) => setPromoInput(event.target.value.toUpperCase())} placeholder={t("drive.checkout.promo")} />
                    </label>
                    <button type="button" className="drive-btn-secondary h-11 self-end" onClick={applyPromo}>{t("drive.checkout.promoApply")}</button>
                  </div>
                  {promoError ? <p className="mt-2 text-sm text-red-700">{promoError}</p> : null}
                  {promo ? <p className="mt-2 text-sm text-emerald-800">{t("drive.checkout.promoOk", { code: promo.code })}</p> : null}
                </section>

                <section className="dflow-terms">
                  <h2 className="dflow-h2">{c.termsTitle}</h2>
                  <ul>
                    {c.termsItems.map((item) => (
                      <li key={item}><Check size={16} aria-hidden="true" /> {item}</li>
                    ))}
                  </ul>
                  <label className="drive-check mt-3">
                    <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                    {t("drive.checkout.terms")}
                  </label>
                </section>

                <div className="dflow-actions">
                  <button type="button" className="drive-text-link" onClick={() => go("cover")}>{t("drive.checkout.backCover")}</button>
                  <div className="grid justify-items-end gap-1">
                    <button type="submit" className="drive-btn-primary dflow-submit" disabled={held}>
                      <Lock size={16} aria-hidden="true" /> {t("drive.checkout.bookPay")}
                    </button>
                    <p className="drive-help">{c.secure}</p>
                  </div>
                </div>
              </form>
            ) : null}

            {step === "done" && done ? (
              <section className="dflow-done">
                <CheckCircle2 size={40} aria-hidden="true" />
                <h1 className="drive-title-section mt-3">{t("drive.checkout.doneTitle")}</h1>
                <p className="dflow-ref">{done.reference}</p>
                <p className="drive-body mt-2">{t("drive.checkout.doneBody", { reference: done.reference, email: done.email })}</p>
                <p className="dflow-status mt-3">{c.status}</p>
                <p className="drive-help mt-3">{t("drive.checkout.doneChannels")}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a className="drive-btn-primary" href={done.mailto}>{t("drive.checkout.openMail")}</a>
                  <a className="drive-btn-secondary" href={done.whatsapp} target="_blank" rel="noreferrer">{t("drive.checkout.openWhatsapp")}</a>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="dflow-aside" aria-label={flow.price}>
            <div className="dflow-card">
              <VehicleMini vehicle={vehicle} compact heading />
              <h2 className="dflow-h3 mt-4">{flow.trip}</h2>
              <TripTimeline criteria={criteria} fallbackCity={t("drive.field.cityDefault")} />
            </div>
            <div className="dflow-card mt-3">
              <h2 className="dflow-h3">{flow.price}</h2>
              <p className="dflow-group">{flow.payNow}</p>
              <dl className="dflow-lines">
                <div><dt>{c.vehicleLine}</dt><dd>{formatFcfa(base, locale)}</dd></div>
                {step !== "extras" ? (
                  <div><dt>{c.coverLine(planName)}</dt><dd>{priced.coverFcfa ? formatFcfa(priced.coverFcfa, locale) : c.included}</dd></div>
                ) : null}
                {priced.discountFcfa ? (
                  <div className="is-discount"><dt>{t("drive.checkout.discount")} {promo?.code}</dt><dd>− {formatFcfa(priced.discountFcfa, locale)}</dd></div>
                ) : null}
                <div className="is-sub"><dt>{flow.payNow}</dt><dd>{formatFcfa(priced.payNowFcfa, locale)}</dd></div>
              </dl>
              <p className="dflow-group">{flow.payPickup}</p>
              <dl className="dflow-lines">
                {chosenExtras.length ? (
                  chosenExtras.map((extra) => (
                    <div key={extra.id}>
                      <dt>{t(`drive.checkout.extra.${extra.id}`)} × {qty[extra.id]}</dt>
                      <dd>{formatFcfa(extra.amountFcfa * qty[extra.id], locale)}</dd>
                    </div>
                  ))
                ) : (
                  <div><dt>{flow.nothingPickup}</dt><dd>{formatFcfa(0, locale)}</dd></div>
                )}
              </dl>
              <div className="dflow-total">
                <p className="font-semibold">{flow.total}</p>
                <p className="dflow-amount">{formatFcfa(priced.totalFcfa, locale)}</p>
              </div>
              <p className="drive-help mt-3">{flow.priceNote}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
