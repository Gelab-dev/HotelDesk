import { NextRequest, NextResponse } from 'next/server'
import { getDisponibilidad } from '@/services/reservas.service'
import { jsonFromCaughtError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  try {
    const fecha = new URL(req.url).searchParams.get('fecha')
    if (!fecha) return NextResponse.json({ error: 'Falta la fecha' }, { status: 400 })

    const disponibilidad = await getDisponibilidad(fecha)
    return NextResponse.json({ disponibilidad })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}