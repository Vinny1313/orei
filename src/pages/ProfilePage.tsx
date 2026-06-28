// Página de perfil — STUB da Fase 1.
// TODO(auth): Cérbero liga os dados do perfil ao usuário autenticado na Fase 2.

import { UserRound } from 'lucide-react'

export function ProfilePage() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Perfil</h1>
      </header>
      <div className="empty-state large">
        <UserRound size={28} aria-hidden />
        <p>Seu perfil de aventureiro aparece aqui após a autenticação.</p>
        <small>Disponível na fase de contas e login.</small>
      </div>
    </main>
  )
}
