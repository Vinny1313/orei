export const createRouteKey = (): string => {
  const bytes = new Uint8Array(12)

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 24) ?? String(Date.now())
}
