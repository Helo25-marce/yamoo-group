import { ArrowLeft, Check, CircleHelp, Plus, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import {
  availableTopics,
  deterministicAssistant,
  quoteFor,
  recommend,
  type CompareAnswer,
  type CompareContext,
  type ComparePrefs,
  type CompareTopic,
  type Msg,
} from "../compare"
import { formatFcfa } from "../format"
import type { DriveVehicle } from "../types"

export const COMPARE_MAX = 3

function useTx() {
  const { t } = useTranslation()
  return (message: Msg) => {
    const values: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(message.values ?? {})) {
      values[key] = typeof value === "string" ? value.replace(/\$t\(([^)]+)\)/g, (_, nested: string) => t(nested)) : value
    }
    return t(message.key, values)
  }
}

function Thumb({ vehicle }: { vehicle: DriveVehicle }) {
  return (
    <img
      src={vehicle.imageSrc}
      alt=""
      width={96}
      height={56}
      loading="lazy"
      className="drive-sc-thumb"
      style={{ objectPosition: vehicle.imageFocus ?? "50% 50%" }}
      onError={(event) => {
        const img = event.currentTarget
        if (img.dataset.fallback === "1") return
        img.dataset.fallback = "1"
        img.src = "/images/drive/vehicles/pending.svg"
      }}
    />
  )
}

function VehicleTitle({ vehicle }: { vehicle: DriveVehicle }) {
  const brand = vehicle.brand?.trim()
  return (
    <span className="drive-sc-title">
      {brand ? <span className="drive-sc-brand">{brand}</span> : null}
      <span>{brand ? vehicle.model || vehicle.name : vehicle.name}</span>
    </span>
  )
}

function PriceLine({ vehicle, context }: { vehicle: DriveVehicle; context: CompareContext }) {
  const { t } = useTranslation()
  const quote = quoteFor(vehicle, context.criteria)
  return <span className="drive-sc-price">{quote === null ? t("drive.sc.noPrice") : t("drive.sc.priceTotal", { amount: formatFcfa(quote, context.locale) })}</span>
}

type BarProps = {
  vehicles: DriveVehicle[]
  context: CompareContext
  onRemove: (id: string) => void
  onOpen: () => void
  onClear: () => void
}

