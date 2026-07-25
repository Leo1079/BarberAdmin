const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

let accessToken: string | null = null
let refreshToken: string | null = null
let onUnauthorizedCallback: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token)
      document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`
    } else {
      localStorage.removeItem("auth_token")
      document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("auth_token")
  }
  return accessToken
}

export function setRefreshToken(token: string | null) {
  refreshToken = token
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("refresh_token", token)
      document.cookie = `refresh_token=${token}; path=/; max-age=2592000; SameSite=Lax`
    } else {
      localStorage.removeItem("refresh_token")
      document.cookie = `refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }
}

export function getRefreshToken(): string | null {
  if (!refreshToken && typeof window !== "undefined") {
    refreshToken = localStorage.getItem("refresh_token")
  }
  return refreshToken
}

export function registerOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
  const token = getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch {
    throw new Error("No se pudo conectar con el servidor. Puede estar iniciando, esperá unos segundos e intentá de nuevo.")
  }

  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    const currentRefreshToken = getRefreshToken()
    if (currentRefreshToken) {
      try {
        const refreshUrl = `${BASE_URL}/api/auth/refresh`
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          if (data.accessToken) {
            setAccessToken(data.accessToken)
            headers["Authorization"] = `Bearer ${data.accessToken}`
            const retryRes = await fetch(url, { ...options, headers })
            if (retryRes.ok) {
              if (retryRes.status === 204) return {} as T
              return retryRes.json() as Promise<T>
            }
          }
        }
      } catch {
        // Fallthrough to logout if refresh fails
      }
    }

    setAccessToken(null)
    setRefreshToken(null)
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback()
    }
    throw new Error("Unauthorized")
  }

  if (response.status === 401) {
    if (endpoint.includes("/auth/login")) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Email o contraseña incorrectos")
    }
    setAccessToken(null)
    setRefreshToken(null)
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback()
    }
    throw new Error("Tu sesión expiró, iniciá sesión de nuevo.")
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "DELETE" }),
}
