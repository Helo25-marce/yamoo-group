import { DEMO_VEHICLES } from "./catalog"
import { makeReference } from "./format"
import { calculateDrivePrice } from "./pricing"
import { canTransition } from "./status"
import { vehicleHeld } from "./checkout"
import type {
  DriveBooking,
  DriveBookingStatus,
  DriveNotification,
  DrivePartner,
  DrivePromo,
  DriveServiceKind,
  DriveSession,
  DriveStoreState,
  DriveVehicle,
  DriveVehicleCategory,
} from "./types"

const STORAGE_KEY = "yamoo.drive.v1"

/** Stable snapshot for useSyncExternalStore — must be referentially equal until a write. */
let cached: DriveStoreState | null = null

const SEED_PARTNERS: DrivePartner[] = [
  { id: "yamoo", name: "YAMOO Drive", city: "Douala", phone: "+237 600 000 000", description: "Offres de démonstration publiées par YAMOO.", verificationStatus: "demo", demo: true, active: true },
  { id: "co-wouri", name: "Wouri Mobilité", city: "Douala", phone: "+237 600 000 001", description: "Entreprise fictive de démonstration. Pas un partenaire confirmé.", verificationStatus: "demo", demo: true, active: true },
  { id: "co-nsimalen", name: "Nsimalen Chauffeurs", city: "Yaoundé", phone: "+237 600 000 002", description: "Entreprise fictive de démonstration. Pas un partenaire confirmé.", verificationStatus: "demo", demo: true, active: true },
  { id: "co-mfoundi", name: "Mfoundi Prestige", city: "Yaoundé", phone: "+237 600 000 003", description: "Entreprise fictive de démonstration. Pas un partenaire confirmé.", verificationStatus: "demo", demo: true, active: true },
  { id: "co-bonaberi", name: "Bonabéri Fleet", city: "Douala", phone: "+237 600 000 004", description: "Entreprise fictive de démonstration. Pas un partenaire confirmé.", verificationStatus: "demo", demo: true, active: true },
  { id: "co-sanaga", name: "Sanaga Routes", city: "Edéa", phone: "+237 600 000 005", description: "Entreprise fictive de démonstration. Pas un partenaire confirmé.", verificationStatus: "demo", demo: true, active: true },
]

const SEED_PROMOS: DrivePromo[] = [
  { code: "YAMOO10", kind: "percent", value: 10, active: true },
  { code: "DRIVE5000", kind: "amount", value: 5_000, active: true },
]

function seed(): DriveStoreState {
  return {
    version: 1,
    vehicles: structuredClone(DEMO_VEHICLES),
    bookings: [],
    notifications: [],
    session: null,
    partners: structuredClone(SEED_PARTNERS),
    promos: structuredClone(SEED_PROMOS),
  }
}

function mergePartners(stored: DrivePartner[] | undefined): DrivePartner[] {
  const previous = Array.isArray(stored) ? stored : []
  const byId = new Map(previous.filter((partner) => partner?.id).map((partner) => [partner.id, partner]))
  const seeded = SEED_PARTNERS.map((partner) => ({ ...partner, ...byId.get(partner.id), id: partner.id, demo: true as const }))
  const known = new Set(SEED_PARTNERS.map((partner) => partner.id))
  const custom = previous.filter((partner) => partner?.id && !known.has(partner.id))
  return [...seeded, ...custom]
}
const LEGACY_NAMES = new Set([
  "Berline Executive",
  "SUV Confort",
  "Van Familial",
  "Prestige Noir",
  "SUV Affaires",
  "Mercedes-Benz Classe V",
  "Range Rover",
])

