// Guarda de rotas privadas (/agentes*, /campanhas*, /perfil).
//
// Enforcement real (Fase 2): enquanto a sessão resolve, mostra loader; sem usuário,
// manda para /login guardando a origem (state.from) para voltar depois do login.
// Aceita `children?` mas cai para <Outlet/> — não quebra a árvore de routes.tsx.

import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from './FullPageLoader'

type ProtectedRouteProps = {
  children?: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullPageLoader label="Verificando sua sessão…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children ?? <Outlet />}</>
}
