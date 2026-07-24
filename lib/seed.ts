import type { AppState } from "./types"

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDaysStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

export function createSeed(): AppState {
  const today = todayStr()
  const tomorrow = addDaysStr(1)
  const yesterday = addDaysStr(-1)
  const now = Date.now()

  return {
    settings: {
      shopName: "Imperial Barber Club",
      address: "Av. San Martín 1234, Local 5",
      phone: "+54 11 5555-1234",
      openDays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
      openHour: "09:00",
      closeHour: "20:00",
      slotMinutes: 30,
    },
    services: [
      { id: "s1", name: "Corte Clásico", price: 8000, durationMin: 30 },
      { id: "s2", name: "Corte + Barba", price: 12000, durationMin: 60 },
      { id: "s3", name: "Arreglo de Barba", price: 6000, durationMin: 30 },
      { id: "s4", name: "Combo Imperial", price: 18000, durationMin: 90 },
      { id: "s5", name: "Perfilado de Cejas", price: 3500, durationMin: 15 },
    ],
    barbers: [
      {
        id: "b1",
        name: "Marco Ferretti",
        photo: "/barber-marco.png",
        commissionPct: 50,
        active: true,
        workStart: "09:00",
        workEnd: "18:00",
      },
      {
        id: "b2",
        name: "Diego Salvi",
        photo: "/barber-diego.png",
        commissionPct: 45,
        active: true,
        workStart: "11:00",
        workEnd: "20:00",
      },
      {
        id: "b3",
        name: "Tomás Rivas",
        photo: "/barber-tomas.png",
        commissionPct: 40,
        active: true,
        workStart: "10:00",
        workEnd: "19:00",
      },
    ],
    clients: [
      { id: "c1", name: "Javier Morales", phone: "+54 11 4444-1001", email: "javier@mail.com" },
      { id: "c2", name: "Lucas Peña", phone: "+54 11 4444-1002", email: "lucas@mail.com" },
      { id: "c3", name: "Andrés Gómez", phone: "+54 11 4444-1003", email: "andres@mail.com" },
      { id: "c4", name: "Federico Ruiz", phone: "+54 11 4444-1004", email: "fede@mail.com" },
      { id: "c5", name: "Nicolás Vera", phone: "+54 11 4444-1005", email: "nico@mail.com" },
    ],
    appointments: [
      { id: "a1", clientId: "c1", barberId: "b1", serviceId: "s2", date: today, time: "09:30", status: "COMPLETED", createdAt: now - 90000000 },
      { id: "a2", clientId: "c2", barberId: "b2", serviceId: "s1", date: today, time: "11:30", status: "COMPLETED", createdAt: now - 80000000 },
      { id: "a3", clientId: "c3", barberId: "b1", serviceId: "s4", date: today, time: "13:00", status: "IN_PROGRESS", createdAt: now - 40000000 },
      { id: "a4", clientId: "c4", barberId: "b3", serviceId: "s3", date: today, time: "16:00", status: "CONFIRMED", createdAt: now - 20000000 },
      { id: "a5", clientId: "c5", barberId: "b2", serviceId: "s1", date: today, time: "17:30", status: "PENDING", createdAt: now - 10000000 },
      { id: "a6", clientId: "c1", barberId: "b3", serviceId: "s2", date: tomorrow, time: "10:00", status: "CONFIRMED", createdAt: now - 5000000 },
      { id: "a7", clientId: "c2", barberId: "b1", serviceId: "s1", date: yesterday, time: "12:00", status: "COMPLETED", createdAt: now - 200000000 },
      { id: "a8", clientId: "c3", barberId: "b2", serviceId: "s4", date: yesterday, time: "15:00", status: "COMPLETED", createdAt: now - 190000000 },
    ],
    movements: [
      { id: "m1", type: "income", amount: 12000, description: "Corte + Barba - Javier Morales", category: "Servicio", date: today, createdAt: now - 90000000, appointmentId: "a1", barberId: "b1" },
      { id: "m2", type: "income", amount: 8000, description: "Corte Clásico - Lucas Peña", category: "Servicio", date: today, createdAt: now - 80000000, appointmentId: "a2", barberId: "b2" },
      { id: "m3", type: "expense", amount: 15000, description: "Compra de productos (geles, ceras)", category: "Insumos", date: today, createdAt: now - 70000000 },
      { id: "m4", type: "expense", amount: 5000, description: "Servicio de limpieza", category: "Servicios", date: today, createdAt: now - 60000000 },
      { id: "m5", type: "income", amount: 8000, description: "Corte Clásico - Lucas Peña", category: "Servicio", date: yesterday, createdAt: now - 200000000, appointmentId: "a7", barberId: "b1" },
      { id: "m6", type: "income", amount: 18000, description: "Combo Imperial - Andrés Gómez", category: "Servicio", date: yesterday, createdAt: now - 190000000, appointmentId: "a8", barberId: "b2" },
    ],
    adjustments: [
      { id: "adj1", barberId: "b1", type: "advance", amount: 5000, description: "Adelanto quincena", date: today },
      { id: "adj2", barberId: "b2", type: "discount", amount: 2000, description: "Rotura de herramienta", date: yesterday },
    ],
    payouts: [],
    advanceRequests: [],
    notifications: [
      { id: "n1", clientId: "c1", message: "Tu turno del Corte + Barba fue confirmado por Marco Ferretti.", date: now - 3600000, read: false },
      { id: "n2", clientId: "c1", message: "Recordatorio: tenés un turno mañana a las 10:00.", date: now - 1800000, read: false },
    ],
  }
}
