// Página de cadastro — formulário real (Supabase Auth) plugado na Fase 2.

import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'

export function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <p className="eyebrow">O Rei Mandou</p>
        <h1>Criar conta</h1>
        <p className="muted-text">Forje seu aventureiro e junte-se à mesa.</p>
        <RegisterForm />
        <Link to="/" className="text-link">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
