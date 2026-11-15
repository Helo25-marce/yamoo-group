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
  hero: "/visuals/hero.jpg",
  header: "/visuals/header-dusk.jpg",
  atmosphere: "/visuals/home-atmosphere.jpg",
  media: "/visuals/media.jpg",
  drive: "/visuals/drive.jpg",
  travel: "/visuals/travel.jpg",
  group: "/visuals/group.jpg",
} as const

/** Founders — Madjouta Kenmoé Michella Ange Sagesse & Amadou Bilal Choub */
export const founderStills = {
  /** Principal — chemises bleu/blanc, tablette (source: image-2a91e674…) */
  tabletBlue: "/visuals/founders/tablet-blue.jpg",
  ceremonial: "/visuals/founders/ceremonial.jpg",
  studio: "/visuals/founders/studio.jpg",
  alliance: "/visuals/founders/alliance.jpg",
} as const
