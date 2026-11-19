import { useMemo, useState, type FormEvent } from "react"
import { Lock, MapPin, Search, ShieldCheck } from "lucide-react"
import { useSearchParams } from "react-router"
import { universeImage } from "../content/universeImages"
import { homeStills } from "../content/visuals"
import { isCameroonPhone, isEmail, loadRequests, saveRequest, todayIso, type DemoRequest } from "../lib/demoRequests"
import { useLocale } from "../lib/locale"
import { TRAVEL_DESTINATIONS, TRAVEL_OFFERS, type TravelKind, type TravelOffer, type TravelZone } from "../travel/offers"

const KINDS: TravelKind[] = ["stay", "excursion", "circuit", "transfer"]
const ZONES: TravelZone[] = ["cameroon", "international"]

const copy = {
  fr: {
    kicker: "YAMOO TRAVEL",
    title: "Voyager au Cameroun et au-delà, en toute sérénité.",
    lead: "Séjours, excursions, circuits et transferts, ou un voyage construit sur mesure.",
    heroNote: "Visuel provisoire d'ambiance.",
    s: { destination: "Destination", destinationPh: "Kribi, Limbe, International…", depart: "Départ", back: "Retour", adults: "Adultes", children: "Enfants", kind: "Type de prestation", anyKind: "Tous types", budget: "Budget max (FCFA)", submit: "Rechercher" },
    err: { depart: "Le départ doit être aujourd'hui ou plus tard.", back: "Le retour doit suivre le départ.", adults: "Entre 1 et 20 adultes.", children: "Entre 0 et 20 enfants.", budget: "Budget invalide." },
    kinds: { stay: "Séjour", excursion: "Excursion", circuit: "Circuit", transfer: "Transfert" } as Record<TravelKind, string>,
    zones: { cameroon: "Cameroun", international: "International" } as Record<TravelZone, string>,
    destinationsTitle: "Destinations",
    resultsTitle: "Offres",
    count: "{n} offre(s)",
    demoNote: "Tarifs indicatifs, sans engagement. Aucune disponibilité n'est confirmée ; billets d'avion et hébergements ne sont pas réservables en temps réel.",
    filters: "Filtres",
    zone: "Zone",
    reset: "Réinitialiser",
    sort: "Trier par",
    sorts: { relevance: "Pertinence", "price-asc": "Prix croissant", "price-desc": "Prix décroissant", duration: "Durée" },
    nights: (n: number) => (n === 0 ? "Journée" : `${n} nuit${n > 1 ? "s" : ""}`),
    from: "Tarif indicatif / adulte",
    onRequest: "Sur devis",
    view: "Voir le voyage",
    empty: "Aucune offre ne correspond. Modifiez la recherche ou demandez un voyage sur mesure.",
    detail: { program: "Programme", included: "Inclus", excluded: "Non inclus", conditions: "Conditions", conditionsBody: "Tarif indicatif, sans engagement. Le prix définitif, les dates et les prestataires sont confirmés par l'équipe après étude.", request: "Demander ce voyage", close: "Fermer" },
    customTitle: "Voyage sur mesure",
    customLead: "Décrivez votre projet. La demande est enregistrée sur cet appareil ; rien n'est réservé ni payé.",
    quoteKicker: "Conçu pour vous",
    quoteSteps: [
      ["Vos envies", "Destination, dates, voyageurs et style de voyage."],
      ["Étude", "Nous composons un itinéraire adapté à votre budget."],
      ["Proposition", "Un programme détaillé et un devis, sans engagement."],
    ],
    quoteFree: "Sans engagement",
    parts: ["Votre voyage", "Vos envies", "Vos coordonnées"],
    secure: "Vos informations restent sur cet appareil.",
    f: { destination: "Où voulez-vous partir ?", offer: "Offre de référence", depart: "Date de départ", back: "Date de retour", adults: "Adultes", children: "Enfants", experience: "Type d'expérience", experiences: ["Détente", "Découverte culturelle", "Nature et aventure", "Affaires", "Famille"], comfort: "Niveau de confort", comforts: ["Essentiel", "Confort", "Premium"], budget: "Budget total indicatif (FCFA)", services: "Prestations souhaitées", serviceList: ["Transport avec chauffeur", "Hébergement", "Billets d'avion", "Guide", "Activités"], notes: "Demandes particulières", name: "Nom complet", phone: "Téléphone", phoneHint: "Format camerounais, ex. 6 77 00 00 00", email: "E-mail", choose: "Choisir", submit: "Envoyer la demande" },
    ferr: { destination: "Indiquez une destination.", depart: "Choisissez un départ à partir d'aujourd'hui.", back: "Le retour doit suivre le départ.", adults: "Entre 1 et 20 adultes.", children: "Entre 0 et 20 enfants.", experience: "Choisissez une expérience.", name: "Indiquez votre nom.", phone: "Numéro camerounais invalide.", email: "Adresse e-mail invalide.", summary: "Corrigez les champs signalés." },
    doneTitle: "Demande enregistrée",
    doneBody: "Enregistrée sur cet appareil uniquement. Aucun voyage n'est réservé ni confirmé.",
    reference: "Référence",
    newRequest: "Nouvelle demande",
    mine: "Mes voyages sur cet appareil",
    status: "Non transmise",
  },
  en: {
    kicker: "YAMOO TRAVEL",
    title: "Travel across Cameroon and beyond, with peace of mind.",
    lead: "Stays, excursions, circuits and transfers, or a trip built around you.",
    heroNote: "Provisional mood image.",
    s: { destination: "Destination", destinationPh: "Kribi, Limbe, International…", depart: "Departure", back: "Return", adults: "Adults", children: "Children", kind: "Service type", anyKind: "All types", budget: "Max budget (FCFA)", submit: "Search" },
    err: { depart: "Departure must be today or later.", back: "Return must follow departure.", adults: "Between 1 and 20 adults.", children: "Between 0 and 20 children.", budget: "Invalid budget." },
    kinds: { stay: "Stay", excursion: "Excursion", circuit: "Circuit", transfer: "Transfer" } as Record<TravelKind, string>,
    zones: { cameroon: "Cameroon", international: "International" } as Record<TravelZone, string>,
    destinationsTitle: "Destinations",
    resultsTitle: "Offers",
    count: "{n} offer(s)",
    demoNote: "Indicative prices, without commitment. No availability is confirmed; flights and accommodation are not bookable in real time.",
    filters: "Filters",
    zone: "Area",
    reset: "Reset",
    sort: "Sort by",
    sorts: { relevance: "Relevance", "price-asc": "Price, low to high", "price-desc": "Price, high to low", duration: "Duration" },
    nights: (n: number) => (n === 0 ? "Day trip" : `${n} night${n > 1 ? "s" : ""}`),
    from: "Indicative price / adult",
    onRequest: "On request",
    view: "View trip",
    empty: "No offer matches. Change the search or request a tailor-made trip.",
    detail: { program: "Programme", included: "Included", excluded: "Not included", conditions: "Conditions", conditionsBody: "Indicative price, without commitment. Final price, dates and providers are confirmed by the team after review.", request: "Request this trip", close: "Close" },
    customTitle: "Tailor-made trip",
    customLead: "Describe your project. The request is saved on this device; nothing is booked or paid.",
    quoteKicker: "Designed for you",
    quoteSteps: [
      ["Your wishes", "Destination, dates, travellers and travel style."],
      ["Study", "We build an itinerary that fits your budget."],
      ["Proposal", "A detailed programme and quote, with no obligation."],
    ],
    quoteFree: "No obligation",
    parts: ["Your trip", "Your wishes", "Your details"],
    secure: "Your information stays on this device.",
    f: { destination: "Where do you want to go?", offer: "Reference offer", depart: "Departure date", back: "Return date", adults: "Adults", children: "Children", experience: "Type of experience", experiences: ["Relaxation", "Cultural discovery", "Nature and adventure", "Business", "Family"], comfort: "Comfort level", comforts: ["Essential", "Comfort", "Premium"], budget: "Indicative total budget (FCFA)", services: "Services wanted", serviceList: ["Transport with driver", "Accommodation", "Flights", "Guide", "Activities"], notes: "Special requests", name: "Full name", phone: "Phone", phoneHint: "Cameroon format, e.g. 6 77 00 00 00", email: "Email", choose: "Choose", submit: "Send request" },
    ferr: { destination: "Enter a destination.", depart: "Choose a departure from today onwards.", back: "Return must follow departure.", adults: "Between 1 and 20 adults.", children: "Between 0 and 20 children.", experience: "Choose an experience.", name: "Enter your name.", phone: "Invalid Cameroon number.", email: "Invalid email address.", summary: "Fix the highlighted fields." },
    doneTitle: "Request saved",
    doneBody: "Saved on this device only. No trip is booked or confirmed.",
    reference: "Reference",
    newRequest: "New request",
    mine: "My trips on this device",
    status: "Not sent",
  },
}

