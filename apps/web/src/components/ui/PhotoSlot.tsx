import { cn } from "../../lib/cn"

type PhotoSlotProps = {
  caption: string
  hint: string
  tone?: "media" | "drive" | "travel" | "night"
  imageSrc?: string
  imageAlt?: string
  className?: string
}

export function PhotoSlot({
  caption,
  hint,
  tone = "night",
  imageSrc,
  imageAlt = "",
  className,
}: PhotoSlotProps) {
  return (
    <figure className={cn("photo-slot min-h-64", className)} data-tone={tone}>
      {imageSrc ? (
        <img src={imageSrc} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <figcaption className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-night via-night/80 to-transparent px-6 pt-16 pb-5">
        <span className="font-display text-sm tracking-[0.16em] text-gold uppercase">{caption}</span>
        <span className="max-w-sm text-sm text-muted">{hint}</span>
      </figcaption>
    </figure>
  )
}
