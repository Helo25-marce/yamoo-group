import type { ReactNode } from "react"
import { BrandPlate } from "../ui/BrandPlate"
import { PhotoSlot } from "../ui/PhotoSlot"

type UniverseShellProps = {
  eyebrow: string
  title: string
  lead: string
  caption: string
  hint: string
  tone: "media" | "drive" | "travel"
  mark: string
  markLabel: string
  imageSrc?: string
  children: ReactNode
}

export function UniverseShell({
  eyebrow,
  title,
  lead,
  caption,
  hint,
  tone,
  mark,
  markLabel,
  imageSrc,
  children,
}: UniverseShellProps) {
  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs tracking-[0.28em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ivory sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">{lead}</p>
      {imageSrc ? (
        <PhotoSlot caption={caption} hint={hint} tone={tone} imageSrc={imageSrc} className="mt-10 min-h-[28rem]" />
      ) : (
        <BrandPlate src={mark} label={markLabel} featured className="mt-10" />
      )}
      <div className="mt-12">{children}</div>
    </article>
  )
}
