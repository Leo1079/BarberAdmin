"use client"

import { AdminApp } from "@/components/admin/admin-app"
import { StoreProvider } from "@/lib/store"

export default function AdminPage() {
  return (
    <StoreProvider>
      <AdminApp />
    </StoreProvider>
  )
}
