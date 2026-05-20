import * as XLSX from 'xlsx'
import { crearReserva } from '@/services/reservas.service'
import { ValidacionApiError } from '@/lib/validation-error'

/** Tamaño máximo del archivo de carga (2 MiB). */
export const GRUPOS_EXCEL_BYTES_MAX = 2 * 1024 * 1024

export type ErrorFilaImportacion = { fila: number; mensaje: string }

export type ResultadoImportacionGrupos = {
  creadas: number
  duplicadasOmitidas: number
  filasVacias: number
  filasTotalesDatos: number
  errores: ErrorFilaImportacion[]
}

function sinDiacriticos(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Convierte título de columna Excel a clave canónica. */
export function canonicoEncabezado(raw: string): string | undefined {
  const k = sinDiacriticos(raw || '').replace(/\s+/g, '_')
  const mapas: Record<string, string> = {
    habitacion: 'habitacion',
    habitacin: 'habitacion',
    room: 'habitacion',
    nombre: 'nombre',
    first_name: 'nombre',
    apellido: 'apellido',
    last_name: 'apellido',
    fecha: 'fecha',
    fecha_desayuno: 'fecha',
    turno: 'turno',
    horario: 'turno',
    sin_tacc: 'sin_tacc',
    sintacc: 'sin_tacc',
    sin_tacca: 'sin_tacc',
    sin_lactosa: 'sin_lactosa',
    sinlactosa: 'sin_lactosa',
    vegetariano: 'vegetariano',
    vegano: 'vegano',
    comentarios: 'comentarios',
    comentario: 'comentarios',
    notas: 'comentarios',
  }
  return mapas[k] ?? undefined
}

function celdaAString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return formatoSoloFechaLocal(v)
  return String(v).trim()
}

function formatoSoloFechaLocal(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Serial de fecha Excel → solo fecha local (aprox.). */
function serialExcelAFecha(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  const d = new Date(ms)
  return formatoSoloFechaLocal(d)
}

const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/

function parseFechaCelda(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null
  if (val instanceof Date && !Number.isNaN(val.getTime())) return formatoSoloFechaLocal(val)
  if (typeof val === 'number' && Number.isFinite(val)) return serialExcelAFecha(val)
  const s = String(val).trim()
  if (!s) return null
  if (ISO_FECHA.test(s)) return s
  const dNat = new Date(s)
  if (!Number.isNaN(dNat.getTime())) return formatoSoloFechaLocal(dNat)
  return null
}

function parseBoolFlexible(val: unknown, col: string): boolean | ValidacionApiError {
  if (val === null || val === undefined || val === '') return false
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') {
    if (val === 0) return false
    if (val === 1) return true
    return new ValidacionApiError(`Valor numérico no válido en «${col}» (use 0 o 1).`)
  }
  const s = String(val).trim().toLowerCase()
  const verdadero = ['sí', 'si', 's', 'true', '1', 'x', 'y', 'yes', '✓'].includes(s)
  const falso = ['no', 'false', '0', 'n'].includes(s)
  if (verdadero) return true
  if (falso) return false
  return new ValidacionApiError(
    `No se reconoce el texto en «${col}». Usá Sí / No, 1/0 o vacío (= No).`
  )
}

function filaVaciaCanonico(rec: Record<string, unknown>): boolean {
  const h = celdaAString(rec.habitacion)
  const n = celdaAString(rec.nombre)
  const a = celdaAString(rec.apellido)
  const f = parseFechaCelda(rec.fecha ?? '')
  const t = celdaAString(rec.turno)
  return !h && !n && !a && !f && !t
}

export type FilaImportacionCanonica = {
  numeroFilaExcel: number
  valores: Record<string, unknown>
}

/**
 * Interpreta cada fila (con número Excel real para mensajes de error)
 * y crea reservas con `crearReserva`.
 */
