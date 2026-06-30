// Cabeçalho padrão das páginas internas: eyebrow + título + ação opcional.
// Consolida o markup repetido de `.page-header` em várias telas.

import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, eyebrow, action, className = '' }: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  )
}
