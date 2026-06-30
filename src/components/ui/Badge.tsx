// Badge/chip reutilizável (status de campanha, classe de personagem, tags).
// O tom mapeia para as cores semânticas definidas nos tokens (Etapa 1).

import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: '',
  gold: 'badge--gold',
  success: 'badge--success',
  warning: 'badge--warning',
  danger: 'badge--danger',
}

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return <span className={`badge ${TONE_CLASS[tone]} ${className}`.trim()}>{children}</span>
}
