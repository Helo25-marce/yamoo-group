export const CONTACT_EMAIL = "heloisemarcellinepelagiekackka@gmail.com"

export function formatFcfa(amount: number, locale: "fr" | "en" = "fr"): string {
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount)
  return `${formatted} FCFA`
}

export function makeReference(now = new Date()): string {
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `YD-${y}${m}${d}-${rand}`
}

export function whatsappDriveLink(booking: {
  reference: string
  vehicleName: string
  startAt: string
  priceFcfa: number
  clientName: string
}): string {
  const text = [
    `Bonjour YAMOO DRIVE,`,
    `Réservation démo ${booking.reference}`,
    `Véhicule : ${booking.vehicleName}`,
    `Début : ${booking.startAt}`,
    `Montant indicatif : ${formatFcfa(booking.priceFcfa)}`,
    `Client : ${booking.clientName}`,
    `(Données de démonstration — non contractuel)`,
  ].join("\n")
  return `https://wa.me/33746546362?text=${encodeURIComponent(text)}`
}
