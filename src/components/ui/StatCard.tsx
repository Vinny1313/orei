// Card de resumo (estatística): ícone + valor em destaque + rótulo.
// Reutilizado no perfil e no dashboard.

import type { ReactNode } from 'react'

type StatCardProps = {
  icon: ReactNode
  value: ReactNode
  label: ReactNode
  hint?: ReactNode
}

export function StatCard({ icon, value, label, hint }: StatCardProps) {
  return (
    <div className="stat-card panel">
      <span className="stat-card__icon">{icon}</span>
      <div className="stat-card__body">
        <strong className="stat-card__value">{value}</strong>
        <span className="stat-card__label">{label}</span>
        {hint && <small className="stat-card__hint">{hint}</small>}
      </div>
    </div>
  )
}
