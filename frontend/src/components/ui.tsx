import type { ButtonHTMLAttributes, ReactNode } from 'react'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
}

export function Button({ variant = 'primary', icon, className, children, ...props }: ButtonProps) {
  return (
    <button className={cx('button', `button--${variant}`, className)} {...props}>
      {icon && <span className="button__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

type BadgeProps = {
  children: ReactNode
  tone?: 'accent' | 'neutral' | 'success' | 'warning' | 'danger'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return <span className={cx('badge', `badge--${tone}`, className)}>{children}</span>
}
