// Landing publica: brand "O Rei Mandou" + CTAs.
// Se o usuario ja estiver logado (inclui modo visitante em dev), vai direto ao dashboard.

import { Navigate } from 'react-router-dom'
import { HeroBackground } from '../components/landing/HeroBackground'
import { HeroContent } from '../components/landing/HeroContent'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/agentes" replace />
  }

  return (
    <main className="landing">
      <HeroBackground />
      <HeroContent />
    </main>
  )
}
