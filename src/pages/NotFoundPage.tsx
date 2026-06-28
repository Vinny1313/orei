// Página 404 amigável.

import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="landing">
      <div className="landing__inner">
        <p className="eyebrow">Erro 404</p>
        <h1 className="landing__title">
          <Compass size={40} aria-hidden />
          Caminho perdido
        </h1>
        <p className="landing__lead">
          Nem o melhor cartógrafo do reino encontrou esta página. Talvez ela nunca tenha existido.
        </p>
        <div className="landing__actions">
          <Link to="/" className="roll-button">
            Voltar ao início
          </Link>
          <Link to="/agentes" className="ghost-button">
            Ir para meus agentes
          </Link>
        </div>
      </div>
    </main>
  )
}
