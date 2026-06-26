// Serviço de autenticação — única fronteira entre a app e o Supabase Auth.
//
// A UI (context/hooks/telas) fala SOMENTE com este módulo; ninguém mais importa o SDK.
// Aqui mora a DEGRADAÇÃO GRACIOSA decidida pelo Rei:
//
//   modo 'real'     → Supabase configurado: auth de verdade, enforcement total.
//   modo 'guest'    → DEV sem chaves: usuário sintético "Visitante", nada vai à rede.
//   modo 'disabled' → PROD sem chaves: deslogado; toda ação devolve erro claro.
//
// Assim a auth fica completa AGORA e "liga sozinha" quando as chaves chegarem.

import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import type {
  AuthResult,
  AuthSession,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth'

type AuthMode = 'real' | 'guest' | 'disabled'

/** Modo efetivo, derivado da configuração e do ambiente. */
export const authMode: AuthMode = isSupabaseConfigured
  ? 'real'
  : import.meta.env.DEV
    ? 'guest'
    : 'disabled'

/** Atalho usado por context/UI para mostrar o banner de "modo visitante". */
export const isGuestMode = authMode === 'guest'

/** Usuário sintético do modo visitante (dev sem Supabase). */
export const GUEST_USER: AuthUser = {
  id: 'guest',
  email: 'visitante@local',
  username: 'visitante',
  displayName: 'Visitante',
}

const GUEST_SESSION: AuthSession = {
  user: GUEST_USER,
  accessToken: 'guest-token',
}

/** Mensagem padrão quando alguém tenta autenticar sem Supabase em produção. */
const NOT_CONFIGURED_MESSAGE =
  'Autenticação indisponível: o Supabase não está configurado neste ambiente.'

/** Tipo do callback de mudança de auth exposto à app. */
export type AuthChangeHandler = (session: AuthSession | null) => void

/** Assinatura cancelável devolvida por onAuthStateChange (igual nos três modos). */
export type AuthSubscription = { unsubscribe: () => void }

const noopSubscription: AuthSubscription = { unsubscribe: () => {} }

// ── Adaptadores Supabase → tipos da app ────────────────────────────────────

/** Converte o User do SDK no AuthUser da app, lendo o user_metadata. */
const mapUser = (user: User): AuthUser => {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    username: typeof meta.username === 'string' ? meta.username : undefined,
    displayName:
      (typeof meta.display_name === 'string' && meta.display_name) ||
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      undefined,
    avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
  }
}

/** Converte a Session do SDK na AuthSession da app (ou null). */
const mapSession = (session: Session | null): AuthSession | null => {
  if (!session?.user) return null
  return {
    user: mapUser(session.user),
    accessToken: session.access_token,
    expiresAt: session.expires_at,
  }
}

/** Normaliza qualquer erro desconhecido numa mensagem amigável. */
const toMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return fallback
}

// ── Operações de auth ──────────────────────────────────────────────────────

/**
 * Cadastro por e-mail/senha. `username`/`display_name` vão em `options.data`
 * para que o trigger de profile da Fase 3 (Dom Escriba) os leia no insert.
 */
export const signUp = async (credentials: SignUpCredentials): Promise<AuthResult> => {
  if (authMode === 'guest') return { error: null }
  if (!supabase) return { error: NOT_CONFIGURED_MESSAGE }

  const { error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      // TODO(supabase-db): o trigger handle_new_user (Fase 3) lê estes campos de
      // raw_user_meta_data para popular a tabela `profiles`. Não criar a tabela aqui.
      data: {
        username: credentials.username,
        display_name: credentials.displayName ?? credentials.username,
      },
    },
  })

  return { error: error ? toMessage(error, 'Não foi possível criar a conta.') : null }
}

/** Login por e-mail/senha. */
export const signInWithPassword = async (
  credentials: SignInCredentials,
): Promise<AuthResult> => {
  if (authMode === 'guest') return { error: null }
  if (!supabase) return { error: NOT_CONFIGURED_MESSAGE }

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  return { error: error ? toMessage(error, 'E-mail ou senha inválidos.') : null }
}

/**
 * Login com Google via OAuth (redireciona o browser para o provedor e volta).
 * NÃO usa a API do Gmail — é OAuth puro do Supabase.
 */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  if (authMode === 'guest') return { error: null }
  if (!supabase) return { error: NOT_CONFIGURED_MESSAGE }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Volta para a app após o consentimento; /agentes é a área logada inicial.
      redirectTo: `${window.location.origin}/agentes`,
    },
  })

  return { error: error ? toMessage(error, 'Falha ao entrar com o Google.') : null }
}

/** Encerra a sessão. No guest é no-op (o "logout" real é tratado no context). */
export const signOut = async (): Promise<AuthResult> => {
  if (authMode === 'guest') return { error: null }
  if (!supabase) return { error: null }

  const { error } = await supabase.auth.signOut()
  return { error: error ? toMessage(error, 'Não foi possível sair.') : null }
}

/** Sessão atual: guest fixo, real busca no SDK, disabled é sempre null. */
export const getSession = async (): Promise<AuthSession | null> => {
  if (authMode === 'guest') return GUEST_SESSION
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  return mapSession(data.session)
}

/**
 * Assina mudanças de sessão (login, logout, refresh, expiração).
 * - guest/disabled: emite o estado uma vez e devolve uma assinatura no-op.
 * - real: encaminha cada evento do SDK já adaptado para AuthSession.
 */
export const onAuthStateChange = (handler: AuthChangeHandler): AuthSubscription => {
  if (authMode === 'guest') {
    handler(GUEST_SESSION)
    return noopSubscription
  }
  if (!supabase) {
    handler(null)
    return noopSubscription
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    // Sessão expirada/SIGNED_OUT chega como session null → a app limpa o usuário.
    handler(mapSession(session))
  })

  return { unsubscribe: () => subscription.unsubscribe() }
}
