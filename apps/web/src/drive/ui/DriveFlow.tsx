import { Briefcase, Car, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { DriveSearchCriteria } from "../search"
import type { DriveVehicle } from "../types"
import { useLocale } from "../../lib/locale"

const FLOW = ["deal", "extras", "cover", "pay"] as const
export type FlowStep = (typeof FLOW)[number]

const copy = {
  fr: {
    step: (n: number, total: number) => `Étape ${n} sur ${total}`,
    next: "Ensuite",
    last: "Dernière étape",
    deal: "Votre offre",
    similar: "Photo du modèle. Le prestataire fournit ce modèle ou un équivalent de même catégorie.",
    chauffeur: "Chauffeur inclus",
    seats: "places",
    bags: "bagages",
    trip: "Votre trajet",
    start: "Prise en charge",
    end: "Fin de service",
    sameDrop: "Même lieu",
    included: "Inclus dans le prix",
    includedItems: [
      "Chauffeur professionnel pendant toute la prestation",
      "Véhicule de la catégorie réservée, propre et préparé",
      "Annulation tant que le prestataire n'a pas validé",
      "Suivi de la demande par e-mail et WhatsApp",
      "Prix calculé sur vos dates et votre trajet",
      "Accueil au lieu de prise en charge indiqué",
    ],
    checklist: "Avant la prise en charge",
    checklistLead: "Trois points suffisent pour un départ sans attente.",
    checks: [
      ["Soyez à l'heure", "Le chauffeur attend au lieu indiqué à l'heure choisie."],
      ["Pièce d'identité", "Elle est demandée au passager principal au départ."],
      ["Téléphone joignable", "Le chauffeur vous appelle s'il ne vous trouve pas."],
    ],
    price: "Détail du prix",
    vehiclePrice: "Prix du véhicule",
    total: "Total estimé",
    payNow: "À payer maintenant",
    payPickup: "À la prise en charge",
    nothingPickup: "Rien à régler sur place",
    priceNote: "Tarifs des prestataires présentés à titre d'exemple. Aucun débit n'est effectué.",
  },
  en: {
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    next: "Next",
    last: "Last step",
    deal: "Your deal",
    similar: "Model photo. The provider supplies this model or an equivalent in the same category.",
    chauffeur: "Chauffeur included",
    seats: "seats",
    bags: "bags",
    trip: "Your trip",
    start: "Pick-up",
    end: "End of service",
    sameDrop: "Same place",
    included: "Included in the price",
    includedItems: [
      "Professional chauffeur for the whole service",
      "Vehicle of the booked category, clean and prepared",
      "Cancellation while the provider has not validated",
      "Request updates by email and WhatsApp",
      "Price calculated on your dates and trip",
      "Meeting at the pick-up place you chose",
    ],
    checklist: "Before pick-up",
    checklistLead: "Three points for a departure without waiting.",
    checks: [
      ["Be on time", "The chauffeur waits at the chosen place and time."],
      ["ID document", "The main passenger shows it at departure."],
      ["Phone reachable", "The chauffeur calls you if they cannot find you."],
    ],
    price: "Price breakdown",
    vehiclePrice: "Vehicle price",
    total: "Estimated total",
    payNow: "Pay now",
    payPickup: "Pay at pick-up",
    nothingPickup: "Nothing to pay on site",
    priceNote: "Provider prices shown as examples. Nothing is charged.",
  },
}

export function useFlowCopy() {
  return copy[useLocale()]
}

export function DriveProgress({ current }: { current: FlowStep }) {
  const { t } = useTranslation()
  const c = useFlowCopy()
  const labels: Record<FlowStep, string> = {
    deal: c.deal,
    extras: t("drive.checkout.step.extras"),
    cover: t("drive.checkout.step.cover"),
    pay: t("drive.checkout.step.pay"),
  }
  const index = FLOW.indexOf(current)
  const next = FLOW[index + 1]
  return (
    <nav className="dflow-progress" aria-label={t("drive.checkout.steps")}>
      <ol>
        {FLOW.map((step, i) => (
          <li key={step} className={i < index ? "is-done" : i === index ? "is-current" : ""} aria-current={i === index ? "step" : undefined}>
            <span className="dflow-bar" aria-hidden="true" />
            <span className="dflow-label">{labels[step]}</span>
          </li>
        ))}
      </ol>
      <p>
        <strong>{c.step(index + 1, FLOW.length)} : {labels[current]}</strong>
        <span>{next ? `${c.next} : ${labels[next]}` : c.last}</span>
      </p>
    </nav>
  )
}

function when(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace("T", " ")
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function TripTimeline({ criteria, fallbackCity }: { criteria: DriveSearchCriteria; fallbackCity: string }) {
  const locale = useLocale()
  const c = useFlowCopy()
  const daily = criteria.service === "chauffeur_daily"
  const start = criteria.pickup || fallbackCity
  const end = criteria.dropoff || (daily ? c.sameDrop : start)
  return (
    <ol className="dflow-timeline" aria-label={c.trip}>
      <li>
        <span className="dflow-dot" aria-hidden="true" />
        <p className="dflow-when">{c.start} · {when(criteria.startAt, locale)}</p>
        <p className="dflow-where">{start}</p>
      </li>
      <li>
        <span className="dflow-dot" aria-hidden="true" />
        <p className="dflow-when">{c.end} · {when(daily ? criteria.endAt : criteria.startAt, locale)}</p>
        <p className="dflow-where">{end}</p>
      </li>
    </ol>
  )
}

export function VehicleMini({ vehicle, compact = false, heading = false }: { vehicle: DriveVehicle; compact?: boolean; heading?: boolean }) {
  const { t } = useTranslation()
  const c = useFlowCopy()
  return (
    <div className={compact ? "dflow-mini is-compact" : "dflow-mini"}>
      <img src={vehicle.imageSrc} alt="" loading="lazy" />
      <div className="min-w-0">
        <p className="dflow-mini-kicker">{t(`drive.category.${vehicle.category}`)}</p>
        {heading ? <h2 className="dflow-mini-name">{vehicle.name}</h2> : <p className="dflow-mini-name">{vehicle.name}</p>}
        <ul className="dflow-chips">
          <li><Users size={14} aria-hidden="true" /> {vehicle.seats} {c.seats}</li>
          <li><Briefcase size={14} aria-hidden="true" /> {vehicle.luggage} {c.bags}</li>
          <li><Car size={14} aria-hidden="true" /> {c.chauffeur}</li>
        </ul>
      </div>
    </div>
  )
}