/** Fixed tray: up to three slots, removable items, opens the assistant from two vehicles. */
export function CompareBar({ vehicles, context, onRemove, onOpen, onClear }: BarProps) {
  const { t } = useTranslation()
  const free = Math.max(0, COMPARE_MAX - vehicles.length)
  return (
    <section className="drive-sc-bar" aria-label={t("drive.sc.bar")}>
      <div className="drive-sc-bar-inner">
        <p className="drive-sc-bar-label">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>{t("drive.sc.selected", { count: vehicles.length })}</span>
        </p>
        <ul className="drive-sc-slots">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="drive-sc-slot">
              <Thumb vehicle={vehicle} />
              <span className="drive-sc-slot-copy">
                <VehicleTitle vehicle={vehicle} />
                <PriceLine vehicle={vehicle} context={context} />
              </span>
              <button type="button" className="drive-sc-remove" aria-label={t("drive.sc.remove", { name: vehicle.name })} onClick={() => onRemove(vehicle.id)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
          {Array.from({ length: free }, (_, index) => (
            <li key={`free-${index}`} className="drive-sc-slot is-free" aria-label={t("drive.sc.slot")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t("drive.sc.slot")}</span>
            </li>
          ))}
        </ul>
        <div className="drive-sc-bar-actions">
          {vehicles.length > 0 ? (
            <button type="button" className="drive-sc-clear" onClick={onClear}>
              {t("drive.sc.clear")}
            </button>
          ) : null}
          <button type="button" className="drive-sc-cta" disabled={vehicles.length < 2} onClick={onOpen} aria-describedby={vehicles.length < 2 ? "drive-sc-need" : undefined}>
            {t("drive.sc.compareBtn")}
          </button>
          {vehicles.length < 2 ? (
            <span id="drive-sc-need" className="sr-only">
              {t("drive.sc.needTwo")}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
}

type Entry = { id: number; topic: CompareTopic } | { id: number; topic: "personal"; prefs: ComparePrefs | null }

type PanelProps = {
  vehicles: DriveVehicle[]
  context: CompareContext
  sheetHref: (vehicle: DriveVehicle) => string
  onBook: (vehicle: DriveVehicle) => void
  onClose: () => void
}

/** Right-hand assistant (full screen on mobile). Answers are recomputed from the current selection. */
export function ComparePanel({ vehicles, context, sheetHref, onBook, onClose }: PanelProps) {
  const { t } = useTranslation()
  const tx = useTx()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const counter = useRef(0)
  const closeLatest = useRef(onClose)
  closeLatest.current = onClose

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        closeLatest.current()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, [tabindex='0']")].filter(
        (node) => node.offsetParent !== null,
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [entries.length])

  function ask(topic: CompareTopic | "personal") {
    counter.current += 1
    const id = counter.current
    setEntries((list) => [...list, topic === "personal" ? { id, topic, prefs: null } : { id, topic }])
  }

  const topics = availableTopics(vehicles)
  const columns = { gridTemplateColumns: `minmax(6.5rem, 0.9fr) repeat(${vehicles.length}, minmax(0, 1fr))` }

  return (
    <div className="drive-sc-layer">
      <button type="button" className="drive-sc-overlay" aria-label={t("drive.sc.close")} tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="drive-sc-panel" role="dialog" aria-modal="true" aria-labelledby="drive-sc-name">
        <header className="drive-sc-head">
          <button type="button" className="drive-sc-back" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("drive.sc.back")}
          </button>
          <div className="drive-sc-brandline">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <h2 id="drive-sc-name">{t("drive.sc.name")}</h2>
          </div>
          <button ref={closeRef} type="button" className="drive-sc-close" aria-label={t("drive.sc.close")} onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <ul className="drive-sc-cars" style={{ gridTemplateColumns: `repeat(${vehicles.length}, minmax(0, 1fr))` }}>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="drive-sc-car">
              <Thumb vehicle={vehicle} />
              <VehicleTitle vehicle={vehicle} />
              <PriceLine vehicle={vehicle} context={context} />
              <Link to={sheetHref(vehicle)} className="drive-text-link">
                {t("drive.sc.viewOffer")}
              </Link>
              <button type="button" className="drive-sc-book" disabled={!vehicle.available} onClick={() => onBook(vehicle)}>
                {context.criteria ? t("drive.sc.book") : t("drive.sc.bookNeedsDates")}
              </button>
            </li>
          ))}
        </ul>

        <div className="drive-sc-thread" aria-live="polite">
          <p className="drive-sc-engine">{t("drive.sc.engine")}</p>
          <div className="drive-sc-msg is-assistant">
            <p>{t("drive.sc.welcome")}</p>
          </div>

          {entries.map((entry) => (
            <div key={entry.id} className="drive-sc-turn">
              <p className="drive-sc-msg is-user">
                <span className="sr-only">{t("drive.sc.you")} : </span>
                {t(`drive.sc.q.${entry.topic}`)}
              </p>
              {entry.topic === "personal" ? (
                <Personal
                  vehicles={vehicles}
                  context={context}
                  prefs={entry.prefs}
                  onSubmit={(prefs) => setEntries((list) => list.map((item) => (item.id === entry.id ? { ...item, prefs } : item)))}
                />
              ) : (
                <AnswerCard answer={deterministicAssistant.answer(entry.topic, vehicles, context) as CompareAnswer} vehicles={vehicles} columns={columns} />
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <nav className="drive-sc-questions" aria-label={t("drive.sc.questions")}>
          <p>{entries.length > 0 ? t("drive.sc.askAnother") : t("drive.sc.questions")}</p>
          <div className="drive-sc-chips">
            {[...topics, "personal" as const].map((topic) => (
              <button key={topic} type="button" className="drive-sc-chip" onClick={() => ask(topic)}>
                {topic === "personal" ? <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {t(`drive.sc.q.${topic}`)}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )

  function AnswerCard({ answer, vehicles, columns }: { answer: CompareAnswer; vehicles: DriveVehicle[]; columns: { gridTemplateColumns: string } }) {
    return (
      <div className="drive-sc-msg is-assistant">
        <div className="drive-sc-grid" role="table" aria-label={t(`drive.sc.q.${answer.topic}`)}>
          <div className="drive-sc-row is-head" role="row" style={columns}>
            <span role="columnheader" />
            {vehicles.map((vehicle) => (
              <span key={vehicle.id} role="columnheader">
                {vehicle.name}
              </span>
            ))}
          </div>
          {answer.rows.map((row) => {
            const texts = row.cells.map((cell) => (cell ? tx(cell) : null))
            const differs = new Set(texts).size > 1
            return (
              <div key={row.label.key} className={differs ? "drive-sc-row is-diff" : "drive-sc-row"} role="row" style={columns}>
                <span role="rowheader">{tx(row.label)}</span>
                {texts.map((text, index) => (
                  <span key={vehicles[index].id} role="cell" className={text ? undefined : "is-missing"}>
                    {text ?? t("drive.sc.notPublished")}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        {answer.insights.length > 0 ? (
          <ul className="drive-sc-insights">
            {answer.insights.map((insight, index) => (
              <li key={`${insight.key}-${index}`}>{tx(insight)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }
}

function Personal({
  vehicles,
  context,
  prefs,
  onSubmit,
}: {
  vehicles: DriveVehicle[]
  context: CompareContext
  prefs: ComparePrefs | null
  onSubmit: (prefs: ComparePrefs) => void
}) {
  const { t } = useTranslation()
  const tx = useTx()
  const [draft, setDraft] = useState({
    travellers: context.criteria ? String(context.criteria.passengers) : "",
    bags: context.criteria ? String(context.criteria.luggage) : "",
    budget: "",
    days: "",
    transmission: "" as ComparePrefs["transmission"],
    priority: "price" as ComparePrefs["priority"],
  })
  const number = (value: string, max: number) => {
    if (!/^\d+$/.test(value.trim())) return null
    const parsed = Number(value)
    return parsed > 0 && parsed <= max ? parsed : null
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      travellers: number(draft.travellers, 20),
      bags: number(draft.bags, 20),
      budgetFcfa: number(draft.budget, 100_000_000),
      days: number(draft.days, 90),
      transmission: draft.transmission,
      priority: draft.priority,
    })
  }

  const result = prefs ? recommend(vehicles, prefs, context) : null
  return (
    <div className="drive-sc-msg is-assistant">
      <form className="drive-sc-form" onSubmit={submit}>
        <p className="drive-sc-form-title">{t("drive.sc.pref.title")}</p>
        <label>
          {t("drive.sc.pref.travellers")}
          <input inputMode="numeric" value={draft.travellers} onChange={(event) => setDraft({ ...draft, travellers: event.target.value })} />
        </label>
        <label>
          {t("drive.sc.pref.bags")}
          <input inputMode="numeric" value={draft.bags} onChange={(event) => setDraft({ ...draft, bags: event.target.value })} />
        </label>
        <label>
          {t("drive.sc.pref.budget")}
          <input inputMode="numeric" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} />
        </label>
        <label>
          {t("drive.sc.pref.days")}
          <input inputMode="numeric" value={draft.days} onChange={(event) => setDraft({ ...draft, days: event.target.value })} />
        </label>
        <label>
          {t("drive.sc.pref.transmission")}
          <select value={draft.transmission} onChange={(event) => setDraft({ ...draft, transmission: event.target.value as ComparePrefs["transmission"] })}>
            <option value="">{t("drive.sc.pref.any")}</option>
            <option value="automatic">{t("drive.f.opt.transmission.automatic")}</option>
            <option value="manual">{t("drive.f.opt.transmission.manual")}</option>
          </select>
        </label>
        <label>
          {t("drive.sc.pref.priority")}
          <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as ComparePrefs["priority"] })}>
            <option value="price">{t("drive.sc.pref.price")}</option>
            <option value="comfort">{t("drive.sc.pref.comfort")}</option>
            <option value="capacity">{t("drive.sc.pref.capacity")}</option>
          </select>
        </label>
        <button type="submit" className="drive-sc-cta">
          {t("drive.sc.pref.submit")}
        </button>
      </form>
      {result ? (
        <div className="drive-sc-rec">
          <p className="drive-sc-winner">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("drive.sc.pref.winner", { names: result.winners.map((vehicle) => vehicle.name).join(", ") })}
          </p>
          <ul className="drive-sc-insights">
            {result.reasons.map((reason, index) => (
              <li key={`${reason.key}-${index}`}>{tx(reason)}</li>
            ))}
          </ul>
          {result.checks.map((check) => (
            <div key={check.vehicle.id} className="drive-sc-check">
              <p>{check.vehicle.name}</p>
              <ul>
                {check.items.map((item, index) => (
                  <li key={index} className={`is-${item.status}`}>
                    <span className="drive-sc-status">{t(`drive.sc.chk.${item.status}`)}</span> {tx(item.label)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
