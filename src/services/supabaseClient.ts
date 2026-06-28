// Cliente Supabase — ponto único de detecção e criação.
//
// DEGRADAÇÃO GRACIOSA (decisão de arquitetura): o app precisa rodar com OU sem chaves.
//  - `isSupabaseConfigured` diz se as env vars estão presentes E parecem válidas.
//  - `supabase` é o client real quando configurado, ou `null` quando não.
//
// O import NUNCA quebra na ausência das chaves: quem consome (authService) trata o null.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** Valida superficialmente que a URL é uma URL http(s) — evita tratar lixo como "configurado". */
const isValidUrl = (value: string | undefined): value is string => {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Verdadeiro só quando AMBAS as chaves estão presentes e a URL é válida.
 * Os guards, o authService e a UI derivam todo o comportamento daqui.
 */
export const isSupabaseConfigured: boolean = isValidUrl(url) && !!anonKey

/**
 * Client único da aplicação. `null` quando não configurado — nesse caso o authService
 * opera em modo mock (guest em dev) ou bloqueia (produção), sem nunca tocar a rede.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
