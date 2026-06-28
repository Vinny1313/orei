// Cartão/painel base reutilizado por toda a ficha. Extraído do antigo App.tsx.

import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  icon: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, icon, className = '', children }: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <span>{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
