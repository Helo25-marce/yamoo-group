import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { galleryFrames, moveGallery } from "../gallery"
import type { DriveVehicle } from "../types"

type Props = {
  vehicle: DriveVehicle
}

export function VehicleGallery({ vehicle }: Props) {
  const { t } = useTranslation()
  const frames = galleryFrames(vehicle)
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState<Record<number, boolean>>({})
  const current = frames[index] ?? null
  const several = frames.length > 1
  const alt = t("drive.sheet.demoAlt", { name: vehicle.name })

  useEffect(() => {
    setIndex(0)
    setBroken({})
    setOpen(false)
  }, [vehicle.id])

  useEffect(() => {
    if (!open) return
    const root = document.getElementById("root")
    const previousOverflow = document.body.style.overflow
    root?.setAttribute("inert", "")
    document.body.style.overflow = "hidden"
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
      if (event.key === "ArrowRight") setIndex((value) => moveGallery(value, 1, frames.length))
      if (event.key === "ArrowLeft") setIndex((value) => moveGallery(value, -1, frames.length))
    }
    document.addEventListener("keydown", onKey)
    return () => {
      root?.removeAttribute("inert")
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [open, frames.length])

  function shift(delta: number) {
    setIndex((value) => moveGallery(value, delta, frames.length))
  }

  return (
    <section
      className="drive-gallery"
      aria-label={t("drive.sheet.gallery")}
      tabIndex={0}
      onKeyDown={(event) => {
        if (open) return
        if (event.key === "ArrowRight") {
          event.preventDefault()
          shift(1)
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          shift(-1)
        }
      }}
    >
      <div className="drive-gallery-main">
        {current && !broken[index] ? (
          <img
            src={current.src}
            alt={alt}
            style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
            onError={() => setBroken((value) => ({ ...value, [index]: true }))}
          />
        ) : (
          <p className="drive-gallery-fallback">{current ? t("drive.sheet.imageBroken") : t("drive.sheet.imageMissing")}</p>
        )}
      </div>
      <p className="drive-help mt-3">{t("drive.demoPhoto")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {several ? (
          <>
            <button type="button" className="drive-btn-secondary h-10 px-3" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t("drive.sheet.previous")}
            </button>
            <button type="button" className="drive-btn-secondary h-10 px-3" onClick={() => shift(1)}>
              {t("drive.sheet.next")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : null}
        {current && !broken[index] ? (
          <button type="button" className="drive-btn-secondary h-10 px-3" onClick={() => setOpen(true)}>
            {t("drive.sheet.enlarge")}
          </button>
        ) : null}
      </div>
      {several ? (
        <ul className="drive-gallery-thumbs" aria-label={t("drive.sheet.thumbs")}>
          {frames.map((frame, frameIndex) => (
            <li key={`${frame.src}-${frameIndex}`}>
              <button
                type="button"
                className={frameIndex === index ? "is-selected" : undefined}
                aria-current={frameIndex === index ? "true" : undefined}
                aria-label={t("drive.sheet.thumb", { index: frameIndex + 1 })}
                onClick={() => setIndex(frameIndex)}
              >
                <img src={frame.src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && current && !broken[index]
        ? createPortal(
            <div className="drive-lightbox" role="dialog" aria-modal="true" aria-label={t("drive.sheet.enlarge")}>
              <button type="button" className="drive-lightbox-close" onClick={() => setOpen(false)} autoFocus>
                <X className="h-4 w-4" aria-hidden="true" />
                {t("drive.sheet.close")}
              </button>
              <img src={current.src} alt={alt} />
              <p className="drive-lightbox-note">{t("drive.demoPhoto")}</p>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
