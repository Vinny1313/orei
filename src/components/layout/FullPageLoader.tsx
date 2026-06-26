// Loader de página inteira, exibido enquanto a sessão inicial é resolvida.

import { Loader2 } from 'lucide-react'

export function FullPageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="full-page-loader" role="status" aria-live="polite">
      <Loader2 className="spin" size={28} aria-hidden />
      <span>{label}</span>
    </div>
  )
}