export async function importarFilasCanonico(
  filas: FilaImportacionCanonica[]
): Promise<ResultadoImportacionGrupos> {
  let creadas = 0
  let duplicadasOmitidas = 0
  let filasVacias = 0
  const errores: ErrorFilaImportacion[] = []
  let filasTotalesDatos = 0

  for (const { numeroFilaExcel, valores } of filas) {
    const raw = valores

    if (filaVaciaCanonico(raw)) {
      filasVacias += 1
      continue
    }

    filasTotalesDatos += 1

    const habitacion = celdaAString(raw.habitacion)
    const nombre = celdaAString(raw.nombre)
    const apellido = celdaAString(raw.apellido)
    const fechaParsed = parseFechaCelda(raw.fecha)
    const turno = celdaAString(raw.turno)
    const comentariosRaw = celdaAString(raw.comentarios)

    if (!habitacion || !nombre || !apellido || !fechaParsed || !turno) {
      errores.push({
        fila: numeroFilaExcel,
        mensaje:
          'Faltan datos obligatorios: habitación, nombre, apellido, fecha o turno.',
      })
      continue
    }

    if (!ISO_FECHA.test(fechaParsed)) {
      errores.push({ fila: numeroFilaExcel, mensaje: 'La fecha debe ser válida.' })
      continue
    }

    const rSt = parseBoolFlexible(raw.sin_tacc, 'sin_tacc')
    const rLc = parseBoolFlexible(raw.sin_lactosa, 'sin_lactosa')
    const rVeg = parseBoolFlexible(raw.vegetariano, 'vegetariano')
    const rVegan = parseBoolFlexible(raw.vegano, 'vegano')

    const flags = [rSt, rLc, rVeg, rVegan]
    const bad = flags.find(f => f instanceof ValidacionApiError)
    if (bad instanceof ValidacionApiError) {
      errores.push({ fila: numeroFilaExcel, mensaje: bad.message })
      continue
    }

    try {
      const out = await crearReserva({
        habitacion,
        nombre,
        apellido,
        fecha: fechaParsed,
        turno,
        sinTacc: rSt as boolean,
        sinLactosa: rLc as boolean,
        vegetariano: rVeg as boolean,
        vegano: rVegan as boolean,
        comentarios: comentariosRaw || undefined,
      })

      if (out.existe) duplicadasOmitidas += 1
      else creadas += 1
    } catch (e) {
      const msg =
        e instanceof ValidacionApiError ? e.message : 'Error al guardar la reserva.'
      errores.push({ fila: numeroFilaExcel, mensaje: msg })
    }
  }

  return {
    creadas,
    duplicadasOmitidas,
    filasVacias,
    filasTotalesDatos,
    errores,
  }
}

/**
 * Lee buffer .xlsx / .xls: primera hoja; primera fila = encabezados.
 */
export async function importarGruposDesdeExcel(
  buf: Buffer | ArrayBuffer
): Promise<ResultadoImportacionGrupos> {
  const workbook = XLSX.read(buf, { type: 'buffer', cellDates: true })

  const name = workbook.SheetNames[0]
  if (!name) {
    throw new ValidacionApiError('El archivo no tiene hojas de cálculo.', 400)
  }

  const sheet = workbook.Sheets[name]
  const matriz = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null | undefined)[]>(
    sheet,
    {
      header: 1,
      defval: null,
      blankrows: true,
    }
  )

  if (!matriz.length || !matriz[0]?.length) {
    throw new ValidacionApiError(
      'No se encontraron filas ni encabezados en la primera hoja.',
      400
    )
  }

  const encabezadosFila = matriz[0] as unknown[]
  const indices: Record<string, number> = {}
  encabezadosFila.forEach((titulo, colIdx) => {
    const canon = canonicoEncabezado(String(titulo ?? ''))
    if (canon) indices[canon] = colIdx
  })

  const requeridas = ['habitacion', 'nombre', 'apellido', 'fecha', 'turno'] as const
  const faltan = requeridas.filter(clave => indices[clave] === undefined)
  if (faltan.length) {
    throw new ValidacionApiError(
      `Faltan columnas obligatorias en la fila de títulos: ${faltan.join(', ')}. ` +
        'Use: habitación, nombre, apellido, fecha, turno; opcional: sin_tacc, sin_lactosa, vegetariano, vegano, comentarios.',
      400
    )
  }

  const filasNumeradas: FilaImportacionCanonica[] = []

  for (let r = 1; r < matriz.length; r++) {
    const filaExcel = matriz[r] ?? []
    const rec: Record<string, unknown> = {}
    for (const clave of Object.keys(indices)) {
      const colIdx = indices[clave]
      rec[clave] = filaExcel[colIdx] ?? null
    }
    filasNumeradas.push({
      numeroFilaExcel: r + 1,
      valores: rec,
    })
  }

  /** Fila 1 Excel = cabeceras; primera fila de datos = 2 */
  return importarFilasCanonico(filasNumeradas)
}
