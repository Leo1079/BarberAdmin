"use client"

import { X } from "lucide-react"
import type React from "react"
import { useEffect } from "react"

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl neu-raised p-4 sm:p-5", className)}>{children}</div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-balance truncate">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground truncate sm:text-wrap">{subtitle}</p>}
      </div>
      <div className="shrink-0">
        {action}
      </div>
    </div>
  )
}

type Variant = "primary" | "outline" | "ghost" | "danger" | "success"
const variants: Record<Variant, string> = {
  primary: "neu-raised text-primary font-semibold hover:text-primary/80 active:neu-inset",
  outline: "neu-raised text-foreground font-medium active:neu-inset",
  ghost: "text-muted-foreground hover:text-foreground active:neu-inset-sm hover:neu-raised-sm",
  danger: "neu-raised text-destructive font-semibold hover:text-destructive/80 active:neu-inset",
  success: "neu-raised text-success font-semibold hover:text-success/80 active:neu-inset",
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  "w-full rounded-xl border-none neu-inset px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/20"

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputCls, "appearance-none")} {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-20 resize-y")} {...props} />
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto animate-in fade-in zoom-in-95 rounded-2xl neu-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-all duration-200 neu-raised-sm active:neu-inset-sm hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl neu-inset py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
