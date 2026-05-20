import { NextRequest, NextResponse } from 'next/server'
import { generarCsvReporteDesayunos } from '@/services/reporte.service'
import { jsonFromCaughtError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  const fecha = new URL(req.url).searchParams.get('fecha')
  if (!fecha?.trim()) {
    return NextResponse.json({ error: 'Falta el parámetro fecha (YYYY-MM-DD).' }, { status: 400 })
  }

  const isoOk = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  if (!isoOk) {
    return NextResponse.json(
      { error: 'Formato de fecha inválido. Use YYYY-MM-DD.' },
      { status: 400 }
    )
  }

  try {
    const csv = await generarCsvReporteDesayunos(fecha)
    const archivo = `reporte-desayuno-${fecha.replace(/[^\d-]/g, '')}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${archivo}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}