// Seed values of the previous catalogue: stored values equal to these were never edited, so the new seed replaces them.
const PREVIOUS_SEED: Record<string, [string, number, number]> = {
  "veh-berline-1": ["Toyota Corolla", 85000, 25000],
  "veh-camry-1": ["Toyota Camry", 95000, 30000],
  "veh-k5-1": ["Kia K5", 105000, 32000],
  "veh-sonata": ["Hyundai Sonata", 98000, 30000],
  "veh-elantra": ["Hyundai Elantra", 90000, 28000],
  "veh-accord": ["Honda Accord", 112000, 34000],
  "veh-civic": ["Honda Civic", 88000, 27000],
  "veh-508": ["Peugeot 508", 108000, 33000],
  "veh-passat": ["Volkswagen Passat", 118000, 36000],
  "veh-altima": ["Nissan Altima", 102000, 31000],
  "veh-suv-1": ["Toyota RAV4", 110000, 35000],
  "veh-prado-1": ["Toyota Land Cruiser Prado", 140000, 42000],
  "veh-fortuner": ["Toyota Fortuner", 135000, 40000],
  "veh-santafe-1": ["Hyundai Santa Fe", 120000, 38000],
  "veh-tucson": ["Hyundai Tucson", 115000, 35000],
  "veh-sportage": ["Kia Sportage", 116000, 35000],
  "veh-sorento": ["Kia Sorento", 128000, 39000],
  "veh-3008": ["Peugeot 3008", 122000, 37000],
  "veh-5008": ["Peugeot 5008", 132000, 40000],
  "veh-xtrail": ["Nissan X-Trail", 126000, 38000],
  "veh-suv-2": ["Nissan Patrol", 125000, 40000],
  "veh-pajero": ["Mitsubishi Pajero Sport", 138000, 41000],
  "veh-everest": ["Ford Everest", 142000, 43000],
  "veh-tiguan": ["Volkswagen Tiguan", 124000, 37000],
  "veh-cherokee": ["Jeep Grand Cherokee", 148000, 45000],
  "veh-prestige-1": ["Mercedes-Benz S-Class", 180000, 60000],
  "veh-eclass": ["Mercedes-Benz E-Class", 165000, 52000],
  "veh-cclass": ["Mercedes-Benz C-Class", 145000, 44000],
  "veh-serie7-1": ["BMW Série 7", 170000, 55000],
  "veh-serie5": ["BMW Série 5", 155000, 48000],
  "veh-x5": ["BMW X5", 168000, 52000],
  "veh-a8": ["Audi A8", 172000, 54000],
  "veh-q7": ["Audi Q7", 162000, 50000],
  "veh-lx": ["Lexus LX 600", 175000, 56000],
  "veh-rangerover-1": ["Range Rover Autobiography", 150000, 48000],
  "veh-classev-1": ["Mercedes-Benz V-Class", 160000, 50000],
  "veh-vito": ["Mercedes-Benz Vito", 125000, 38000],
  "veh-van-1": ["Toyota Alphard", 130000, 45000],
  "veh-hiace-1": ["Toyota Hiace", 115000, 36000],
  "veh-staria": ["Hyundai Staria", 128000, 39000],
  "veh-carnival": ["Kia Carnival", 135000, 41000],
  "veh-multivan": ["Volkswagen Multivan", 148000, 45000],
  "veh-tourneo": ["Ford Tourneo Custom", 122000, 37000],
  "veh-trafic": ["Renault Trafic", 98000, 30000],
  "veh-traveller": ["Peugeot Traveller", 118000, 36000],
  "veh-hilux": ["Toyota Hilux", 110000, 34000],
  "veh-ranger": ["Ford Ranger", 112000, 34000],
  "veh-l200": ["Mitsubishi L200", 108000, 33000],
  "veh-navara": ["Nissan Navara", 109000, 33000],
  "veh-dmax": ["Isuzu D-Max", 107000, 32000],
}

function mergeVehicles(stored: DriveVehicle[]): DriveVehicle[] {
  const byId = new Map(stored.map((vehicle) => [vehicle.id, vehicle]))
  const seeded = DEMO_VEHICLES.map((seedVehicle) => {
    const previous = byId.get(seedVehicle.id)
    if (!previous) return structuredClone(seedVehicle)
    const [oldName, oldDaily, oldTrip] = PREVIOUS_SEED[seedVehicle.id] ?? []
    const keepName = previous.name && !LEGACY_NAMES.has(previous.name) && previous.name !== oldName
    const seedRates = previous.dailyRateFcfa === oldDaily && previous.tripRateFcfa === oldTrip
    return {
      ...seedVehicle,
      available: previous.available,
      dailyRateFcfa: seedRates ? seedVehicle.dailyRateFcfa : previous.dailyRateFcfa,
      tripRateFcfa: seedRates ? seedVehicle.tripRateFcfa : previous.tripRateFcfa,
      name: keepName ? previous.name : seedVehicle.name,
      demo: true as const,
    }
  })
  const known = new Set(DEMO_VEHICLES.map((vehicle) => vehicle.id))
  const custom = stored
    .filter((vehicle) => vehicle?.id && !known.has(vehicle.id) && vehicle.name)
    .map((vehicle) => ({ ...vehicle, demo: true as const }))
  return [...seeded, ...custom]
}

