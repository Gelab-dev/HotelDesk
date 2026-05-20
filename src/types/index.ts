export interface Reserva {
    id: string
    habitacion: string
    nombre: string
    apellido: string
    fecha: string
    turno: string
    sinTacc: boolean
    sinLactosa: boolean
    vegetariano: boolean
    vegano: boolean
    comentarios: string | null
    createdAt: string
    updatedAt: string
  }
  
  export interface HuespedVerificado {
    valido: boolean
    nombre?: string
    apellido?: string
    habitacion?: string
    checkIn?: string
    checkOut?: string
    mensaje?: string
  }
  
  export interface Disponibilidad {
    turno: string
    disponibles: number
    ocupados: number
    lleno: boolean
  }