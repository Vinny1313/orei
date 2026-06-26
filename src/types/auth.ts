// Tipos de domínio da autenticação.
//
// Modelo de usuário/sessão da app, desacoplado do shape do Supabase: o authService
// adapta `@supabase/supabase-js` para estes tipos, então a UI nunca importa o SDK direto.

/** Usuário autenticado (ou visitante sintético no modo guest). */
export type AuthUser = {
  id: string
  email: string
  /** Apelido único (vem de user_metadata.username; profile real chega na Fase 3). */
  username?: string
  /** Nome de exibição (user_metadata.display_name ou full_name do provedor OAuth). */
  displayName?: string
  /** URL do avatar (user_metadata.avatar_url, típico de login Google). */
  avatarUrl?: string
}

/** Sessão ativa: usuário + token. `expiresAt` em epoch (segundos), quando conhecido. */
export type AuthSession = {
  user: AuthUser
  accessToken: string
  expiresAt?: number
}

/** Credenciais de login por e-mail/senha. */
export type SignInCredentials = {
  email: string
  password: string
}

/** Dados de cadastro. `username`/`displayName` vão em options.data p/ o trigger da Fase 3. */
export type SignUpCredentials = {
  email: string
  password: string
  username: string
  displayName?: string
}

/** Resultado padrão de uma operação de auth: erro amigável em `error` (ou null em sucesso). */
export type AuthResult = {
  error: string | null
}