const PLACE_IMAGE: Record<string, string> = {
  Douala: "travel/douala",
  Yaoundé: "travel/yaounde",
  Kribi: "travel/kribi",
  Limbe: "travel/limbe",
  Buea: "travel/buea",
  Bafoussam: "travel/bafoussam",
  Garoua: "travel/garoua",
}

function placeImage(destination: string) {
  return universeImage(PLACE_IMAGE[destination] ?? "") ?? { src: homeStills.travel, credit: "", source: "" }
}

const offerImage = (offer: TravelOffer) => placeImage(offer.destination)

type Sort = "relevance" | "price-asc" | "price-desc" | "duration"
const SORTS: Sort[] = ["relevance", "price-asc", "price-desc", "duration"]

const intIn = (value: string, min: number, max: number) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max
const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

const EMPTY_REQUEST = { destination: "", offer: "", depart: "", back: "", adults: "2", children: "0", experience: "", comfort: "", budget: "", services: [] as string[], notes: "", name: "", phone: "", email: "" }
type RequestForm = typeof EMPTY_REQUEST

export function TravelPage() {
  const locale = useLocale()
  const c = copy[locale]
  const [params, setParams] = useSearchParams()
  const fcfa = (value: number) => `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR").format(value)} FCFA`

  const q = params.get("q") ?? ""
  const kindParam = params.get("type") ?? ""
  const kind = (KINDS as string[]).includes(kindParam) ? (kindParam as TravelKind) : ""
  const zoneParam = params.get("zone") ?? ""
  const zone = (ZONES as string[]).includes(zoneParam) ? (zoneParam as TravelZone) : ""
  const budgetParam = params.get("budget") ?? ""
  const budget = /^\d+$/.test(budgetParam) ? Number(budgetParam) : null
  const sortParam = params.get("sort") ?? ""
  const sort = (SORTS as string[]).includes(sortParam) ? (sortParam as Sort) : "relevance"
  const openId = params.get("offre") ?? ""

  const [search, setSearch] = useState({ q, depart: params.get("depart") ?? "", back: params.get("retour") ?? "", adults: params.get("adultes") ?? "2", children: params.get("enfants") ?? "0", type: kind as string, budget: budgetParam })
  const [searchErrors, setSearchErrors] = useState<string[]>([])

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: false })
  }

  const runSearch = (event: FormEvent) => {
    event.preventDefault()
    const errs: string[] = []
    if (search.depart && search.depart < todayIso()) errs.push(c.err.depart)
    if (search.back && (!search.depart || search.back < search.depart)) errs.push(c.err.back)
    if (!intIn(search.adults, 1, 20)) errs.push(c.err.adults)
    if (!intIn(search.children, 0, 20)) errs.push(c.err.children)
    if (search.budget && !/^\d+$/.test(search.budget)) errs.push(c.err.budget)
    setSearchErrors(errs)
    if (errs.length) return
    update({ q: search.q.trim(), depart: search.depart, retour: search.back, adultes: search.adults, enfants: search.children, type: search.type, budget: search.budget, offre: "" })
    document.getElementById("offres")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const results = useMemo(() => {
    const needle = fold(q)
    const list = TRAVEL_OFFERS.filter((offer) => {
      if (kind && offer.kind !== kind) return false
      if (zone && offer.zone !== zone) return false
      if (budget !== null && offer.indicativeFcfa !== null && offer.indicativeFcfa > budget) return false
      if (needle && ![offer.destination, offer.region.fr, offer.region.en, offer.title.fr, offer.title.en].some((text) => fold(text).includes(needle))) return false
      return true
    })
    const price = (offer: TravelOffer, missing: number) => offer.indicativeFcfa ?? missing
    if (sort === "price-asc") list.sort((a, b) => price(a, Infinity) - price(b, Infinity) || a.id.localeCompare(b.id))
    if (sort === "price-desc") list.sort((a, b) => price(b, -Infinity) - price(a, -Infinity) || a.id.localeCompare(b.id))
    if (sort === "duration") list.sort((a, b) => a.nights - b.nights || a.id.localeCompare(b.id))
    return list
  }, [q, kind, zone, budget, sort])

  const open = TRAVEL_OFFERS.find((offer) => offer.id === openId) ?? null

  const [form, setForm] = useState<RequestForm>(EMPTY_REQUEST)
  const [errors, setErrors] = useState<Partial<Record<keyof RequestForm, string>>>({})
  const [done, setDone] = useState<DemoRequest | null>(null)
  const [requests, setRequests] = useState<DemoRequest[]>(() => loadRequests("travel"))

  const requestOffer = (offer: TravelOffer) => {
    setDone(null)
    setForm((current) => ({
      ...current,
      destination: offer.destination,
      offer: offer.id,
      depart: params.get("depart") ?? current.depart,
      back: params.get("retour") ?? current.back,
      adults: params.get("adultes") ?? current.adults,
      children: params.get("enfants") ?? current.children,
    }))
    document.getElementById("sur-mesure")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Partial<Record<keyof RequestForm, string>> = {}
    if (!form.destination.trim()) next.destination = c.ferr.destination
    if (!form.depart || form.depart < todayIso()) next.depart = c.ferr.depart
    if (form.back && form.back < form.depart) next.back = c.ferr.back
    if (!intIn(form.adults, 1, 20)) next.adults = c.ferr.adults
    if (!intIn(form.children, 0, 20)) next.children = c.ferr.children
    if (!form.experience) next.experience = c.ferr.experience
    if (form.name.trim().length < 2) next.name = c.ferr.name
    if (!isCameroonPhone(form.phone)) next.phone = c.ferr.phone
    if (!isEmail(form.email)) next.email = c.ferr.email
    setErrors(next)
    if (Object.keys(next).length) return
    const offer = TRAVEL_OFFERS.find((item) => item.id === form.offer)
    const saved = saveRequest("travel", {
      [c.f.destination]: form.destination.trim(),
      ...(offer ? { [c.f.offer]: offer.title[locale] } : {}),
      [c.f.depart]: form.depart,
      ...(form.back ? { [c.f.back]: form.back } : {}),
      [c.f.adults]: form.adults,
      [c.f.children]: form.children,
      [c.f.experience]: form.experience,
      ...(form.comfort ? { [c.f.comfort]: form.comfort } : {}),
      ...(form.budget.trim() ? { [c.f.budget]: form.budget.trim() } : {}),
      ...(form.services.length ? { [c.f.services]: form.services.join(", ") } : {}),
      ...(form.notes.trim() ? { [c.f.notes]: form.notes.trim() } : {}),
      [c.f.name]: form.name.trim(),
      [c.f.phone]: form.phone.trim(),
      [c.f.email]: form.email.trim(),
    })
    setDone(saved)
    setRequests(loadRequests("travel"))
    setForm(EMPTY_REQUEST)
    document.getElementById("sur-mesure")?.scrollIntoView({ block: "start" })
  }

  const field = (key: Exclude<keyof RequestForm, "services">) => ({
    value: form[key],
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `travel-${key}-err` : undefined,
    onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value })),
  })
  const error = (key: keyof RequestForm) =>
    errors[key] ? (
      <span id={`travel-${key}-err`} className="yx-error">
        {errors[key]}
      </span>
    ) : null

  return (
    <div className="yx ui-booking -mt-[4.75rem]">
      <section className="yx-hero yx-hero-short">
        <img src={homeStills.travel} alt="" />
        <div className="frame yx-hero-inner">
          <p className="yx-kicker">{c.kicker}</p>
          <h1 className="yx-h1">{c.title}</h1>
          <p className="yx-lead">{c.lead}</p>
          <p className="yx-hero-note">{c.heroNote}</p>
        </div>
      </section>

      <div className="frame">
        <form id="travel-search" className="yx-search" noValidate onSubmit={runSearch}>
          <label className="drive-field yx-search-main">
            {c.s.destination}
            <input list="travel-destinations" placeholder={c.s.destinationPh} value={search.q} onChange={(event) => setSearch({ ...search, q: event.target.value })} />
          </label>
          <label className="drive-field">
            {c.s.depart}
            <input type="date" min={todayIso()} value={search.depart} onChange={(event) => setSearch({ ...search, depart: event.target.value })} />
          </label>
          <label className="drive-field">
            {c.s.back}
            <input type="date" min={search.depart || todayIso()} value={search.back} onChange={(event) => setSearch({ ...search, back: event.target.value })} />
          </label>
          <label className="drive-field">
            {c.s.adults}
            <input inputMode="numeric" value={search.adults} onChange={(event) => setSearch({ ...search, adults: event.target.value })} />
          </label>
          <label className="drive-field">
            {c.s.children}
            <input inputMode="numeric" value={search.children} onChange={(event) => setSearch({ ...search, children: event.target.value })} />
          </label>
          <label className="drive-field">
            {c.s.kind}
            <select value={search.type} onChange={(event) => setSearch({ ...search, type: event.target.value })}>
              <option value="">{c.s.anyKind}</option>
              {KINDS.map((key) => (
                <option key={key} value={key}>
                  {c.kinds[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="drive-field">
            {c.s.budget}
            <input inputMode="numeric" value={search.budget} onChange={(event) => setSearch({ ...search, budget: event.target.value })} />
          </label>
          <button type="submit" className="drive-btn-primary yx-search-submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            {c.s.submit}
          </button>
          <datalist id="travel-destinations">
            {[...TRAVEL_DESTINATIONS, "International"].map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </form>
        {searchErrors.length ? (
          <ul className="drive-alert yx-search-errors" role="alert">
            {searchErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <section className="frame yx-section-tight" aria-labelledby="travel-destinations-title">
        <h2 id="travel-destinations-title" className="yx-h2">
          {c.destinationsTitle}
        </h2>
        <ul className="yx-destinations">
          {[...TRAVEL_DESTINATIONS, "International"].map((name) => (
            <li key={name}>
              <button
                type="button"
                className={`yx-place ${fold(q) === fold(name) ? "is-on" : ""}`}
                aria-pressed={fold(q) === fold(name)}
                onClick={() => {
                  setSearch({ ...search, q: name })
                  update({ q: name, offre: "" })
                }}
              >
                <img src={placeImage(name).src} alt="" loading="lazy" decoding="async" />
                <span>
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="offres" className="frame yx-section-tight yx-results" aria-labelledby="travel-results-title">
        <aside className="yx-filters" aria-label={c.filters}>
          <div className="yx-filters-head">
            <h2 className="yx-h3">{c.filters}</h2>
            <button
              type="button"
              className="yx-link"
              onClick={() => {
                setSearch({ q: "", depart: "", back: "", adults: "2", children: "0", type: "", budget: "" })
                setParams(new URLSearchParams())
              }}
            >
              {c.reset}
            </button>
          </div>
          <fieldset className="drive-facet">
            <legend>{c.s.kind}</legend>
            {KINDS.map((key) => (
              <label key={key} className="drive-facet-row">
                <input type="checkbox" checked={kind === key} onChange={() => update({ type: kind === key ? "" : key, offre: "" })} />
                <span>{c.kinds[key]}</span>
                <span className="drive-facet-count">{TRAVEL_OFFERS.filter((offer) => offer.kind === key).length}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="drive-facet">
            <legend>{c.zone}</legend>
            {ZONES.map((key) => (
              <label key={key} className="drive-facet-row">
                <input type="checkbox" checked={zone === key} onChange={() => update({ zone: zone === key ? "" : key, offre: "" })} />
                <span>{c.zones[key]}</span>
                <span className="drive-facet-count">{TRAVEL_OFFERS.filter((offer) => offer.zone === key).length}</span>
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="yx-results-main">
          <div className="yx-results-head">
            <div>
              <h2 id="travel-results-title" className="yx-h2">
                {c.resultsTitle}
              </h2>
              <p className="yx-count">{c.count.replace("{n}", String(results.length))}</p>
            </div>
            <label className="drive-field yx-sort">
              {c.sort}
              <select value={sort} onChange={(event) => update({ sort: event.target.value === "relevance" ? "" : event.target.value })}>
                {SORTS.map((key) => (
                  <option key={key} value={key}>
                    {c.sorts[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="yx-muted">{c.demoNote}</p>

          {results.length === 0 ? (
            <p className="yx-empty">{c.empty}</p>
          ) : (
            <ul className="yx-offers">
              {results.map((offer) => (
                <li key={offer.id} className="yx-offer">
                  <figure className="yx-offer-photo">
                    <img src={offerImage(offer).src} alt={offer.title[locale]} loading="lazy" decoding="async" />
                    {offerImage(offer).credit ? (
                      <figcaption>
                        <a href={offerImage(offer).source} target="_blank" rel="noreferrer">
                          {offerImage(offer).credit}
                        </a>
                      </figcaption>
                    ) : null}
                  </figure>
                  <div className="yx-offer-body">
                    <p className="yx-meta">
                      {c.kinds[offer.kind]} · {offer.region[locale]} · {c.nights(offer.nights)}
                    </p>
                    <h3 className="yx-h3">{offer.title[locale]}</h3>
                    <p className="yx-muted">{offer.summary[locale]}</p>

                  </div>
                  <div className="yx-offer-price">
                    <span className="yx-meta">{c.from}</span>
                    <strong>{offer.indicativeFcfa === null ? c.onRequest : fcfa(offer.indicativeFcfa)}</strong>
                    <button type="button" className="drive-btn-primary" onClick={() => update({ offre: offer.id })}>
                      {c.view}
                    </button>
                  </div>
                  {open?.id === offer.id ? (
                    <div className="yx-offer-detail" role="region" aria-label={offer.title[locale]}>
                      <div className="yx-detail-grid">
                        <div>
                          <h4 className="yx-h4">{c.detail.program}</h4>
                          <ul className="yx-list">
                            {offer.program.map((line) => (
                              <li key={line.fr}>{line[locale]}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="yx-h4">{c.detail.included}</h4>
                          <ul className="yx-list">
                            {offer.included.map((line) => (
                              <li key={line.fr}>{line[locale]}</li>
                            ))}
                          </ul>
                          <h4 className="yx-h4">{c.detail.excluded}</h4>
                          <ul className="yx-list">
                            {offer.excluded.map((line) => (
                              <li key={line.fr}>{line[locale]}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="yx-h4">{c.detail.conditions}</h4>
                          <p className="yx-muted">{c.detail.conditionsBody}</p>
                        </div>
                      </div>
                      <div className="yx-actions">
                        <button type="button" className="drive-btn-primary" onClick={() => requestOffer(offer)}>
                          {c.detail.request}
                        </button>
                        <button type="button" className="drive-btn-secondary" onClick={() => update({ offre: "" })}>
                          {c.detail.close}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="sur-mesure" className="frame yx-section" aria-labelledby="travel-custom">
        <div className="yx-quote">
          <aside className="yx-quote-side" style={{ backgroundImage: `linear-gradient(180deg, rgb(7 23 45 / 0.82), rgb(7 23 45 / 0.95)), url(${homeStills.travel})` }}>
            <p className="yx-kicker">{c.quoteKicker}</p>
            <h2 id="travel-custom" className="yx-h2">
              {c.customTitle}
            </h2>
            <p>{c.customLead}</p>
            <ol className="yx-quote-steps">
              {c.quoteSteps.map(([title, body]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </li>
              ))}
            </ol>
            <p className="yx-quote-badge">
              <ShieldCheck size={18} aria-hidden="true" /> {c.quoteFree}
            </p>
          </aside>
          <div className="yx-quote-main">
          {done ? (
            <div className="yx-done" role="status">
              <h3 className="yx-h3">{c.doneTitle}</h3>
              <p>
                {c.reference} : <strong>{done.reference}</strong>
              </p>
              <dl className="yx-summary">
                {Object.entries(done.summary).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="yx-muted">{c.doneBody}</p>
              <button type="button" className="drive-btn-secondary" onClick={() => setDone(null)}>
                {c.newRequest}
              </button>
            </div>
          ) : (
            <form className="yx-form" noValidate onSubmit={submit}>
              {Object.keys(errors).length > 0 ? <p className="drive-alert yx-span">{c.ferr.summary}</p> : null}
              <p className="yx-part yx-span"><span>1</span>{c.parts[0]}</p>
              <label className="drive-field">
                {c.f.destination}
                <input list="travel-destinations" {...field("destination")} />
                {error("destination")}
              </label>
              <label className="drive-field">
                {c.f.offer}
                <select {...field("offer")}>
                  <option value="">—</option>
                  {TRAVEL_OFFERS.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {offer.title[locale]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="drive-field">
                {c.f.depart}
                <input type="date" min={todayIso()} {...field("depart")} />
                {error("depart")}
              </label>
              <label className="drive-field">
                {c.f.back}
                <input type="date" min={form.depart || todayIso()} {...field("back")} />
                {error("back")}
              </label>
              <label className="drive-field">
                {c.f.adults}
                <input inputMode="numeric" {...field("adults")} />
                {error("adults")}
              </label>
              <label className="drive-field">
                {c.f.children}
                <input inputMode="numeric" {...field("children")} />
                {error("children")}
              </label>
              <p className="yx-part yx-span"><span>2</span>{c.parts[1]}</p>
              <label className="drive-field">
                {c.f.experience}
                <select {...field("experience")}>
                  <option value="">{c.f.choose}</option>
                  {c.f.experiences.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                {error("experience")}
              </label>
              <label className="drive-field">
                {c.f.budget}
                <input inputMode="numeric" {...field("budget")} />
              </label>
              <fieldset className="yx-span">
                <legend className="yx-legend">{c.f.comfort}</legend>
                <div className="yx-service-tiles is-3">
                  {c.f.comforts.map((item) => (
                    <label key={item} className={form.comfort === item ? "is-on" : ""}>
                      <input type="radio" name="travel-comfort" value={item} checked={form.comfort === item} onChange={() => setForm((current) => ({ ...current, comfort: item }))} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="yx-span">
                <legend className="yx-legend">{c.f.services}</legend>
                <div className="yx-chip-checks">
                  {c.f.serviceList.map((item) => (
                    <label key={item} className={form.services.includes(item) ? "is-on" : ""}>
                      <input
                        type="checkbox"
                        checked={form.services.includes(item)}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            services: current.services.includes(item) ? current.services.filter((value) => value !== item) : [...current.services, item],
                          }))
                        }
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="drive-field yx-span">
                {c.f.notes}
                <textarea rows={3} {...field("notes")} />
              </label>
              <p className="yx-part yx-span"><span>3</span>{c.parts[2]}</p>
              <label className="drive-field yx-span">
                {c.f.name}
                <input autoComplete="name" {...field("name")} />
                {error("name")}
              </label>
              <label className="drive-field">
                {c.f.phone}
                <input type="tel" inputMode="tel" autoComplete="tel" placeholder="6 77 00 00 00" {...field("phone")} />
                {error("phone") ?? <span className="yx-hint">{c.f.phoneHint}</span>}
              </label>
              <label className="drive-field">
                {c.f.email}
                <input type="email" autoComplete="email" {...field("email")} />
                {error("email")}
              </label>
              <div className="yx-submit yx-span">
                <span className="yx-muted"><Lock size={14} aria-hidden="true" /> {c.secure}</span>
                <button type="submit" className="drive-btn-primary">
                  {c.f.submit}
                </button>
              </div>
            </form>
          )}
          </div>
        </div>

        {requests.length > 0 ? (
          <div className="yx-panel">
            <h3 className="yx-h3">{c.mine}</h3>
            <ul className="yx-requests">
              {requests.map((request) => (
                <li key={request.reference}>
                  <strong>{request.reference}</strong>
                  <span>{Object.values(request.summary)[0]}</span>
                  <span>{new Date(request.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}</span>
                  <span className="yx-tag">{c.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  )
}
