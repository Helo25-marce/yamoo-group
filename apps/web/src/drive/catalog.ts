import { asset } from "../lib/asset"
import type { DriveVehicle } from "./types"

/** Fictional catalogue — demo rates only, not official YAMOO tariffs. */
/** Distinct demo crops — replace with HQ fleet photography when available. */
const fleet = {
  berline: asset("visuals/drive/vehicles/berline-executive.jpg"),
  suv: asset("visuals/drive/vehicles/suv-confort.jpg"),
  van: asset("visuals/drive/vehicles/van-familial.jpg"),
  prestige: asset("visuals/drive/vehicles/prestige-noir.jpg"),
  suvBusiness: asset("visuals/drive/vehicles/suv-affaires.jpg"),
} as const

export const DEMO_VEHICLES: DriveVehicle[] = [
  {
    id: "veh-berline-1",
    name: "Berline Executive",
    category: "berline",
    seats: 3,
    luggage: 2,
    imageSrc: fleet.berline,
    images: [{ src: fleet.berline, demo: true }],
    imageFocus: "50% 45%",
    available: true,
    dailyRateFcfa: 85_000,
    tripRateFcfa: 25_000,
    demo: true,
  },
  {
    id: "veh-suv-1",
    name: "SUV Confort",
    category: "suv",
    seats: 5,
    luggage: 4,
    imageSrc: fleet.suv,
    images: [{ src: fleet.suv, demo: true }],
    imageFocus: "48% 42%",
    available: true,
    dailyRateFcfa: 110_000,
    tripRateFcfa: 35_000,
    demo: true,
  },
  {
    id: "veh-van-1",
    name: "Van Familial",
    category: "van",
    seats: 7,
    luggage: 6,
    imageSrc: fleet.van,
    images: [{ src: fleet.van, demo: true }],
    imageFocus: "52% 55%",
    available: true,
    dailyRateFcfa: 130_000,
    tripRateFcfa: 45_000,
    demo: true,
  },
  {
    id: "veh-prestige-1",
    name: "Prestige Noir",
    category: "prestige",
    seats: 3,
    luggage: 2,
    imageSrc: fleet.prestige,
    images: [{ src: fleet.prestige, demo: true }],
    imageFocus: "50% 35%",
    available: true,
    dailyRateFcfa: 180_000,
    tripRateFcfa: 60_000,
    demo: true,
  },
  {
    id: "veh-suv-2",
    name: "SUV Affaires",
    category: "suv",
    seats: 4,
    luggage: 3,
    imageSrc: fleet.suvBusiness,
    images: [{ src: fleet.suvBusiness, demo: true }],
    imageFocus: "55% 48%",
    available: false,
    dailyRateFcfa: 125_000,
    tripRateFcfa: 40_000,
    demo: true,
  },
]

export const DEMO_CLIENT = {
  email: "demo.client@yamoo.demo",
  password: "demo",
  name: "Client Démo",
  role: "client" as const,
}

export const DEMO_ADMIN = {
  email: "demo.admin@yamoo.demo",
  password: "demo",
  name: "Admin Drive Démo",
  role: "admin" as const,
}
