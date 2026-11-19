import { useState, type FormEvent } from "react"
import { Camera, Lock, Megaphone, ShieldCheck, Sparkles, Video } from "lucide-react"
import { universeImage } from "../content/universeImages"
import { homeStills } from "../content/visuals"
import { isCameroonPhone, isEmail, loadRequests, saveRequest, todayIso, type DemoRequest } from "../lib/demoRequests"
import { useLocale } from "../lib/locale"

type Expertise = "photo" | "video" | "events" | "communication"

const EXPERTISES: Expertise[] = ["photo", "video", "events", "communication"]
const ICONS = { photo: Camera, video: Video, events: Sparkles, communication: Megaphone } as const

const PROJECTS: { id: string; category: Expertise }[] = [
  { id: "p1", category: "photo" },
  { id: "p2", category: "photo" },
  { id: "p3", category: "video" },
  { id: "p5", category: "events" },
  { id: "p6", category: "events" },
  { id: "p7", category: "communication" },
]

const copy = {
  fr: {
    kicker: "YAMOO MEDIA · Agence créative",
    title: "Des images qui donnent du poids à votre histoire.",
    lead: "Photographie, production vidéo, événementiel et communication, conçus et produits au Cameroun.",
    ctaQuote: "Demander un devis",
    ctaPortfolio: "Voir le portfolio",
    heroNote: "Visuel provisoire d'ambiance.",
    agencyTitle: "Une agence, quatre savoir-faire",
    agencyBody:
      "YAMOO MEDIA accompagne entreprises, institutions et particuliers, de l'idée à la diffusion. Une même équipe tient le brief, la production et la livraison.",
    principles: ["Un interlocuteur unique du brief à la livraison", "Une direction artistique cohérente sur tous les supports", "Des livrables adaptés au web, aux réseaux et à l'impression"],
    expertiseTitle: "Expertises",
    expertise: {
      photo: { name: "Photographie", body: "Portraits, corporate, produits, mariages et cérémonies.", items: ["Séance en studio ou en extérieur", "Retouche et sélection", "Livraison en haute définition"] },
      video: { name: "Production vidéo", body: "Films institutionnels, clips, captations et formats sociaux.", items: ["Écriture et repérages", "Tournage et prise de son", "Montage, étalonnage, sous-titres"] },
      events: { name: "Événementiel", body: "Conception et couverture de lancements, conférences et cérémonies.", items: ["Scénographie et déroulé", "Couverture photo et vidéo", "Coordination sur place"] },
      communication: { name: "Communication", body: "Identité visuelle, réseaux sociaux et campagnes.", items: ["Identité et charte graphique", "Calendrier éditorial", "Contenus de campagne"] },
    } as Record<Expertise, { name: string; body: string; items: string[] }>,
    portfolioTitle: "Portfolio",
    portfolioNote: "Projets types présentés à titre d'exemple, sans client réel. Photos d'illustration sous licence libre (Wikimedia Commons).",
    all: "Tous",
    deliverables: "Prestations",
    projects: {
      p1: { title: "Photographie produit en studio", body: "Prises de vue en studio pour un catalogue, un site marchand et des affiches.", deliverables: "Séance studio · retouche · 20 images" },
      p2: { title: "Reportage de mariage à Douala", body: "Couverture de la cérémonie et de la réception, des préparatifs à la soirée.", deliverables: "Reportage · album · galerie privée" },
      p3: { title: "Film institutionnel de deux minutes", body: "Présentation d'une organisation : interviews, plans d'activité, motion design.", deliverables: "Écriture · tournage · montage" },
      p4: { title: "Captation d'une conférence à Yaoundé", body: "Captation multicaméra et extraits courts pour les réseaux sociaux.", deliverables: "Captation · montage · 5 extraits" },
      p5: { title: "Lancement de produit", body: "Conception du déroulé, scénographie et couverture de la soirée de lancement.", deliverables: "Conception · coordination · couverture" },
      p6: { title: "Cérémonie de remise de diplômes", body: "Organisation de la cérémonie et livraison d'un film souvenir.", deliverables: "Déroulé · captation · film souvenir" },
      p7: { title: "Identité visuelle d'un restaurant", body: "Logo, palette, typographie et déclinaisons pour menus et enseigne.", deliverables: "Identité · charte · déclinaisons" },
      p8: { title: "Campagne réseaux sociaux", body: "Trois mois de contenus planifiés pour une marque locale.", deliverables: "Calendrier · visuels · vidéos courtes" },
    } as Record<string, { title: string; body: string; deliverables: string }>,
    methodTitle: "Méthode",
    method: [
      ["Brief", "Nous précisons l'objectif, le public, le budget et les délais."],
      ["Proposition", "Vous recevez une proposition détaillée et un devis."],
      ["Production", "Tournage, séance, conception ou organisation selon le projet."],
      ["Livraison", "Livrables finalisés, révisions comprises dans le périmètre convenu."],
    ],
    quoteTitle: "Demande de devis",
    quoteLead: "Décrivez votre projet. La demande est enregistrée sur cet appareil ; aucun devis n'est envoyé automatiquement.",
    quoteKicker: "Devis sur mesure",
    quoteSteps: [
      ["Votre brief", "Prestation, date, lieu et budget : quelques minutes suffisent."],
      ["Échange", "Nous précisons avec vous l'objectif, le public et les livrables."],
      ["Proposition", "Un devis détaillé, sans engagement, avant toute production."],
    ],
    quoteFree: "Sans engagement",
    partProject: "Votre projet",
    partContact: "Vos coordonnées",
    secure: "Vos informations restent sur cet appareil.",
    f: {
      service: "Prestation",
      choose: "Choisir",
      name: "Nom complet",
      phone: "Téléphone",
      phoneHint: "Format camerounais, ex. 6 77 00 00 00",
      email: "E-mail",
      city: "Ville",
      date: "Date souhaitée",
      place: "Lieu",
      budget: "Budget indicatif (FCFA, facultatif)",
      description: "Description du projet",
      needs: "Besoins particuliers (facultatif)",
      submit: "Envoyer la demande",
    },
    specific: {
      photo: { a: "Type de séance", aOptions: ["Portrait", "Corporate", "Produit", "Mariage ou cérémonie", "Événement"], b: "Durée estimée (heures)" },
      video: { a: "Format", aOptions: ["Film institutionnel", "Clip", "Captation", "Formats réseaux sociaux"], b: "Durée finale souhaitée (minutes)" },
      events: { a: "Type d'événement", aOptions: ["Lancement", "Conférence", "Mariage", "Cérémonie", "Soirée d'entreprise"], b: "Nombre d'invités" },
      communication: { a: "Besoin principal", aOptions: ["Identité visuelle", "Réseaux sociaux", "Campagne", "Contenus"], b: "Canaux visés" },
    } as Record<Expertise, { a: string; aOptions: string[]; b: string }>,
    err: {
      service: "Choisissez une prestation.",
      name: "Indiquez votre nom.",
      phone: "Numéro camerounais invalide.",
      email: "Adresse e-mail invalide.",
      city: "Indiquez la ville.",
      date: "Choisissez une date à partir d'aujourd'hui.",
      a: "Précisez ce champ.",
      description: "Décrivez le projet en 20 caractères au moins.",
      summary: "Corrigez les champs signalés.",
    },
    doneTitle: "Demande enregistrée",
    doneBody: "Enregistrée sur cet appareil uniquement. Aucun devis n'a été émis et aucune équipe n'a été notifiée.",
    reference: "Référence",
    newRequest: "Nouvelle demande",
    myRequests: "Mes demandes sur cet appareil",
    status: "Non transmise",
    contactTitle: "Contact",
    contactBody: "Coordonnées provisoires, à remplacer par les coordonnées officielles : heloisemarcellinepelagiekackka@gmail.com · +237 6XX XX XX XX.",
  },
  en: {
    kicker: "YAMOO MEDIA · Creative agency",
    title: "Images that give weight to your story.",
    lead: "Photography, video production, events and communication, designed and produced in Cameroon.",
    ctaQuote: "Request a quote",
    ctaPortfolio: "See the portfolio",
    heroNote: "Provisional mood image.",
    agencyTitle: "One agency, four crafts",
    agencyBody:
      "YAMOO MEDIA works with companies, institutions and individuals, from idea to release. One team owns the brief, the production and the delivery.",
    principles: ["One contact from brief to delivery", "Consistent art direction across every medium", "Deliverables sized for web, social and print"],
    expertiseTitle: "Expertise",
    expertise: {
      photo: { name: "Photography", body: "Portraits, corporate, products, weddings and ceremonies.", items: ["Studio or on-location shoot", "Selection and retouching", "High-definition delivery"] },
      video: { name: "Video production", body: "Corporate films, music videos, live capture and social formats.", items: ["Writing and scouting", "Filming and sound", "Editing, grading, subtitles"] },
      events: { name: "Events", body: "Design and coverage of launches, conferences and ceremonies.", items: ["Staging and run of show", "Photo and video coverage", "On-site coordination"] },
      communication: { name: "Communication", body: "Visual identity, social media and campaigns.", items: ["Identity and brand guidelines", "Editorial calendar", "Campaign content"] },
    } as Record<Expertise, { name: string; body: string; items: string[] }>,
    portfolioTitle: "Portfolio",
    portfolioNote: "Sample projects shown as examples, with no real client. Illustration photos under free licences (Wikimedia Commons).",
    all: "All",
    deliverables: "Services",
    projects: {
      p1: { title: "Studio product photography", body: "Studio shots for a catalogue, an online shop and posters.", deliverables: "Studio shoot · retouching · 20 images" },
      p2: { title: "Wedding coverage in Douala", body: "Ceremony and reception coverage, from preparation to the evening.", deliverables: "Coverage · album · private gallery" },
      p3: { title: "Two-minute corporate film", body: "An organisation overview: interviews, activity footage, motion design.", deliverables: "Writing · filming · editing" },
      p4: { title: "Conference capture in Yaoundé", body: "Multi-camera capture and short clips for social media.", deliverables: "Capture · editing · 5 clips" },
      p5: { title: "Product launch", body: "Run of show, staging and coverage of the launch evening.", deliverables: "Design · coordination · coverage" },
      p6: { title: "Graduation ceremony", body: "Ceremony organisation and a keepsake film.", deliverables: "Run of show · capture · keepsake film" },
      p7: { title: "Restaurant visual identity", body: "Logo, palette, typography and applications for menus and signage.", deliverables: "Identity · guidelines · applications" },
      p8: { title: "Social media campaign", body: "Three months of planned content for a local brand.", deliverables: "Calendar · visuals · short videos" },
    } as Record<string, { title: string; body: string; deliverables: string }>,
    methodTitle: "Method",
    method: [
      ["Brief", "We clarify the goal, audience, budget and timing."],
      ["Proposal", "You receive a detailed proposal and a quote."],
      ["Production", "Filming, shoot, design or organisation, depending on the project."],
      ["Delivery", "Final deliverables, with revisions within the agreed scope."],
    ],
    quoteTitle: "Request a quote",
    quoteLead: "Describe your project. The request is saved on this device; no quote is sent automatically.",
    quoteKicker: "Tailored quote",
    quoteSteps: [
      ["Your brief", "Service, date, place and budget: it takes a few minutes."],
      ["Discussion", "We clarify the goal, audience and deliverables with you."],
      ["Proposal", "A detailed, no-obligation quote before any production."],
    ],
    quoteFree: "No obligation",
    partProject: "Your project",
    partContact: "Your details",
    secure: "Your information stays on this device.",
    f: {
      service: "Service",
      choose: "Choose",
      name: "Full name",
      phone: "Phone",
      phoneHint: "Cameroon format, e.g. 6 77 00 00 00",
      email: "Email",
      city: "City",
      date: "Preferred date",
      place: "Venue",
      budget: "Indicative budget (FCFA, optional)",
      description: "Project description",
      needs: "Special requirements (optional)",
      submit: "Send request",
    },
    specific: {
      photo: { a: "Shoot type", aOptions: ["Portrait", "Corporate", "Product", "Wedding or ceremony", "Event"], b: "Estimated length (hours)" },
      video: { a: "Format", aOptions: ["Corporate film", "Music video", "Live capture", "Social formats"], b: "Target final length (minutes)" },
      events: { a: "Event type", aOptions: ["Launch", "Conference", "Wedding", "Ceremony", "Company evening"], b: "Number of guests" },
      communication: { a: "Main need", aOptions: ["Visual identity", "Social media", "Campaign", "Content"], b: "Target channels" },
    } as Record<Expertise, { a: string; aOptions: string[]; b: string }>,
    err: {
      service: "Choose a service.",
      name: "Enter your name.",
      phone: "Invalid Cameroon number.",
      email: "Invalid email address.",
      city: "Enter the city.",
      date: "Choose a date from today onwards.",
      a: "Complete this field.",
      description: "Describe the project in at least 20 characters.",
      summary: "Fix the highlighted fields.",
    },
    doneTitle: "Request saved",
    doneBody: "Saved on this device only. No quote has been issued and no team has been notified.",
    reference: "Reference",
    newRequest: "New request",
    myRequests: "My requests on this device",
    status: "Not sent",
    contactTitle: "Contact",
    contactBody: "Provisional contact details, to be replaced with official ones: heloisemarcellinepelagiekackka@gmail.com · +237 6XX XX XX XX.",
  },
}

