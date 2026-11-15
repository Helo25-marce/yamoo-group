import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router"

type UniverseCardProps = {
  href: string
  title: string
  text: string
  action: string
  imageSrc: string
  icon: LucideIcon
}

export function UniverseCard({ href, title, text, action, imageSrc, icon: Icon }: UniverseCardProps) {
  return (
    <article className="group min-w-0">
      <Link to={href} className="yamoo-card relative block transition duration-200 hover:border-[rgb(228_169_63/0.7)]">
        <img
          src={imageSrc}
          alt=""
          className="aspect-[5/3] w-full object-cover motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 left-3 grid h-7 w-7 place-items-center rounded-full bg-night/55 text-gold">
          <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000b18] via-[#000b18]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h2 className="font-display text-[1.2rem] tracking-wide text-ivory">{title}</h2>
          <p className="mt-1 max-w-[14rem] text-[0.75rem] leading-snug text-ivory/85">{text}</p>
          <span className="yamoo-discover">
            {action}
            <span className="yamoo-discover-arrow" aria-hidden="true">
              <ArrowRight strokeWidth={2.1} />
            </span>
          </span>
        </div>
      </Link>
    </article>
  )
}
