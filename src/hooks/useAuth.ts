// Hook de consumo do contexto de autenticação.
// Erro explícito se usado fora do <AuthProvider> — pega bugs de árvore cedo.

import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/authContextValue'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>.')
  }
  return context
}
