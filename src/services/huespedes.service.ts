import prisma from '@/lib/prisma'
import { normalizar } from '@/lib/normalizar'

export async function verificarHuesped(
  habitacion: string,
  nombre: string,
  apellido: string,
  fecha: Date
) {
  const huespedes = await prisma.huespedDemo.findMany({
    where: { habitacion },
  })

  const huesped = huespedes.find(h =>
    normalizar(h.nombre)   === normalizar(nombre) &&
    normalizar(h.apellido) === normalizar(apellido) &&
    h.checkIn  < fecha &&
    h.checkOut >= fecha
  )

  if (!huesped) return { valido: false, mensaje: 'No se encontró un huésped activo con esos datos para la fecha indicada.' }

  return {
    valido: true,
    nombre:    huesped.nombre,
    apellido:  huesped.apellido,
    habitacion: huesped.habitacion,
    checkIn:   huesped.checkIn,
    checkOut:  huesped.checkOut,
  }
}