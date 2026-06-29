import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  authMode,
  getSession,
  isGuestMode,
  onAuthStateChange,
  signInWithGoogle as serviceSignInWithGoogle,
  signInWithPassword,
  signOut as serviceSignOut,
  signUp as serviceSignUp,
} from '../services/authService'
import type { AuthSession, SignInCredentials, SignUpCredentials } from '../types/auth'
import { AuthContext, type AuthContextValue } from './authContextValue'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000
const LAST_ACTIVITY_STORAGE_KEY = 'orei:lastActivityAt'
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'pointerdown', 'touchstart'] as const

const readLastActivityAt = (): number | null => {
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)
    if (!raw) return null

    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

const writeLastActivityAt = (value = Date.now()) => {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(value))
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

const clearLastActivityAt = () => {
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY)
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

const isIdleExpired = (now = Date.now()): boolean => {
  const lastActivityAt = readLastActivityAt()
  return lastActivityAt !== null && now - lastActivityAt >= IDLE_TIMEOUT_MS
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const idleSignOutInProgress = useRef(false)

  useEffect(() => {
    let active = true

    getSession()
      .then(async (initial) => {
        if (!active) return

        if (initial && authMode === 'real') {
          if (isIdleExpired()) {
            idleSignOutInProgress.current = true
            await serviceSignOut()
            idleSignOutInProgress.current = false
            clearLastActivityAt()
            if (active) setSession(null)
            return
          }

          if (readLastActivityAt() === null) {
            writeLastActivityAt()
          }
        }

        if (active) setSession(initial)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const subscription = onAuthStateChange((next) => {
      if (active) setSession(next)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const next = await getSession()
    setSession(next)
  }, [])

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      const result = await signInWithPassword(credentials)
      if (!result.error) {
        if (authMode === 'real') writeLastActivityAt()
        await refreshSession()
      }
      return result
    },
    [refreshSession],
  )

  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      const result = await serviceSignUp(credentials)
      if (!result.error) await refreshSession()
      return result
    },
    [refreshSession],
  )

  const signInWithGoogle = useCallback(async () => {
    const result = await serviceSignInWithGoogle()
    if (!result.error && isGuestMode) await refreshSession()
    return result
  }, [refreshSession])

  const signOut = useCallback(async () => {
    const result = await serviceSignOut()

    if (!result.error) {
      clearLastActivityAt()
      setSession(null)
    }

    return result
  }, [])

  useEffect(() => {
    if (!session || authMode !== 'real') return

    let timeoutId: ReturnType<typeof window.setTimeout> | undefined

    const expireSession = async () => {
      if (idleSignOutInProgress.current) return

      idleSignOutInProgress.current = true
      const result = await serviceSignOut()
      idleSignOutInProgress.current = false

      if (!result.error) {
        clearLastActivityAt()
        setSession(null)
      }
    }

    const scheduleExpiration = () => {
      window.clearTimeout(timeoutId)

      const lastActivityAt = readLastActivityAt()
      if (lastActivityAt === null) {
        writeLastActivityAt()
        timeoutId = window.setTimeout(expireSession, IDLE_TIMEOUT_MS)
        return
      }

      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt)
      if (remaining <= 0) {
        void expireSession()
        return
      }

      timeoutId = window.setTimeout(expireSession, remaining)
    }

    const recordActivity = () => {
      if (isIdleExpired()) {
        void expireSession()
        return
      }

      writeLastActivityAt()
      scheduleExpiration()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') recordActivity()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_STORAGE_KEY) return

      if (event.newValue === null) {
        void expireSession()
        return
      }

      scheduleExpiration()
    }

    scheduleExpiration()

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, recordActivity, { passive: true })
    }
    window.addEventListener('focus', recordActivity)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.clearTimeout(timeoutId)
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, recordActivity)
      }
      window.removeEventListener('focus', recordActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isGuest: isGuestMode,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signIn, signUp, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
