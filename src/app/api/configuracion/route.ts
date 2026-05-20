import { NextRequest, NextResponse } from 'next/server'
import {
  establecerBloqueo,
  getConfiguracion,
} from '@/services/configuracion.service'
import { jsonFromCaughtError } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/parse-request-json'

export async function GET() {
  try {
    const config = await getConfiguracion()
    return NextResponse.json({ bloqueado: config.bloqueado })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}

export async function PUT(req: NextRequest) {
  const parsed = await parseRequestBody<{ bloqueado?: boolean }>(req)
  if (!parsed.ok) return parsed.response

  const { bloqueado } = parsed.data
  if (typeof bloqueado !== 'boolean') {
    return NextResponse.json(
      { error: 'Se esperaba un booleano «bloqueado».' },
      { status: 400 }
    )
  }

  try {
    const guardado = await establecerBloqueo(bloqueado)
    return NextResponse.json({ bloqueado: guardado })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}