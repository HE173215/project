import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { setAuthToken } from "../api/client"

const STORAGE_KEY = "auth_state"

const AuthContext = createContext(null)

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { user: null, token: null }
    }
    const parsed = JSON.parse(raw)
    return {
      user: parsed.user || null,
      token: parsed.token || null,
    }
  } catch (error) {
    console.warn("Failed to parse auth state", error)
    return { user: null, token: null }
  }
}

export const AuthProvider = ({ children }) => {
  const [{ user, token }, setState] = useState(() => readStoredState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    setAuthToken(token)
  }, [user, token])

  const value = useMemo(() => ({
    user,
    token,
    setAuthState: ({ nextUser, nextToken }) => {
      setState({
        user: nextUser ?? null,
        token: nextToken ?? null,
      })
    },
    logout: () => {
      setState({ user: null, token: null })
    },
  }), [user, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}