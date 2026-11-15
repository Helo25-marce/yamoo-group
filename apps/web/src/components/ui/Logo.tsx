import { Link } from "react-router"

export function Logo({ to, label, className }: { to: string; label: string; className?: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center rounded-sm" aria-label={label}>
      <img src={`${import.meta.env.BASE_URL}brand/group-lockup.png`} alt="" className={className ?? "h-11 w-auto"} />
    </Link>
  )
}
