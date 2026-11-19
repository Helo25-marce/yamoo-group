import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "../../lib/cn"

type Variant = "primary" | "secondary" | "link"

type Props = {
  variant?: Variant
  children: ReactNode
  to?: string
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

const variantClass: Record<Variant, string> = {
  primary: "drive-btn-primary",
  secondary: "drive-btn-secondary",
  link: "drive-text-link",
}

/** Drive actions. Primary is night (readable), focus stays turquoise via global :focus-visible. */
export function DriveButton({ variant = "primary", children, to, className, type = "button", ...rest }: Props) {
  const classes = cn(variantClass[variant], className)
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
