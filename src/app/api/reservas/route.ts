import { NextRequest, NextResponse } from 'next/server'
import { getReservasPorFecha, crearReserva } from '@/services/reservas.service'
import { jsonFromCaughtError } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/parse-request-json'

export async function GET(req: NextRequest) {
  try {
    const fecha = new URL(req.url).searchParams.get('fecha')
    if (!fecha) return NextResponse.json({ error: 'Falta la fecha' }, { status: 400 })

    const reservas = await getReservasPorFecha(fecha)
    return NextResponse.json({ reservas })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseRequestBody<{
    habitacion?: string
    nombre?: string
    apellido?: string
    fecha?: string
    turno?: string
    [key: string]: unknown
  }>(req)
  if (!parsed.ok) return parsed.response

  const body = parsed.data
  const { habitacion, nombre, apellido, fecha, turno } = body

  if (!habitacion || !nombre || !apellido || !fecha || !turno) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  try {
    const resultado = await crearReserva(body as Parameters<typeof crearReserva>[0])
    return NextResponse.json(resultado, { status: resultado.existe ? 200 : 201 })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}