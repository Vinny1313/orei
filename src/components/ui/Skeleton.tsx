// Placeholders de carregamento (shimmer). Substituem os loadings em texto puro.

import type { CSSProperties } from 'react'

type SkeletonProps = {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden />
}

/** Esqueleto de um card (grade de agentes/campanhas) enquanto carrega. */
export function SkeletonCard() {
  return (
    <div className="panel skeleton-card" aria-hidden>
      <Skeleton style={{ height: 22, width: '55%' }} />
      <Skeleton style={{ height: 14, width: '32%' }} />
      <Skeleton style={{ height: 14, width: '72%' }} />
      <Skeleton style={{ height: 38, width: '100%', marginTop: 'auto' }} />
    </div>
  )
}
