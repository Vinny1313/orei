// Menu superior das páginas privadas: brand + navegação + usuário + botão Sair.
// Mostra um badge de "modo visitante" quando a auth está desativada (dev sem Supabase).

import { LogOut, ScrollText, Shield, ShieldAlert, Swords, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link active' : 'nav-link'

export function Navbar() {
  const { user, isGuest, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.displayName ?? user?.username ?? user?.email ?? 'Visitante'

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="navbar">
      <Link to="/agentes" className="brand">
        <Shield size={20} aria-hidden />
        <span>O Rei Mandou</span>
      </Link>

      {isGuest && (
        <span className="guest-badge" title="Autenticação desativada: Supabase não configurado (dev).">
          <ShieldAlert size={14} aria-hidden />
          Modo visitante
        </span>
      )}

      <nav className="nav-links">
        <NavLink to="/agentes" className={navLinkClass}>
          <ScrollText size={16} aria-hidden />
          Agentes
        </NavLink>
        <NavLink to="/campanhas" className={navLinkClass}>
          <Swords size={16} aria-hidden />
          Campanhas
        </NavLink>
        <NavLink to="/perfil" className={navLinkClass}>
          <UserRound size={16} aria-hidden />
          Perfil
        </NavLink>
      </nav>

      <span className="navbar-user" title={user?.email ?? undefined}>
        <UserRound size={16} aria-hidden />
        {displayName}
      </span>

      <button type="button" className="ghost-button" onClick={handleLogout}>
        <LogOut size={16} aria-hidden />
        Sair
      </button>
    </header>
  )
}
