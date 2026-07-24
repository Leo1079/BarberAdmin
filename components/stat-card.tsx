"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "./ui-kit"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  tone?: "default" | "positive" | "negative" | "primary"
}) {
  const toneCls = {
    default: "text-foreground",
    positive: "text-success",
    negative: "text-destructive",
    primary: "text-primary",
  }[tone]

  return (
    <div className="rounded-2xl neu-raised p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="rounded-lg neu-inset p-1.5 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <p className={cn("font-serif text-2xl font-semibold tabular-nums", toneCls)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
