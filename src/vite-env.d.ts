/// <reference types="vite/client" />

// Tipagem das variáveis de ambiente customizadas (prefixo VITE_, expostas ao client).
// Opcionais de propósito: o app degrada graciosamente quando ausentes (modo visitante em dev).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
