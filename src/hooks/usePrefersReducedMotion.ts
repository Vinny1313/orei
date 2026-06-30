// Detecta a preferência do sistema por menos movimento (prefers-reduced-motion).
// Substitui o useReducedMotion do framer-motion para que a landing não dependa
// dessa lib. Reage a mudanças em runtime (ex.: usuário altera a preferência).

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setReduced(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}
