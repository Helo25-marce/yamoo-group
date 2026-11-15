import { DEMO_VEHICLES } from "./catalog"
import { makeReference } from "./format"
import { calculateDrivePrice } from "./pricing"
import { canTransition } from "./status"
import type {
  DriveBooking,
  DriveBookingStatus,
  DriveNotification,
  DriveServiceKind,
  DriveSession,
  DriveStoreState,
  DriveVehicle,
} from "./types"

const STORAGE_KEY = "yamoo.drive.v1"

/** Stable snapshot for useSyncExternalStore — must be referentially equal until a write. */
let cached: DriveStoreState | null = null

function seed(): DriveStoreState {
  return {
    version: 1,
    vehicles: structuredClone(DEMO_VEHICLES),
    bookings: [],
    notifications: [],
    session: null,
  }
}

/** Keep demo rates/availability from storage; refresh media from catalogue seed. */
function mergeVehicles(stored: DriveVehicle[]): DriveVehicle[] {
  const byId = new Map(stored.map((vehicle) => [vehicle.id, vehicle]))
  return DEMO_VEHICLES.map((seedVehicle) => {
    const previous = byId.get(seedVehicle.id)
    if (!previous) return structuredClone(seedVehicle)
    return {
      ...seedVehicle,
      available: previous.available,
      dailyRateFcfa: previous.dailyRateFcfa,
      tripRateFcfa: previous.tripRateFcfa,
      name: previous.name || seedVehicle.name,
      demo: true as const,
    }
  })
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
}

export function createBooking(input: CreateBookingInput): DriveBooking {
  const state = read()
  const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle || !vehicle.available) throw new Error("VEHICLE_UNAVAILABLE")

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
    priceFcfa: priced.priceFcfa,
    currency: "FCFA",
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
