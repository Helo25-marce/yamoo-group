import { asset } from "../lib/asset"

/** Licensed campaign stills are assigned here later. Empty values keep the designed frames. */
export const visuals: {
  hero?: string
  media?: string
  drive?: string
  travel?: string
  group?: string
} = {}

/** Provisional homepage photographs. They are labeled on the page and can be replaced. */
export const homeStills = {
  hero: asset("visuals/hero.jpg"),
  header: asset("visuals/header-dusk.jpg"),
  atmosphere: asset("visuals/home-atmosphere.jpg"),
  media: asset("visuals/media.jpg"),
  drive: asset("visuals/drive.jpg"),
  travel: asset("visuals/travel.jpg"),
  group: asset("visuals/group.jpg"),
} as const

/**
 * Founders — Madjouta Kenmoé Michella Ange Sagesse & Amadou Bilal Choub
 * Served only from apps/web/public/visuals/ (Vite public/).
 * Cache-bust query so browsers do not keep a previous crop under the same path.
 */
export const founderStills = {
  /** Principal — bleus + tablette */
  tabletBlue: `${asset("visuals/founders/tablet-blue.jpg")}?v=508fc1919c1f`,
  ceremonial: `${asset("visuals/founders/ceremonial.jpg")}?v=1a73f758cae7`,
  studio: `${asset("visuals/founders/studio.jpg")}?v=611eed5c1db4`,
  alliance: `${asset("visuals/founders/alliance.jpg")}?v=eb23ee45daf9`,
} as const