function loadFromStorage(): DriveStoreState {
  if (typeof localStorage === "undefined") return seed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as DriveStoreState
    if (parsed.version !== 1 || !Array.isArray(parsed.vehicles)) return seed()
    return {
      ...parsed,
      vehicles: mergeVehicles(parsed.vehicles),
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      session: parsed.session ?? null,
      partners: mergePartners(parsed.partners),
      promos: Array.isArray(parsed.promos) && parsed.promos.length > 0 ? parsed.promos : structuredClone(SEED_PROMOS),
    }
  } catch {
    return seed()
  }
}

function read(): DriveStoreState {
  if (!cached) cached = loadFromStorage()
  return cached
}

function write(state: DriveStoreState) {
  // Always a new reference so useSyncExternalStore detects the change.
  cached = {
    version: state.version,
    vehicles: state.vehicles,
    bookings: state.bookings,
    notifications: state.notifications,
    session: state.session,
    partners: state.partners ?? structuredClone(SEED_PARTNERS),
    promos: state.promos ?? structuredClone(SEED_PROMOS),
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yamoo-drive-store"))
  }
}

export function getDriveState(): DriveStoreState {
  return read()
}

export function subscribeDriveStore(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cached = loadFromStorage()
    listener()
  }
  const onCustom = () => listener()
  window.addEventListener("storage", onStorage)
  window.addEventListener("yamoo-drive-store", onCustom)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener("yamoo-drive-store", onCustom)
  }
}

export function setDriveSession(session: DriveSession | null) {
  const state = read()
  write({ ...state, session })
}

export function listVehicles(): DriveVehicle[] {
  return read().vehicles
}

export function addVehicle(input: {
  name: string
  category: DriveVehicleCategory
  seats: number
  luggage: number
  dailyRateFcfa: number
  tripRateFcfa: number
  partnerId: string
  imageSrc: string
}): DriveVehicle {
  const state = read()
  const vehicle: DriveVehicle = {
    id: `veh-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    category: input.category,
    seats: input.seats,
    luggage: input.luggage,
    imageSrc: input.imageSrc,
    images: [{ src: input.imageSrc, demo: true }],
    available: true,
    dailyRateFcfa: input.dailyRateFcfa,
    tripRateFcfa: input.tripRateFcfa,
    partnerId: input.partnerId,
    demo: true,
  }
  write({ ...state, vehicles: [...state.vehicles, vehicle] })
  return vehicle
}

export function addPartner(input: { name: string; city: string; phone: string }): DrivePartner {
  const state = read()
  const partner: DrivePartner = {
    id: `co-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    city: input.city.trim(),
    phone: input.phone.trim(),
    active: true,
  }
  write({ ...state, partners: [...state.partners, partner] })
  return partner
}

export function savePromo(promo: DrivePromo) {
  const state = read()
  const code = promo.code.trim().toUpperCase()
  const next = { ...promo, code }
  const exists = state.promos.some((item) => item.code.toUpperCase() === code)
  write({
    ...state,
    promos: exists ? state.promos.map((item) => (item.code.toUpperCase() === code ? next : item)) : [...state.promos, next],
  })
}

export function updateVehicle(id: string, patch: Partial<Pick<DriveVehicle, "available" | "dailyRateFcfa" | "tripRateFcfa" | "name">>) {
  const state = read()
  const vehicles = state.vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...patch, demo: true as const } : vehicle))
  write({ ...state, vehicles })
  return vehicles.find((vehicle) => vehicle.id === id) ?? null
}

