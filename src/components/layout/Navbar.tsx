// Menu superior das páginas privadas: brand + navegação + usuário + botão Sair.
// Mostra um badge de "modo visitante" quando a auth está desativada (dev sem Supabase).
// No mobile, a navegação/usuário ficam atrás de um menu hambúrguer.

import { LogOut, Menu, ScrollText, Shield, ShieldAlert, Swords, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link active' : 'nav-link'

export function Navbar() {
  const { user, isGuest, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.displayName ?? user?.username ?? user?.email ?? 'Visitante'

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = async () => {
    closeMenu()
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="navbar">
      <Link to="/agentes" className="brand" onClick={closeMenu}>
        <Shield size={20} aria-hidden />
        <span>O Rei Mandou</span>
      </Link>

      {isGuest && (
        <span
          className="guest-badge"
          title="Autenticação desativada: Supabase não configurado (dev)."
        >
          <ShieldAlert size={14} aria-hidden />
          Modo visitante
        </span>
      )}

      <button
        type="button"
        className="navbar-toggle"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>

      <div className={menuOpen ? 'navbar-collapse open' : 'navbar-collapse'}>
        <nav className="nav-links">
          <NavLink to="/agentes" className={navLinkClass} onClick={closeMenu}>
            <ScrollText size={16} aria-hidden />
            Agentes
          </NavLink>
          <NavLink to="/campanhas" className={navLinkClass} onClick={closeMenu}>
            <Swords size={16} aria-hidden />
            Campanhas
          </NavLink>
          <NavLink to="/perfil" className={navLinkClass} onClick={closeMenu}>
            <UserRound size={16} aria-hidden />
            Perfil
          </NavLink>
        </nav>

        <div className="navbar-account">
          <Link
            to="/perfil"
            className="navbar-user"
            title={user?.email ?? undefined}
            onClick={closeMenu}
          >
            <Avatar name={displayName} src={user?.avatarUrl} size={28} />
            {displayName}
          </Link>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
