import type { FormEvent } from "react"
import { useState } from "react"
import { Search } from "lucide-react"
import { useNavigate } from "react-router"
import { localePath, useLocale } from "../../lib/locale"
import { Button } from "./Button"

type SearchFieldProps = {
  label: string
  placeholder: string
  submitLabel: string
  className?: string
  id?: string
  autoFocus?: boolean
}

export function SearchField({ label, placeholder, submitLabel, className, id = "search", autoFocus = false }: SearchFieldProps) {
  const navigate = useNavigate()
  const locale = useLocale()
  const [value, setValue] = useState("")

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()
    const path = localePath(locale, "/recherche")
    navigate(query ? `${path}?q=${encodeURIComponent(query)}` : path)
  }

  return (
    <form role="search" onSubmit={onSubmit} className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex h-12 items-center gap-2 rounded-full border border-ivory/15 bg-night-elevated pr-1.5 pl-4">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
        <input
          id={id}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ivory outline-none placeholder:text-muted/80"
        />
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
