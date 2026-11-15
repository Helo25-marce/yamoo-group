export type DriveServiceKind = "chauffeur_daily" | "chauffeur_now" | "chauffeur_later"

export type DriveBookingStatus = "pending" | "confirmed" | "refused" | "cancelled" | "completed"

export type DriveVehicleCategory = "berline" | "suv" | "van" | "prestige"

export type DriveRole = "client" | "admin" | null

export type DriveVehicle = {
  id: string
  name: string
  category: DriveVehicleCategory
  seats: number
  luggage: number
  imageSrc: string
  /** Optional object-position for framing the shared demo still. */
  imageFocus?: string
  available: boolean
  /** Demo daily rate in FCFA (with chauffeur included in catalogue rules). */
  dailyRateFcfa: number
  /** Demo trip rate in FCFA for immediate / scheduled short trips. */
  tripRateFcfa: number
  demo: true
}

export type DriveBooking = {
  id: string
  reference: string
  status: DriveBookingStatus
  service: DriveServiceKind
  vehicleId: string
  vehicleName: string
  startAt: string
  endAt: string
  durationDays: number
  pickup: string
  dropoff: string
  clientName: string
  clientPhone: string
  clientEmail: string
  priceFcfa: number
  currency: "FCFA"
  demo: true
  refuseReason?: string
  createdAt: string
  updatedAt: string
}

export type DriveNotification = {
  id: string
  bookingId: string
  messageKey: string
  createdAt: string
  read: boolean
}

export type DriveSession = {
  role: Exclude<DriveRole, null>
  email: string
  name: string
  demo: true
}

export type DriveStoreState = {
  version: 1
  vehicles: DriveVehicle[]
  bookings: DriveBooking[]
  notifications: DriveNotification[]
  session: DriveSession | null
}

export type PriceInput = {
  service: DriveServiceKind
  vehicle: Pick<DriveVehicle, "dailyRateFcfa" | "tripRateFcfa">
  startAt: Date
  endAt: Date
}
