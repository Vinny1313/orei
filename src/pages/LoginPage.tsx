// Página de login — formulário real (Supabase Auth) plugado na Fase 2.

import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <p className="eyebrow">O Rei Mandou</p>
        <h1>Entrar</h1>
        <p className="muted-text">Acesse seu reino de aventureiros.</p>
        <LoginForm />
        <Link to="/" className="text-link">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
