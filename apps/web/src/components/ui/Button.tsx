import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "../../lib/cn"

const variants = {
  gold: "yamoo-btn-gold",
  ghost: "yamoo-btn-ghost",
  link: "inline-flex h-auto items-center gap-2 rounded-none bg-transparent px-0 text-sm font-semibold text-gold transition duration-200 hover:text-gold-hover",
}

const sizes = {
  md: "",
  sm: "h-9 px-3.5 text-xs",
}

type Props = {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
  children: ReactNode
  to?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

export function Button({ variant = "gold", size = "md", className, children, to, ...rest }: Props) {
  const classes = cn(
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    variant !== "link" && size === "sm" ? sizes.sm : null,
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
