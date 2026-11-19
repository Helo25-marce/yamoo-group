export type TravelKind = "stay" | "excursion" | "circuit" | "transfer"
export type TravelZone = "cameroon" | "international"
export type Localized = { fr: string; en: string }

export type TravelOffer = {
  id: string
  destination: string
  region: Localized
  zone: TravelZone
  kind: TravelKind
  nights: number
  /** Demonstration figure per adult. Never a confirmed price. */
  indicativeFcfa: number | null
  title: Localized
  summary: Localized
  program: Localized[]
  included: Localized[]
  excluded: Localized[]
}

const l = (fr: string, en: string): Localized => ({ fr, en })

export const TRAVEL_DESTINATIONS = ["Douala", "Yaoundé", "Kribi", "Limbe", "Buea", "Bafoussam", "Garoua"] as const

export const TRAVEL_OFFERS: TravelOffer[] = [
  {
    id: "kribi-plages",
    destination: "Kribi",
    region: l("Sud, Cameroun", "South, Cameroon"),
    zone: "cameroon",
    kind: "stay",
    nights: 3,
    indicativeFcfa: 185000,
    title: l("Séjour balnéaire à Kribi", "Beach stay in Kribi"),
    summary: l("Plages de sable, chutes de la Lobé et cuisine de la mer.", "Sandy beaches, the Lobé falls and seafood cuisine."),
    program: [l("Jour 1 : route depuis Douala, installation", "Day 1: drive from Douala, check-in"), l("Jour 2 : chutes de la Lobé en pirogue", "Day 2: Lobé falls by canoe"), l("Jour 3 : journée libre en bord de mer", "Day 3: free day by the sea"), l("Jour 4 : retour", "Day 4: return")],
    included: [l("Transport aller-retour avec chauffeur", "Return transport with driver"), l("Visite des chutes", "Falls visit")],
    excluded: [l("Hébergement : non réservable en ligne, proposé sur devis", "Accommodation: not bookable online, quoted on request"), l("Repas et boissons", "Meals and drinks")],
  },
  {
    id: "mont-cameroun",
    destination: "Buea",
    region: l("Sud-Ouest, Cameroun", "South-West, Cameroon"),
    zone: "cameroon",
    kind: "excursion",
    nights: 0,
    indicativeFcfa: 45000,
    title: l("Randonnée sur les pentes du mont Cameroun", "Hike on the slopes of Mount Cameroon"),
    summary: l("Une journée de marche encadrée au départ de Buea.", "A guided day hike from Buea."),
    program: [l("Départ matinal de Buea", "Early departure from Buea"), l("Montée jusqu'au premier refuge", "Climb to the first hut"), l("Descente et retour en fin d'après-midi", "Descent and return late afternoon")],
    included: [l("Guide local", "Local guide"), l("Transport depuis Buea", "Transport from Buea")],
    excluded: [l("Équipement de randonnée", "Hiking gear"), l("Repas", "Meals")],
  },
  {
    id: "limbe-cote",
    destination: "Limbe",
    region: l("Sud-Ouest, Cameroun", "South-West, Cameroon"),
    zone: "cameroon",
    kind: "stay",
    nights: 2,
    indicativeFcfa: 140000,
    title: l("Week-end à Limbe", "Weekend in Limbe"),
    summary: l("Plages de sable noir, jardin botanique et centre de faune.", "Black-sand beaches, botanical garden and wildlife centre."),
    program: [l("Jour 1 : arrivée et plage", "Day 1: arrival and beach"), l("Jour 2 : jardin botanique et centre de faune", "Day 2: botanical garden and wildlife centre"), l("Jour 3 : retour", "Day 3: return")],
    included: [l("Transport avec chauffeur", "Transport with driver"), l("Entrées des visites prévues", "Entry to planned visits")],
    excluded: [l("Hébergement : sur devis", "Accommodation: on request"), l("Repas", "Meals")],
  },
  {
    id: "ouest-chefferies",
    destination: "Bafoussam",
    region: l("Ouest, Cameroun", "West, Cameroon"),
    zone: "cameroon",
    kind: "circuit",
    nights: 4,
    indicativeFcfa: 260000,
    title: l("Circuit des chefferies de l'Ouest", "West Cameroon chiefdoms circuit"),
    summary: l("Patrimoine, marchés et paysages des hauts plateaux.", "Heritage, markets and highland landscapes."),
    program: [l("Jour 1 : Douala → Bafoussam", "Day 1: Douala → Bafoussam"), l("Jour 2 : chefferie et musée", "Day 2: chiefdom and museum"), l("Jour 3 : marchés et artisanat", "Day 3: markets and crafts"), l("Jour 4 : paysages et lacs", "Day 4: landscapes and lakes"), l("Jour 5 : retour", "Day 5: return")],
    included: [l("Transport avec chauffeur", "Transport with driver"), l("Accompagnement culturel", "Cultural guide")],
    excluded: [l("Hébergement : sur devis", "Accommodation: on request"), l("Offrandes et dons coutumiers", "Customary gifts")],
  },
  {
    id: "nord-benoue",
    destination: "Garoua",
    region: l("Nord, Cameroun", "North, Cameroon"),
    zone: "cameroon",
    kind: "circuit",
    nights: 5,
    indicativeFcfa: null,
    title: l("Grand Nord et parc de la Bénoué", "Far North and Bénoué park"),
    summary: l("Savane, fleuve et faune. Programme établi sur devis selon la saison.", "Savannah, river and wildlife. Programme set on request depending on season."),
    program: [l("Programme établi après étude de la demande", "Programme set after reviewing the request")],
    included: [l("Conception du circuit", "Circuit design")],
    excluded: [l("Vols intérieurs : non réservables en ligne", "Domestic flights: not bookable online"), l("Hébergement : sur devis", "Accommodation: on request")],
  },
  {
    id: "douala-transfert",
    destination: "Douala",
    region: l("Littoral, Cameroun", "Littoral, Cameroon"),
    zone: "cameroon",
    kind: "transfer",
    nights: 0,
    indicativeFcfa: 30000,
    title: l("Transfert aéroport de Douala", "Douala airport transfer"),
    summary: l("Accueil à l'arrivée et trajet jusqu'à votre adresse en ville.", "Meet on arrival and drive to your address in town."),
    program: [l("Accueil au terminal", "Meet at the terminal"), l("Trajet jusqu'à l'adresse indiquée", "Drive to the given address")],
    included: [l("Véhicule avec chauffeur", "Vehicle with driver")],
    excluded: [l("Attente au-delà d'une heure", "Waiting beyond one hour")],
  },
  {
    id: "yaounde-decouverte",
    destination: "Yaoundé",
    region: l("Centre, Cameroun", "Centre, Cameroon"),
    zone: "cameroon",
    kind: "excursion",
    nights: 0,
    indicativeFcfa: 35000,
    title: l("Journée découverte de Yaoundé", "Yaoundé discovery day"),
    summary: l("Musées, points de vue et marchés de la capitale.", "Museums, viewpoints and markets of the capital."),
    program: [l("Matin : musées", "Morning: museums"), l("Midi : point de vue sur la ville", "Midday: city viewpoint"), l("Après-midi : marchés", "Afternoon: markets")],
    included: [l("Véhicule avec chauffeur", "Vehicle with driver"), l("Accompagnement", "Guide")],
    excluded: [l("Entrées des musées", "Museum tickets"), l("Repas", "Meals")],
  },
  {
    id: "international-sur-mesure",
    destination: "International",
    region: l("Destination à définir", "Destination to define"),
    zone: "international",
    kind: "stay",
    nights: 7,
    indicativeFcfa: null,
    title: l("Séjour international sur mesure", "Tailor-made international stay"),
    summary: l("Afrique, Europe, Moyen-Orient : itinéraire construit selon votre demande.", "Africa, Europe, Middle East: itinerary built around your request."),
    program: [l("Étude de la demande et proposition d'itinéraire", "Request review and itinerary proposal")],
    included: [l("Conception de l'itinéraire", "Itinerary design")],
    excluded: [l("Billets d'avion : non réservables en temps réel", "Flights: not bookable in real time"), l("Hébergement : non réservable en temps réel", "Accommodation: not bookable in real time"), l("Visas et assurances", "Visas and insurance")],
  },
]
