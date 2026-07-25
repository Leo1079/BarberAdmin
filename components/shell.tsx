"use client"

import type { LucideIcon } from "lucide-react"
import { LogOut, Menu, Scissors, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "./ui-kit"

export interface NavItem {
  key: string
  label: string
  icon: LucideIcon
}

export function Shell({
  brand,
  nav,
  active,
  onNavigate,
  children,
}: {
  brand: string
  nav: NavItem[]
  active: string
  onNavigate: (key: string) => void
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-dvh bg-background py-3">
      <header className="sticky top-3 z-40 mx-4 rounded-2xl bg-background/90 backdrop-blur-md neu-raised-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl neu-raised-sm text-primary">
              <img src="/logo.svg" alt={brand} className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-base font-semibold text-foreground">{brand}</p>
              <p className="text-[11px] uppercase tracking-widest text-primary">Sistema de Turnos y Caja</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden flex size-9 items-center justify-center rounded-xl neu-raised-sm text-foreground hover:text-primary transition-colors"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex w-64 max-w-xs flex-col gap-2 bg-background p-6 shadow-2xl neu-raised animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt={brand} className="size-5 text-primary" />
                <span className="font-serif font-semibold">{brand}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg neu-raised-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active === item.key
                    ? "neu-inset text-primary"
                    : "text-muted-foreground hover:neu-raised-sm hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </button>
            ))}
            <div className="mt-auto border-t border-border pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:neu-raised-sm hover:text-destructive"
              >
                <LogOut className="size-[18px]" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-0 md:gap-6 md:px-4">
        {/* Desktop sidebar */}
        <aside className="sticky top-[170px] hidden h-fit w-48 shrink-0 flex-col gap-2 rounded-2xl p-6 md:flex neu-raised">
          {nav.map((item) => (
            <NavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
          ))}
          <div className="mt-auto border-t border-border pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:neu-raised-sm hover:text-destructive"
            >
              <LogOut className="size-[18px]" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-6 md:px-0">{children}</main>
      </div>
      <footer className="border-t border-border py-3 text-center text-[11px] text-muted-foreground">
        Creado por LS Systems — Leonardo Santillan
      </footer>
    </div>
  )
}

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: string
  onNavigate: (key: string) => void
}) {
  return (
    <button
      onClick={() => onNavigate(item.key)}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active === item.key
          ? "neu-inset text-primary"
          : "text-muted-foreground hover:neu-raised-sm hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px]" />
      {item.label}
    </button>
  )
}
