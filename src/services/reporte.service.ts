import {
  CUPO_POR_TURNO,
  TURNOS,
  getReservasPorFecha,
} from '@/services/reservas.service'

function escaparCsv(celda: string | number | boolean): string {
  const s = celda === null || celda === undefined ? '' : String(celda)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function filaCsv(celdas: (string | number | boolean)[]): string {
  return celdas.map(escaparCsv).join(',')
}

/** Resumen por turno + detalle de todas las reservas del día */
export async function generarCsvReporteDesayunos(fechaIso: string): Promise<string> {
  const reservas = await getReservasPorFecha(fechaIso)
  type FilaDb = (typeof reservas)[number]

  type Bucket = {
    lista: FilaDb[]
    sinTacc: number
    sinLactosa: number
    vegetariano: number
    vegano: number
    conComentarios: number
  }

  const porTurno = new Map<string, Bucket>()

  for (const t of TURNOS) {
    porTurno.set(t, {
      lista: [],
      sinTacc: 0,
      sinLactosa: 0,
      vegetariano: 0,
      vegano: 0,
      conComentarios: 0,
    })
  }

  for (const r of reservas) {
    let bucket = porTurno.get(r.turno)
    if (!bucket) {
      bucket = {
        lista: [],
        sinTacc: 0,
        sinLactosa: 0,
        vegetariano: 0,
        vegano: 0,
        conComentarios: 0,
      }
      porTurno.set(r.turno, bucket)
    }

    bucket.lista.push(r)
    if (r.sinTacc) bucket.sinTacc += 1
    if (r.sinLactosa) bucket.sinLactosa += 1
    if (r.vegetariano) bucket.vegetariano += 1
    if (r.vegano) bucket.vegano += 1
    if (r.comentarios && String(r.comentarios).trim()) bucket.conComentarios += 1
  }

  const lineas: string[] = []

  lineas.push(filaCsv(['Reporte de desayunos', `Fecha: ${fechaIso}`]))
  lineas.push('')
  lineas.push(
    filaCsv([
      'Turno',
      'Cupo máximo',
      'Reservas',
      'Libres',
      'Sin TACC',
      'Sin lactosa',
      'Vegetariano',
      'Vegano',
      'Con comentarios',
    ])
  )

  const turnosExtra = [...porTurno.keys()].filter(
    t => !(TURNOS as readonly string[]).includes(t)
  )
  turnosExtra.sort()

  const ordenTurnosResumen = [...TURNOS, ...turnosExtra]

  for (const turno of ordenTurnosResumen) {
    const b = porTurno.get(turno)!
    const n = b.lista.length
    lineas.push(
      filaCsv([
        turno,
        CUPO_POR_TURNO,
        n,
        Math.max(0, CUPO_POR_TURNO - n),
        b.sinTacc,
        b.sinLactosa,
        b.vegetariano,
        b.vegano,
        b.conComentarios,
      ])
    )
  }

  lineas.push('')
  lineas.push(filaCsv(['DETALLE POR HUÉSPED']))
  lineas.push(
    filaCsv([
      'Turno',
      'Habitación',
      'Nombre',
      'Apellido',
      'Sin TACC',
      'Sin lactosa',
      'Vegetariano',
      'Vegano',
      'Comentarios',
    ])
  )

  const ordenadas = [...reservas].sort((a, b) =>
    a.turno === b.turno
      ? a.apellido.localeCompare(b.apellido, 'es') ||
          a.nombre.localeCompare(b.nombre, 'es')
      : a.turno.localeCompare(b.turno)
  )

  for (const r of ordenadas) {
    lineas.push(
      filaCsv([
        r.turno,
        r.habitacion,
        r.nombre,
        r.apellido,
        r.sinTacc ? 'Sí' : 'No',
        r.sinLactosa ? 'Sí' : 'No',
        r.vegetariano ? 'Sí' : 'No',
        r.vegano ? 'Sí' : 'No',
        r.comentarios ?? '',
      ])
    )
  }

  const cuerpo = lineas.join('\r\n')
  return `\ufeff${cuerpo}`
}
