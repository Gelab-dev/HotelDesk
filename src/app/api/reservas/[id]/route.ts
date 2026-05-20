import { NextRequest, NextResponse } from 'next/server'
import { modificarReserva, eliminarReserva } from '@/services/reservas.service'
import { jsonFromCaughtError } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/parse-request-json'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const parsed = await parseRequestBody<Record<string, unknown>>(req)
  if (!parsed.ok) return parsed.response

  try {
    const reserva = await modificarReserva(
      id,
      parsed.data as Parameters<typeof modificarReserva>[1]
    )
    return NextResponse.json({ reserva })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await eliminarReserva(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}
