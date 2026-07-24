import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function decodeJwt(token: string): { id: string; role: string } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded)
  } catch (e) {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Archivos estáticos, endpoints API y assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get("auth_token")?.value

  const isAdminPath = pathname.startsWith("/admin")
  const isBarberPath = pathname.startsWith("/barber")
  const isClientPath = pathname.startsWith("/client")

  // Si el usuario intenta ir a /login teniendo token, redirigir a su dashboard correspondiente
  if (pathname === "/login") {
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded?.role) {
        const role = decoded.role.toUpperCase()
        if (role === "OWNER" || role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", request.url))
        } else if (role === "BARBER") {
          return NextResponse.redirect(new URL("/barber", request.url))
        } else if (role === "CLIENT") {
          return NextResponse.redirect(new URL("/client", request.url))
        }
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Rutas protegidas: si no hay token, redirigir a /login
  if (!token) {
    if (isAdminPath || isBarberPath || isClientPath || pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // Si hay token, validar el rol
  const decoded = decodeJwt(token)
  if (!decoded || !decoded.role) {
    // Si el token es inválido o no tiene rol, borrar cookie y mandar a login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("auth_token", "", { maxAge: 0 })
    return response
  }

  const userRole = decoded.role.toUpperCase()

  // Si está en la raíz "/", redirigir según su rol
  if (pathname === "/") {
    if (userRole === "OWNER" || userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url))
    } else if (userRole === "BARBER") {
      return NextResponse.redirect(new URL("/barber", request.url))
    } else {
      return NextResponse.redirect(new URL("/client", request.url))
    }
  }

  // Validaciones cruzadas de rol
  if (isAdminPath && userRole !== "OWNER" && userRole !== "ADMIN") {
    if (userRole === "BARBER") {
      return NextResponse.redirect(new URL("/barber", request.url))
    }
    return NextResponse.redirect(new URL("/client", request.url))
  }

  if (isBarberPath && userRole !== "BARBER") {
    if (userRole === "OWNER" || userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/client", request.url))
  }

  if (isClientPath && userRole !== "CLIENT") {
    if (userRole === "OWNER" || userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/barber", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