const EMPTY = { service: "", name: "", phone: "", email: "", city: "", date: "", place: "", budget: "", description: "", needs: "", a: "", b: "" }
type Form = typeof EMPTY

export function MediaPage() {
  const locale = useLocale()
  const c = copy[locale]
  const [filter, setFilter] = useState<Expertise | "all">("all")
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [done, setDone] = useState<DemoRequest | null>(null)
  const [requests, setRequests] = useState<DemoRequest[]>(() => loadRequests("media"))

  const service = form.service as Expertise | ""
  const set = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const projects = filter === "all" ? PROJECTS : PROJECTS.filter((project) => project.category === filter)

  const startQuote = (expertise: Expertise) => {
    setDone(null)
    setForm((current) => ({ ...current, service: expertise, a: "", b: "" }))
    document.getElementById("devis")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Partial<Record<keyof Form, string>> = {}
    if (!service) next.service = c.err.service
    if (form.name.trim().length < 2) next.name = c.err.name
    if (!isCameroonPhone(form.phone)) next.phone = c.err.phone
    if (!isEmail(form.email)) next.email = c.err.email
    if (!form.city.trim()) next.city = c.err.city
    if (!form.date || form.date < todayIso()) next.date = c.err.date
    if (service && !form.a) next.a = c.err.a
    if (form.description.trim().length < 20) next.description = c.err.description
    setErrors(next)
    if (Object.keys(next).length > 0 || !service) return
    const spec = c.specific[service]
    const saved = saveRequest("media", {
      [c.f.service]: c.expertise[service].name,
      [spec.a]: form.a,
      ...(form.b.trim() ? { [spec.b]: form.b.trim() } : {}),
      [c.f.name]: form.name.trim(),
      [c.f.phone]: form.phone.trim(),
      [c.f.email]: form.email.trim(),
      [c.f.city]: form.city.trim(),
      [c.f.date]: form.date,
      ...(form.place.trim() ? { [c.f.place]: form.place.trim() } : {}),
      ...(form.budget.trim() ? { [c.f.budget]: form.budget.trim() } : {}),
      [c.f.description]: form.description.trim(),
      ...(form.needs.trim() ? { [c.f.needs]: form.needs.trim() } : {}),
    })
    setDone(saved)
    setRequests(loadRequests("media"))
    setForm(EMPTY)
    document.getElementById("devis")?.scrollIntoView({ block: "start" })
  }

  const field = (key: keyof Form) => ({
    value: form[key],
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `media-${key}-err` : undefined,
    onChange: (event: { target: { value: string } }) => set(key, event.target.value),
  })
  const error = (key: keyof Form) =>
    errors[key] ? (
      <span id={`media-${key}-err`} className="yx-error">
        {errors[key]}
      </span>
    ) : null

  return (
    <div className="yx -mt-[4.75rem]">
      <section className="yx-hero">
        <img src={homeStills.media} alt="" />
        <div className="frame yx-hero-inner">
          <p className="yx-kicker">{c.kicker}</p>
          <h1 className="yx-h1">{c.title}</h1>
          <p className="yx-lead">{c.lead}</p>
          <div className="yx-actions">
            <a href="#devis" className="yx-btn yx-btn-gold">
              {c.ctaQuote}
            </a>
            <a href="#portfolio" className="yx-btn yx-btn-ghost">
              {c.ctaPortfolio}
            </a>
          </div>
          <p className="yx-hero-note">{c.heroNote}</p>
        </div>
      </section>

      <section className="frame yx-section yx-split">
        <div>
          <h2 className="yx-h2">{c.agencyTitle}</h2>
          <p className="yx-body">{c.agencyBody}</p>
        </div>
        <ul className="yx-principles">
          {c.principles.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="frame yx-section" aria-labelledby="media-expertise">
        <h2 id="media-expertise" className="yx-h2">
          {c.expertiseTitle}
        </h2>
        <ul className="yx-grid-4">
          {EXPERTISES.map((key) => {
            const Icon = ICONS[key]
            const item = c.expertise[key]
            return (
              <li key={key} className="yx-card">
                <Icon className="yx-icon" aria-hidden="true" />
                <h3 className="yx-h3">{item.name}</h3>
                <p className="yx-muted">{item.body}</p>
                <ul className="yx-list">
                  {item.items.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <button type="button" className="yx-link" onClick={() => startQuote(key)}>
                  {c.ctaQuote}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section id="portfolio" className="frame yx-section" aria-labelledby="media-portfolio">
        <div className="yx-section-head">
          <div>
            <h2 id="media-portfolio" className="yx-h2">
              {c.portfolioTitle}
            </h2>
            <p className="yx-muted">{c.portfolioNote}</p>
          </div>
          <div className="yx-chips" role="group" aria-label={c.portfolioTitle}>
            {(["all", ...EXPERTISES] as const).map((key) => (
              <button key={key} type="button" className={`yx-chip ${filter === key ? "is-on" : ""}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {key === "all" ? c.all : c.expertise[key].name}
              </button>
            ))}
          </div>
        </div>
        <ul className="yx-grid-3">
          {projects.map((project) => {
            const Icon = ICONS[project.category]
            const item = c.projects[project.id]
            const image = universeImage(`media/${project.id}`)
            return (
              <li key={project.id} className="yx-project">
                {image ? (
                  <figure className="yx-photo">
                    <img src={image.src} alt={item.title} loading="lazy" decoding="async" />
                    <figcaption>
                      <a href={image.source} target="_blank" rel="noreferrer">
                        {image.credit}
                      </a>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="yx-project-visual" aria-hidden="true">
                    <Icon />
                  </div>
                )}
                <div className="yx-project-body">
                  <h3 className="yx-h3">{item.title}</h3>
                  <p className="yx-meta">{c.expertise[project.category].name}</p>
                  <p className="yx-muted">{item.body}</p>
                  <p className="yx-meta">
                    {c.deliverables} : {item.deliverables}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="frame yx-section" aria-labelledby="media-method">
        <h2 id="media-method" className="yx-h2">
          {c.methodTitle}
        </h2>
        <ol className="yx-steps">
          {c.method.map(([title, body], index) => (
            <li key={title}>
              <span className="yx-step-index">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="yx-h3">{title}</h3>
              <p className="yx-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="devis" className="frame yx-section ui-booking" aria-labelledby="media-quote">
        <div className="yx-quote">
          <aside className="yx-quote-side" style={{ backgroundImage: `linear-gradient(180deg, rgb(7 23 45 / 0.82), rgb(7 23 45 / 0.95)), url(${homeStills.media})` }}>
            <p className="yx-kicker">{c.quoteKicker}</p>
            <h2 id="media-quote" className="yx-h2">
              {c.quoteTitle}
            </h2>
            <p>{c.quoteLead}</p>
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
              {Object.keys(errors).length > 0 ? <p className="drive-alert yx-span">{c.err.summary}</p> : null}
              <p className="yx-part yx-span"><span>1</span>{c.partProject}</p>
              <fieldset className="yx-span">
                <legend className="yx-legend">{c.f.service}</legend>
                <div className="yx-service-tiles">
                  {EXPERTISES.map((key) => {
                    const Icon = ICONS[key]
                    return (
                      <label key={key} className={form.service === key ? "is-on" : ""}>
                        <input
                          type="radio"
                          name="media-service"
                          value={key}
                          checked={form.service === key}
                          onChange={() => setForm((current) => ({ ...current, service: key, a: "", b: "" }))}
                        />
                        <Icon size={22} aria-hidden="true" />
                        <span>{c.expertise[key].name}</span>
                      </label>
                    )
                  })}
                </div>
                {error("service")}
              </fieldset>
              {service ? (
                <>
                  <label className="drive-field">
                    {c.specific[service].a}
                    <select {...field("a")}>
                      <option value="">{c.f.choose}</option>
                      {c.specific[service].aOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {error("a")}
                  </label>
                  <label className="drive-field">
                    {c.specific[service].b}
                    <input {...field("b")} />
                  </label>
                </>
              ) : null}
              <label className="drive-field">
                {c.f.city}
                <input list="yx-cities" {...field("city")} />
                {error("city")}
              </label>
              <label className="drive-field">
                {c.f.date}
                <input type="date" min={todayIso()} {...field("date")} />
                {error("date")}
              </label>
              <label className="drive-field">
                {c.f.place}
                <input {...field("place")} />
              </label>
              <label className="drive-field">
                {c.f.budget}
                <input inputMode="numeric" {...field("budget")} />
              </label>
              <label className="drive-field yx-span">
                {c.f.description}
                <textarea rows={4} {...field("description")} />
                {error("description")}
              </label>
              <label className="drive-field yx-span">
                {c.f.needs}
                <textarea rows={2} {...field("needs")} />
              </label>
              <p className="yx-part yx-span"><span>2</span>{c.partContact}</p>
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
              <datalist id="yx-cities">
                {["Douala", "Yaoundé", "Kribi", "Limbe", "Buea", "Bafoussam", "Garoua"].map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
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
            <h3 className="yx-h3">{c.myRequests}</h3>
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

      <section className="frame yx-section yx-contact">
        <h2 className="yx-h2">{c.contactTitle}</h2>
        <p className="yx-muted">{c.contactBody}</p>
      </section>
    </div>
  )
}
