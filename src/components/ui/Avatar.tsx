// Avatar reutilizável: usa a imagem do usuário (ex.: avatarUrl do Google) e,
// na ausência dela, mostra as iniciais do nome. Puramente apresentacional.

import type { CSSProperties } from 'react'

type AvatarProps = {
  /** Nome/apelido usado para alt e para gerar as iniciais do fallback. */
  name: string
  src?: string
  size?: number
  className?: string
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, src, size = 36, className = '' }: AvatarProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(11, Math.round(size * 0.4)),
  }

  if (src) {
    return (
      <img
        className={`avatar ${className}`.trim()}
        src={src}
        alt={name}
        style={style}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className={`avatar avatar--fallback ${className}`.trim()} style={style} aria-hidden>
      {initialsOf(name)}
    </span>
  )
}
