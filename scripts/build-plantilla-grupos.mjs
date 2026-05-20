/**
 * Genera public/plantilla-grupos.xlsx con encabezados y una fila de ejemplo.
 * Ejecutar tras clonar el repo o al cambiar el formato: npm run plantilla-grupos
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import xlsx from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const outPath = path.join(repoRoot, 'public', 'plantilla-grupos.xlsx')

fs.mkdirSync(path.dirname(outPath), { recursive: true })

const datos = [
  [
    'habitación',
    'nombre',
    'apellido',
    'fecha',
    'turno',
    'sin_tacc',
    'sin_lactosa',
    'vegetariano',
    'vegano',
    'comentarios',
  ],
  [
    '304',
    'Juan',
    'Pérez',
    '2026-05-22',
    '07:30',
    'No',
    'No',
    'No',
    'No',
    'Borrar esta fila o reemplazar con datos reales.',
  ],
]

const ws = xlsx.utils.aoa_to_sheet(datos)
ws['!cols'] = [
  { wch: 12 },
  { wch: 14 },
  { wch: 14 },
  { wch: 12 },
  { wch: 8 },
  { wch: 10 },
  { wch: 11 },
  { wch: 12 },
  { wch: 8 },
  { wch: 40 },
]

const wb = xlsx.utils.book_new()
xlsx.utils.book_append_sheet(wb, ws, 'Reservas')
xlsx.writeFile(wb, outPath)

console.log('Escrito:', outPath)
