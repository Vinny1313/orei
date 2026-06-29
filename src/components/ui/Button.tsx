// Botão reutilizável. Renderiza um <button> nativo ou, quando recebe `to`,
// um <Link> do react-router — sem perder a aparência (mapeia as classes do
// design system já existentes). Puramente apresentacional.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'google'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'roll-button',
  ghost: 'ghost-button',
  danger: 'ghost-button danger',
  google: 'google-button',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  /** Quando definido, renderiza um <Link> do react-router em vez de <button>. */
  to?: string
  /** state opcional repassado ao <Link> (ex.: redirect de origem). */
  linkState?: unknown
  /** Desabilita e sinaliza carregamento (apenas no modo <button>). */
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  to,
  linkState,
  loading = false,
  className = '',
  children,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  const classes = `${VARIANT_CLASS[variant]} ${className}`.trim()

  if (to !== undefined) {
    return (
      <Link to={to} state={linkState} className={classes} title={rest.title}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type ?? 'button'} className={classes} disabled={disabled || loading} {...rest}>
      {children}
    </button>
  )
}