export type CreateBookingInput = {
  service: DriveServiceKind
  vehicleId: string
  startAt: string
  endAt: string
  pickup: string
  dropoff: string
  clientName: string
  clientPhone: string
  clientEmail: string
  priceFcfa?: number
  extras?: DriveBooking["extras"]
  protection?: DriveBooking["protection"]
  promoCode?: string
  discountFcfa?: number
  payNowFcfa?: number
  payPickupFcfa?: number
}

export function createBooking(input: CreateBookingInput): DriveBooking {
  const state = read()
  const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle || !vehicle.available) throw new Error("VEHICLE_UNAVAILABLE")
  if (vehicleHeld(vehicle.id, input.startAt, input.endAt, state.bookings)) throw new Error("VEHICLE_HELD")

  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new Error("INVALID_DATES")
  }

  const priced = calculateDrivePrice({
    service: input.service,
    vehicle,
    startAt: start,
    endAt: end,
  })

  const now = new Date().toISOString()
  const booking: DriveBooking = {
    id: crypto.randomUUID(),
    reference: makeReference(new Date(now)),
    status: "pending",
    service: input.service,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    durationDays: priced.days,
    pickup: input.pickup.trim(),
    dropoff: input.dropoff.trim(),
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    priceFcfa: input.priceFcfa ?? priced.priceFcfa,
    currency: "FCFA",
    extras: input.extras,
    protection: input.protection,
    promoCode: input.promoCode,
    discountFcfa: input.discountFcfa,
    payNowFcfa: input.payNowFcfa,
    payPickupFcfa: input.payPickupFcfa,
    demo: true,
    createdAt: now,
    updatedAt: now,
  }

  write({
    ...state,
    bookings: [booking, ...state.bookings],
    notifications: [
      {
        id: crypto.randomUUID(),
        bookingId: booking.id,
        messageKey: "drive.notify.created",
        createdAt: now,
        read: false,
      },
      ...state.notifications,
    ],
  })
  return booking
}

export function listBookings(filter?: { email?: string; status?: DriveBookingStatus }): DriveBooking[] {
  let bookings = read().bookings
  if (filter?.email) {
    const email = filter.email.toLowerCase()
    bookings = bookings.filter((booking) => booking.clientEmail === email)
  }
  if (filter?.status) bookings = bookings.filter((booking) => booking.status === filter.status)
  return bookings
}

export function getBooking(id: string): DriveBooking | null {
  return read().bookings.find((booking) => booking.id === id) ?? null
}

export function transitionBooking(
  id: string,
  to: DriveBookingStatus,
  role: "client" | "admin",
  refuseReason?: string,
): DriveBooking {
  const state = read()
  const index = state.bookings.findIndex((booking) => booking.id === id)
  if (index < 0) throw new Error("NOT_FOUND")
  const current = state.bookings[index]
  if (!canTransition(current.status, to, role)) throw new Error("INVALID_TRANSITION")
  if (to === "refused" && !refuseReason?.trim()) throw new Error("REASON_REQUIRED")

  const now = new Date().toISOString()
  const updated: DriveBooking = {
    ...current,
    status: to,
    refuseReason: to === "refused" ? refuseReason?.trim() : current.refuseReason,
    updatedAt: now,
  }
  const bookings = state.bookings.slice()
  bookings[index] = updated
  write({
    ...state,
    bookings,
    notifications: [
      {
        id: crypto.randomUUID(),
        bookingId: updated.id,
        messageKey: `drive.notify.${to}`,
        createdAt: now,
        read: false,
      },
      ...state.notifications,
    ],
  })
  return updated
}

export function listNotifications(email?: string): DriveNotification[] {
  const state = read()
  if (!email) return state.notifications
  const ids = new Set(state.bookings.filter((booking) => booking.clientEmail === email.toLowerCase()).map((booking) => booking.id))
  return state.notifications.filter((item) => ids.has(item.bookingId))
}

export function markNotificationsRead(email: string) {
  const state = read()
  const ids = new Set(state.bookings.filter((booking) => booking.clientEmail === email.toLowerCase()).map((booking) => booking.id))
  write({
    ...state,
    notifications: state.notifications.map((item) => (ids.has(item.bookingId) ? { ...item, read: true } : item)),
  })
}

export function resetDriveDemoData() {
  write(seed())
}
