// Provider de autenticação: mantém { user, session, loading, isGuest } e as ações.
//
// Inicializa com getSession() e assina onAuthStateChange — assim login, logout,
// refresh de token e EXPIRAÇÃO de sessão atualizam o estado automaticamente
// (sessão expirada chega como session null → user vira null).

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getSession,
  isGuestMode,
  onAuthStateChange,
  signInWithGoogle as serviceSignInWithGoogle,
  signInWithPassword,
  signOut as serviceSignOut,
  signUp as serviceSignUp,
} from '../services/authService'
import type { AuthSession, SignInCredentials, SignUpCredentials } from '../types/auth'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // 1) Resolve a sessão inicial (guest fixo, real via SDK, disabled = null).
    getSession()
      .then((initial) => {
        if (active) setSession(initial)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // 2) Mantém a sessão sincronizada com eventos de auth enquanto montado.
    const subscription = onAuthStateChange((next) => {
      if (active) setSession(next)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const next = await getSession()
    setSession(next)
  }, [])

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      const result = await signInWithPassword(credentials)
      if (!result.error) await refreshSession()
      return result
    },
    [refreshSession],
  )
  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      const result = await serviceSignUp(credentials)
      if (!result.error) await refreshSession()
      return result
    },
    [refreshSession],
  )
  const signInWithGoogle = useCallback(async () => {
    const result = await serviceSignInWithGoogle()
    if (!result.error && isGuestMode) await refreshSession()
    return result
  }, [refreshSession])

  const signOut = useCallback(async () => {
    const result = await serviceSignOut()
    // No modo visitante não há sessão de rede para limpar, mas garantimos consistência.
    if (isGuestMode) setSession(null)
    return result
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isGuest: isGuestMode,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signIn, signUp, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
