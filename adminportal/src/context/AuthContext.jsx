import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { restoreSession, setSignedOutHandler, signIn as apiSignIn, signOut as apiSignOut } from '../api/client'

const AuthContext = createContext(null)

export const ROLE_LABELS = {
  officer: 'Officer · view only',
  admin: 'Administrator',
  super_admin: 'Super administrator',
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    restoreSession().then((found) => {
      if (cancelled) return
      setAdmin(found)
      setStatus(found ? 'in' : 'out')
    })
    setSignedOutHandler(() => {
      setAdmin(null)
      setStatus('out')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (username, password) => {
    const found = await apiSignIn(username, password)
    setAdmin(found)
    setStatus('in')
    return found
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiSignOut()
    } finally {
      setAdmin(null)
      setStatus('out')
    }
  }, [])

  const value = useMemo(
    () => ({
      admin,
      status,
      signIn,
      signOut,
      updateAdmin: setAdmin,
      canEdit: admin?.role === 'admin' || admin?.role === 'super_admin',
      isSuperAdmin: admin?.role === 'super_admin',
    }),
    [admin, status, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
