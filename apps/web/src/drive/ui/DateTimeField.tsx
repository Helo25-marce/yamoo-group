import { useEffect, useId, useRef, useState } from "react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { useLocale } from "../../lib/locale"

type Props = {
  dateLabel: string
  value: string
  onChange: (value: string) => void
}

function parts(value: string) {
  const [date = "", time = ""] = value.split("T")
  return { date, time: time.slice(0, 5) }
}

function join(date: string, time: string) {
  if (!date) return ""
  return `${date}T${time || "10:00"}`
}

function openPicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget
  if (typeof input.showPicker !== "function") return
  try {
    input.showPicker()
  } catch {
    input.focus()
  }
}

function monthGrid(cursor: Date) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= days; day += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    cells.push(iso)
  }
  return cells
}

export function DateTimeField({ dateLabel, value, onChange }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { date, time } = parts(value)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => (date ? new Date(`${date}T12:00:00`) : new Date()))
  const rootRef = useRef<HTMLDivElement>(null)
  const calendarId = useId()
  const tag = locale === "fr" ? "fr-FR" : "en-GB"
  const shown = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" })
    : t("drive.field.datePlaceholder")

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="drive-when" ref={rootRef}>
      <div className="drive-field">
        <span>{dateLabel}</span>
        <button
          type="button"
          className="drive-date-button"
          aria-expanded={open}
          aria-controls={calendarId}
          aria-label={dateLabel}
          onClick={() => {
            if (date) setCursor(new Date(`${date}T12:00:00`))
            setOpen((current) => !current)
          }}
        >
          {shown}
        </button>
        {open ? (
          <div className="drive-calendar" id={calendarId} role="dialog" aria-label={dateLabel}>
            <div className="drive-calendar-nav">
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                {t("drive.field.prevMonth")}
              </button>
              <strong>{cursor.toLocaleDateString(tag, { month: "long", year: "numeric" })}</strong>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                {t("drive.field.nextMonth")}
              </button>
            </div>
            <div className="drive-calendar-grid" role="grid">
              {Array.from({ length: 7 }, (_, index) => (
                <span key={`weekday-${index}`} className="drive-calendar-weekday">
                  {new Date(2024, 0, index + 1).toLocaleDateString(tag, { weekday: "narrow" })}
                </span>
              ))}
              {monthGrid(cursor).map((iso, index) =>
                iso ? (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    className={iso === date ? "is-selected" : undefined}
                    onClick={() => {
                      onChange(join(iso, time))
                      setOpen(false)
                    }}
                  >
                    {Number(iso.slice(-2))}
                  </button>
                ) : (
                  <span key={`empty-${index}`} />
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
      <label className="drive-field">
        {t("drive.field.time")}
        <input type="time" value={time} onClick={openPicker} onChange={(event) => onChange(join(date, event.target.value))} />
      </label>
    </div>
  )
}
