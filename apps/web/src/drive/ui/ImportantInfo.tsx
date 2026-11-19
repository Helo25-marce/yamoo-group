import { useEffect, useId, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent } from "react"
import { Clock, IdCard, Info, Luggage, MapPinned, Pencil, Receipt, Route, Wallet, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const sections = [
  { key: "documents", icon: IdCard },
  { key: "meeting", icon: MapPinned },
  { key: "waiting", icon: Clock },
  { key: "luggage", icon: Luggage },
  { key: "stops", icon: Route },
  { key: "zone", icon: MapPinned },
  { key: "changes", icon: Pencil },
  { key: "cancellation", icon: Receipt },
  { key: "payment", icon: Wallet },
] as const

function focusable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")].filter(
    (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
  )
}

export function ImportantInfo({ icon = false }: { icon?: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const nodes = dialogRef.current ? focusable(dialogRef.current) : []
      nodes[0]?.focus()
      return
    }
    if (wasOpen.current) {
      wasOpen.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  function onDialogKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation()
      setOpen(false)
      return
    }
    if (event.key !== "Tab" || !dialogRef.current) return
    const nodes = focusable(dialogRef.current)
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={icon ? "drive-text-link drive-info-trigger" : "drive-text-link"} onClick={() => setOpen(true)}>
        {icon ? <Info className="drive-offer-icon is-small" strokeWidth={1.85} aria-hidden="true" /> : null}
        {t("drive.important.open")}
      </button>
      {open ? (
        <div className="drive-modal-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className="drive-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={onDialogKey}
          >
            <header className="drive-modal-head">
              <h2 id={titleId}>{t("drive.important.title")}</h2>
              <button type="button" className="drive-modal-close" aria-label={t("drive.important.close")} onClick={() => setOpen(false)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="drive-modal-body">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <section key={section.key} className="drive-info-row">
                    <Icon className="drive-info-icon" aria-hidden="true" />
                    <div>
                      <h3>{t(`drive.important.${section.key}`)}</h3>
                      <p>{t(`drive.important.${section.key}Body`)}</p>
                    </div>
                  </section>
                )
              })}
              <details className="drive-info-terms">
                <summary>{t("drive.important.termsTitle")}</summary>
                <p>{t("drive.important.terms")}</p>
              </details>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
