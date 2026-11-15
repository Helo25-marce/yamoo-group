import { cn } from "../../lib/cn"

type BrandPlateProps = {
  src: string
  label: string
  className?: string
  featured?: boolean
}

export function BrandPlate({ src, label, className, featured = false }: BrandPlateProps) {
  return (
    <div className={cn("brand-plate", featured && "brand-plate-featured", className)}>
      <img src={src} alt={label} />
    </div>
  )
}
