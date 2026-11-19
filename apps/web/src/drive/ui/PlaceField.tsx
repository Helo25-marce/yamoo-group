import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { searchPlaces, type Place, type PlaceKind } from "../places"

const ORDER: PlaceKind[] = ["airport", "city", "place", "commune"]

type Props = {
  label: string
  value: string
  placeholder?: string
  className?: string
  onChange: (value: string) => void
}

export function PlaceField({ label, value, placeholder, className, onChange }: Props) {
  const { t } = useTranslation()
  const listId = useId()
  const rootRef = useRef<HTMLLabelElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const results = useMemo(() => searchPlaces(open ? value : ""), [open, value])

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [])

  function choose(place: Place) {
    onChange(place.n)
    setOpen(false)
  }

  const groups = ORDER.map((kind) => ({ kind, items: results.filter((place) => place.k === kind) })).filter((group) => group.items.length)

  return (
    <label className={className ? `drive-field drive-place ${className}` : "drive-field drive-place"} ref={rootRef}>
      {label}
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true)
          setActive(0)
        }}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setOpen(true)
            return
          }
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActive((index) => Math.max(index - 1, 0))
          } else if (event.key === "Enter" && open && results[active]) {
            event.preventDefault()
            choose(results[active])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
      />
      {open ? (
        <div id={listId} role="listbox" className="drive-place-list">
          {results.length === 0 ? <p className="drive-place-empty">{t("drive.place.empty")}</p> : null}
          {groups.map((group) => (
            <div key={group.kind}>
              <p className="drive-place-group">{t(`drive.place.kind.${group.kind}`)}</p>
              {group.items.map((place) => {
                const index = results.indexOf(place)
                return (
                  <button
                    key={place.id}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={index === active ? "drive-place-option is-active" : "drive-place-option"}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      choose(place)
                    }}
                    onMouseEnter={() => setActive(index)}
                  >
                    <strong>{place.n}</strong>
                    <span>{place.h}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}
    </label>
  )
}
