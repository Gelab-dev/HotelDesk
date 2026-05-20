import prisma from '@/lib/prisma'
import { ValidacionApiError } from '@/lib/validation-error'
import { capitalizar, normalizar } from '@/lib/normalizar'
import {
  CUPO_POR_TURNO,
  TURNOS,
  esTurnoValido,
} from '@/lib/reservas-const'

function getRangoDia(fecha: string) {
  const inicio = new Date(fecha)
  inicio.setUTCHours(0, 0, 0, 0)
  const fin = new Date(fecha)
  fin.setUTCHours(23, 59, 59, 999)
  return { inicio, fin }
}

/** Clave `YYYY-MM-DD` en UTC a partir del `Date` guardado en BD (misma convención que `crear`). */
export function fechaReservaAClaveUtc(fechaGuardada: Date): string {
  return fechaGuardada.toISOString().slice(0, 10)
}

async function ocupacionTurnoSinReserva({
  fechaDiaISO,
  turno,
  excluirId,
}: {
  fechaDiaISO: string
  turno: string
  /** Excluye esta fila del conteo (p. ej. al modificar de turno). */
  excluirId?: string
}): Promise<number> {
  const { inicio, fin } = getRangoDia(fechaDiaISO)
  return prisma.reserva.count({
    where: {
      fecha: { gte: inicio, lte: fin },
      turno,
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
  })
}

export async function getReservasPorFecha(fecha: string) {
  const { inicio, fin } = getRangoDia(fecha)
  return prisma.reserva.findMany({
    where: { fecha: { gte: inicio, lte: fin } },
    orderBy: [{ turno: 'asc' }, { apellido: 'asc' }],
  })
}

export async function getDisponibilidad(fecha: string) {
  const { inicio, fin } = getRangoDia(fecha)

  const reservas = await prisma.reserva.groupBy({
    by: ['turno'],
    where: { fecha: { gte: inicio, lte: fin } },
    _count: { turno: true },
  })

  return TURNOS.map(turno => {
    const ocupados = reservas.find(r => r.turno === turno)?._count.turno ?? 0
    return {
      turno,
      disponibles: CUPO_POR_TURNO - ocupados,
      ocupados,
      lleno: ocupados >= CUPO_POR_TURNO,
    }
  })
}

export async function crearReserva(data: {
  habitacion: string
  nombre: string
  apellido: string
  fecha: string
  turno: string
  sinTacc: boolean
  sinLactosa: boolean
  vegetariano: boolean
  vegano: boolean
  comentarios?: string
}) {
  if (!esTurnoValido(data.turno)) {
    throw new ValidacionApiError(
      `Turno inválido: debe ser ${TURNOS.join(', ')}`
    )
  }

  const { inicio, fin } = getRangoDia(data.fecha)
  const nombreNorm   = capitalizar(data.nombre)
  const apellidoNorm = capitalizar(data.apellido)

  const existente = await prisma.reserva.findFirst({
    where: {
      habitacion: data.habitacion,
      nombre:     nombreNorm,
      apellido:   apellidoNorm,
      fecha: { gte: inicio, lte: fin },
    },
  })

  if (existente) {
    return { existe: true, reserva: existente }
  }

  const otrosEnTurno = await ocupacionTurnoSinReserva({
    fechaDiaISO: data.fecha,
    turno: data.turno,
  })
  if (otrosEnTurno >= CUPO_POR_TURNO) {
    throw new ValidacionApiError(
      `Sin cupo en el turno ${data.turno} ese día (máximo ${CUPO_POR_TURNO} reservas).`
    )
  }

  const reserva = await prisma.reserva.create({
    data: {
      habitacion:  data.habitacion,
      nombre:      nombreNorm,
      apellido:    apellidoNorm,
      fecha:       new Date(data.fecha),
      turno:       data.turno,
      sinTacc:     data.sinTacc     ?? false,
      sinLactosa:  data.sinLactosa  ?? false,
      vegetariano: data.vegetariano ?? false,
      vegano:      data.vegano      ?? false,
      comentarios: data.comentarios ?? null,
    },
  })

  return { existe: false, reserva }
}

export async function modificarReserva(id: string, data: {
  turno?: string
  nombre?: string
  apellido?: string
  sinTacc?: boolean
  sinLactosa?: boolean
  vegetariano?: boolean
  vegano?: boolean
  comentarios?: string
}) {
  const actual = await prisma.reserva.findUnique({ where: { id } })
  if (!actual) {
    throw new ValidacionApiError('La reserva no existe.', 404)
  }

  const nuevoTurno = data.turno !== undefined ? data.turno : actual.turno
  if (!esTurnoValido(nuevoTurno)) {
    throw new ValidacionApiError(`Turno inválido: debe ser ${TURNOS.join(', ')}`)
  }

  const fechaDia = fechaReservaAClaveUtc(actual.fecha)
  const ocupadosOtros = await ocupacionTurnoSinReserva({
    fechaDiaISO: fechaDia,
    turno: nuevoTurno,
    excluirId: id,
  })
  if (ocupadosOtros >= CUPO_POR_TURNO) {
    throw new ValidacionApiError(
      `Sin cupo en el turno ${nuevoTurno} ese día (máximo ${CUPO_POR_TURNO} reservas).`
    )
  }

  return prisma.reserva.update({
    where: { id },
    data: {
      ...data,
      turno: nuevoTurno,
      nombre:   data.nombre   ? capitalizar(data.nombre)   : undefined,
      apellido: data.apellido ? capitalizar(data.apellido) : undefined,
    },
  })
}

export async function eliminarReserva(id: string) {
  return prisma.reserva.delete({ where: { id } })
}

export async function buscarReservas(params: {
  habitacion?: string
  nombre?: string
  apellido?: string
  fecha?: string
}) {
  const where: Record<string, unknown> = {}

  if (params.habitacion) where.habitacion = params.habitacion

  if (params.fecha) {
    const { inicio, fin } = getRangoDia(params.fecha)
    where.fecha = { gte: inicio, lte: fin }
  }

  let reservas = await prisma.reserva.findMany({
    where,
    orderBy: [{ fecha: 'asc' }, { turno: 'asc' }],
  })

  if (params.nombre || params.apellido) {
    reservas = reservas.filter(r => {
      const matchNombre   = params.nombre
        ? normalizar(r.nombre).includes(normalizar(params.nombre!))
        : true
      const matchApellido = params.apellido
        ? normalizar(r.apellido).includes(normalizar(params.apellido!))
        : true
      return matchNombre && matchApellido
    })
  }

  return reservas
}