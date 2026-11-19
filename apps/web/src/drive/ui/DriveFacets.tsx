import { useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

export type FacetOption = {
  id: string
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}

type Props = {
  title: string
  options: FacetOption[]
  help?: ReactNode
  /** Rows shown before « Tout afficher ». */
  compact?: number
  searchable?: boolean
  searchLabel?: string
}

/** One filter family: title, checkboxes, live counters, optional show-all and search. */
export function FacetSection({ title, options, help, compact = 6, searchable = false, searchLabel }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [needle, setNeedle] = useState("")
  const listId = useId()
  if (options.length === 0) return null
  const filtered = needle.trim() ? options.filter((option) => option.label.toLowerCase().includes(needle.trim().toLowerCase())) : options
  const visible = open || needle.trim() || filtered.length <= compact ? filtered : filtered.slice(0, compact)
  return (
    <fieldset className="drive-facet">
      <legend>{title}</legend>
      {searchable && options.length > compact ? (
        <input
          type="search"
          className="drive-facet-search"
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={needle}
          onChange={(event) => setNeedle(event.target.value)}
        />
      ) : null}
      <div id={listId}>
        {visible.map((option) => (
          <label key={option.id} className={option.count === 0 && !option.checked ? "drive-facet-row is-empty" : "drive-facet-row"}>
            <input type="checkbox" checked={option.checked} disabled={option.count === 0 && !option.checked} onChange={option.onToggle} />
            <span>{option.label}</span>
            <span className="drive-facet-count">{option.count}</span>
          </label>
        ))}
      </div>
      {help ? <p className="drive-facet-help">{help}</p> : null}
      {!needle.trim() && filtered.length > compact ? (
        <button type="button" className="drive-text-link drive-facet-more" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((value) => !value)}>
          {open ? t("drive.f.showLess") : t("drive.f.showAll")}
        </button>
      ) : null}
    </fieldset>
  )
}

export function PendingFacets({ items }: { items: Array<{ key: string; title: string; reason: string }> }) {
  const { t } = useTranslation()
  if (items.length === 0) return null
  return (
    <details className="drive-facet drive-facet-pending">
      <summary>
        {t("drive.f.pendingTitle")} <span className="drive-facet-count">{items.length}</span>
      </summary>
      <p className="drive-facet-help">{t("drive.f.pendingLead")}</p>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            <strong>{item.title}</strong>
            <span> — {item.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
