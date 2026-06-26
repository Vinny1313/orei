// Guarda de rotas públicas de autenticação (/login, /cadastro).
//
// Se o usuário JÁ está logado, redireciona para /agentes (evita ver login logado).
// Enquanto a sessão resolve, mostra loader. Aceita `children?` com fallback <Outlet/>.

import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from './FullPageLoader'

type PublicRouteProps = {
  children?: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <FullPageLoader />
  }

  if (user) {
    return <Navigate to="/agentes" replace />
  }

  return <>{children ?? <Outlet />}</>
}
