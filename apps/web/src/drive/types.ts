export type DriveServiceKind = "chauffeur_daily" | "chauffeur_now" | "chauffeur_later"

export type DriveBookingStatus = "pending" | "confirmed" | "refused" | "cancelled" | "completed"

export type DriveVehicleCategory = "berline" | "suv" | "van" | "prestige" | "pickup"

export type DriveImageStatus = "verified" | "pending"

export type DriveRole = "client" | "admin" | null

export type DriveVehicleImage = {
  src: string
  /** True while the file is a shared demonstration still, not a distinct fleet photo. */
  demo: true
}

/** Optional facts. A sheet renders only keys that are filled in. Do not invent values. */
export type DriveVehicleFacts = {
  transmission?: string
  fuel?: string
  airConditioning?: string
  mileagePolicy?: string
  insurance?: string
  deposit?: string
  cancellation?: string
  modification?: string
}

export type DriveTransmission = "automatic" | "manual"
export type DriveFuel = "electric" | "hybrid" | "plugin_hybrid" | "petrol" | "diesel"
/** Extensible equipment list. Add ids here and in drive.f.feature.* translations. */
export type DriveFeature = "air_conditioning" | "four_plus_doors"
export type DrivePickupMode = "airport_terminal" | "airport_shuttle" | "city_agency" | "delivery"
export type DrivePaymentTiming = "now" | "pickup"
export type DrivePaymentMethod = "mtn_momo" | "orange_money" | "card"
export type DriveFuelPolicy = "same_level" | "full_to_full" | "other"
export type DriveExtraId = "additional_driver" | "baby_seat" | "booster_seat" | "child_seat" | "gps" | (string & {})

/** Vehicle facts. Unknown stays undefined: never default a fuel or a gearbox. */
export type DriveVehicleSpecs = {
  transmission?: DriveTransmission
  fuel?: DriveFuel
  features?: DriveFeature[]
  /** Demonstration value, consistent with the listed model, to be confirmed by the provider. */
  demo: true
}

/**
 * Self-drive offer conditions. Each block requires provider or contractual validation.
 * A missing block means the topic is not published, not that it is free or included.
 */
export type DriveSelfDriveOffer = {
  dailyRateFcfa?: number
  pickupModes?: DrivePickupMode[]
  mileage?: { kind: "limited"; includedKmPerDay: number; extraKmFcfa?: number } | { kind: "unlimited"; rule: string }
  extras?: Array<{ id: DriveExtraId; label?: string; priceFcfa?: number; per?: "day" | "rental"; onQuote?: boolean }>
  promotion?: { referenceDailyFcfa: number; discountedDailyFcfa: number; validFrom: string; validTo: string; conditions: string }
  insurance?: { coverage: string; amountFcfa?: number; excessFcfa?: number; exclusions: string[]; conditions: string }
  paymentTimings?: DrivePaymentTiming[]
  paymentMethods?: DrivePaymentMethod[]
  depositFcfa?: number
  fuelPolicy?: { kind: DriveFuelPolicy; details?: string }
  cancellation?: string
  /** Stays false until the provider confirms the conditions. */
  validated: boolean
}

/** Verified customer reviews only. Never seeded. */
export type DriveRating = { score10: number; count: number; verified: true }

export type DriveVehicle = {
  id: string
  name: string
  category: DriveVehicleCategory
  seats: number
  luggage: number
  imageSrc: string
  /** Optional gallery. Demo entries must stay marked demo. */
  images?: DriveVehicleImage[]
  /** Optional later facts. Empty means the sheet shows nothing for that topic. */
  facts?: DriveVehicleFacts
  specs?: DriveVehicleSpecs
  selfDrive?: DriveSelfDriveOffer
  rating?: DriveRating
  /** Optional object-position for framing the shared demo still. */
  imageFocus?: string
  brand?: string
  model?: string
  /** verified = licensed photo checked against the model. pending = neutral placeholder. */
  imageStatus?: DriveImageStatus
  /** Rental company that publishes this vehicle. Empty means YAMOO Drive. */
  partnerId?: string
  providerIds?: string[]
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
  extras?: Array<{ id: string; qty: number; amountFcfa: number }>
  protection?: "basic" | "full"
  promoCode?: string
  discountFcfa?: number
  payNowFcfa?: number
  payPickupFcfa?: number
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

export type DrivePartner = {
  id: string
  name: string
  city: string
  phone: string
  description?: string
  /** demo until YAMOO confirms a real partner. No logo unless a file is authorised. */
  verificationStatus?: "demo" | "confirmed"
  demo?: true
  active: boolean
}

export type DrivePromo = {
  code: string
  kind: "percent" | "amount"
  value: number
  active: boolean
}

export type DriveStoreState = {
  version: 1
  vehicles: DriveVehicle[]
  bookings: DriveBooking[]
  notifications: DriveNotification[]
  session: DriveSession | null
  partners: DrivePartner[]
  promos: DrivePromo[]
}

export type PriceInput = {
  service: DriveServiceKind
  vehicle: Pick<DriveVehicle, "dailyRateFcfa" | "tripRateFcfa">
  startAt: Date
  endAt: Date
}
