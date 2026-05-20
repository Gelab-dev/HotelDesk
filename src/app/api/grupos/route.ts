import { NextRequest, NextResponse } from 'next/server'
import {
  GRUPOS_EXCEL_BYTES_MAX,
  importarGruposDesdeExcel,
} from '@/services/grupos.service'
import { jsonFromCaughtError } from '@/lib/api-errors'

const MIME_EXCEL = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
])

export async function POST(req: NextRequest) {
  const tipo = req.headers.get('content-type')
  if (!tipo?.startsWith('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Enviá el archivo como multipart/form-data con el campo «file».' },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el cuerpo multipart.' }, { status: 400 })
  }

  const archivo =
    formData.get('file') ?? formData.get('archivo') ?? formData.get('excel')

  if (!(archivo instanceof File)) {
    return NextResponse.json(
      { error: 'Falta el archivo (campo «file»).' },
      { status: 400 }
    )
  }

  const nombreOk = /\.(xlsx|xls)$/i.test(archivo.name)
  if (!nombreOk) {
    return NextResponse.json(
      { error: 'El archivo debe tener extensión .xlsx o .xls.' },
      { status: 400 }
    )
  }
  if (
    archivo.type &&
    archivo.type !== 'application/octet-stream' &&
    !MIME_EXCEL.has(archivo.type)
  ) {
    return NextResponse.json(
      { error: 'Formato inválido. Subí una planilla Excel .xlsx o .xls.' },
      { status: 400 }
    )
  }

  if (archivo.size === 0) {
    return NextResponse.json({ error: 'El archivo está vacío.' }, { status: 400 })
  }

  if (archivo.size > GRUPOS_EXCEL_BYTES_MAX) {
    return NextResponse.json(
      { error: `El archivo supera los ${Math.floor(GRUPOS_EXCEL_BYTES_MAX / (1024 * 1024))} MiB máximos.` },
      { status: 413 }
    )
  }

  try {
    const buffer = await archivo.arrayBuffer()
    const resultado = await importarGruposDesdeExcel(buffer)
    return NextResponse.json(resultado, { status: 200 })
  } catch (e) {
    return jsonFromCaughtError(e)
  }
}
