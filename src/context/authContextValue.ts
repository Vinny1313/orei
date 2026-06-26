// Contexto de autenticação (apenas o objeto de contexto + seu tipo).
//
// Mantido SEPARADO do provider (AuthContext.tsx) e do hook (useAuth.ts) para que cada
// arquivo exporte uma só "categoria" — assim o Fast Refresh e a regra
// react/only-export-components ficam felizes. (Nome distinto de AuthContext.tsx para
// evitar colisão de casing em filesystems case-insensitive, como Windows.)

import { createContext } from 'react'
import type {
  AuthResult,
  AuthSession,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth'

export type AuthContextValue = {
  /** Usuário atual (sintético no modo visitante) ou null se deslogado. */
  user: AuthUser | null
  /** Sessão atual ou null. */
  session: AuthSession | null
  /** True enquanto a sessão inicial está sendo resolvida. */
  loading: boolean
  /** True quando rodando em modo visitante (dev sem Supabase). */
  isGuest: boolean
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
