import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import "leaflet/dist/leaflet.css"
import { PLACES, type Place } from "../places"

type Props = {
  selected: Place | null
  /** One catalogue place. Does not draw the rest of the country as a vehicle position. */
  compact?: boolean
}

export function PlaceMap({ selected, compact = false }: Props) {
  const { t } = useTranslation()
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    let cancelled = false
    let map: { remove: () => void } | null = null

    void import("leaflet").then((leaflet) => {
      if (cancelled || !nodeRef.current) return
      const L = leaflet.default
      const view = L.map(nodeRef.current, { scrollWheelZoom: false })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(view)
      const bounds = L.latLngBounds([])
      const places = compact && selected ? [selected] : PLACES
      for (const place of places) {
        const marker = L.circleMarker([place.lat, place.lng], {
          radius: selected?.id === place.id ? 8 : place.k === "airport" ? 5 : 3.5,
          color: place.k === "airport" ? "#087d8d" : "#07172d",
          weight: 1,
          fillColor: place.k === "airport" ? "#087d8d" : "#d9a441",
          fillOpacity: 0.9,
        })
        marker.bindPopup(`<strong>${place.n}</strong><br>${place.h}`)
        marker.addTo(view)
        bounds.extend([place.lat, place.lng])
        if (selected?.id === place.id) marker.openPopup()
      }
      if (selected) view.setView([selected.lat, selected.lng], compact ? 13 : 11)
      else if (bounds.isValid()) view.fitBounds(bounds.pad(0.08))
      map = view
      window.setTimeout(() => view.invalidateSize(), 0)
    })

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [selected, compact])

  return (
    <div className="drive-place-map-wrap">
      {compact ? null : <p className="drive-help">{t("drive.place.mapLead", { count: PLACES.length })}</p>}
      <div ref={nodeRef} className={compact ? "drive-place-map is-compact" : "drive-place-map"} role="region" aria-label={t("drive.place.map")} />
    </div>
  )
}
