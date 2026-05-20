import { NextRequest, NextResponse } from 'next/server'
import { buscarReservas } from '@/services/reservas.service'
import { jsonFromCaughtError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const habitacion = searchParams.get('habitacion') ?? undefined
    const nombre = searchParams.get('nombre') ?? undefined
    const apellido = searchParams.get('apellido') ?? undefined
    const fecha = searchParams.get('fecha') ?? undefined

    if (!habitacion && !nombre && !apellido && !fecha) {
      return NextResponse.json(
        { error: 'Ingresá al menos un criterio de búsqueda' },
        { status: 400 }
      )
    }

    const reservas = await buscarReservas({ habitacion, nombre, apellido, fecha })
    return NextResponse.json({ reservas })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}