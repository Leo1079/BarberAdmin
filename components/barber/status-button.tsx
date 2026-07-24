"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui-kit"

export function AppointmentStatusButton({
  icon: Icon,
  label,
  variant,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  label: string
  variant: "primary" | "success" | "ghost"
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button size="sm" variant={variant} onClick={onClick} disabled={disabled}>
      <Icon className="size-3.5" /> {label}
    </Button>
  )
}
