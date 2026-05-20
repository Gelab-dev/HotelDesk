import { NextRequest, NextResponse } from 'next/server'
import { verificarHuesped } from '@/services/huespedes.service'
import { jsonFromCaughtError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const habitacion = searchParams.get('habitacion')
    const nombre = searchParams.get('nombre')
    const apellido = searchParams.get('apellido')
    const fecha = searchParams.get('fecha')

    if (!habitacion || !nombre || !apellido || !fecha) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    const resultado = await verificarHuesped(
      habitacion,
      nombre,
      apellido,
      new Date(fecha)
    )
    return NextResponse.json(resultado)
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}