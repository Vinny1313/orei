// Estado vazio/erro reutilizável: ícone + título + descrição + ação opcional.
// Consolida o markup repetido de `.empty-state large`.

import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: ReactNode
  icon?: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, icon, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state large ${className}`.trim()}>
      {icon}
      <p>{title}</p>
      {description && <small>{description}</small>}
      {action}
    </div>
  )
}
