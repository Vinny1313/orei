// Landing pública: brand "O Rei Mandou" + CTAs.
// Se o usuário já estiver logado (inclui modo visitante em dev), vai direto ao dashboard.

import { LogIn, ScrollText, Shield } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/agentes" replace />
  }

  return (
    <main className="landing">
      <div className="landing__inner">
        <p className="eyebrow">Ficha digital de RPG</p>
        <h1 className="landing__title">
          <Shield size={40} aria-hidden />
          O Rei Mandou
        </h1>
        <p className="landing__lead">
          Crie, gerencie e role os dados das suas fichas de personagem. Seu reino de aventureiros,
          sempre à mão.
        </p>
        <div className="landing__actions">
          <Link to="/login" className="roll-button">
            <LogIn size={18} aria-hidden />
            Entrar
          </Link>
          <Link to="/agentes" className="ghost-button">
            <ScrollText size={18} aria-hidden />
            Ver meus agentes
          </Link>
        </div>
      </div>
    </main>
  )
}
