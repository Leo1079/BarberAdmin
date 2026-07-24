"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  apiClient,
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  registerOnUnauthorized,
} from "./api-client"
import type { User } from "./types"

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  loading: boolean
  login: (email: string, pass: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setAccessToken(null)
    setRefreshToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
    }
  }, [])

  useEffect(() => {
    registerOnUnauthorized(() => {
      logout()
    })
  }, [logout])

  useEffect(() => {
    const savedToken = getAccessToken()
    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null

    if (savedToken && savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr) as User
        setUser(savedUser)
        setToken(savedToken)
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [logout])

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true)
    try {
      const res = await apiClient.post<LoginResponse>("/api/auth/login", { email, password: pass })
      const loggedUser = res.user
      const tokenReceived = res.accessToken
      const refreshReceived = res.refreshToken

      setUser(loggedUser)
      setToken(tokenReceived)
      setAccessToken(tokenReceived)
      if (refreshReceived) {
        setRefreshToken(refreshReceived)
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(loggedUser))
      }
      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken: token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
