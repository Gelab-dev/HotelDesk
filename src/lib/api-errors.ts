import { NextResponse } from 'next/server'
import { Prisma } from '../../generated/prisma/client'
import { ValidacionApiError } from '@/lib/validation-error'

/**
 * Convierte errores conocidos de Prisma (y fallos genéricos) en respuestas JSON
 * coherentes para el cliente vía parseJsonIfOk.
 */
export function jsonFromCaughtError(err: unknown): NextResponse {
  if (err instanceof ValidacionApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        return NextResponse.json(
          { error: 'La reserva no existe o ya fue eliminada.' },
          { status: 404 }
        )
      case 'P2002':
        return NextResponse.json(
          { error: 'Ya existe una reserva con esos datos para esa fecha.' },
          { status: 409 }
        )
      default:
        break
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[api]', err)
  }

  return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
}
