/**
 * Genera public/plantilla-grupos.xlsx con encabezados y una fila de ejemplo.
 * Ejecutar tras clonar el repo o al cambiar el formato: npm run plantilla-grupos
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

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

const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('Reservas')

ws.addRows(datos)
ws.columns = [
  { width: 12 },
  { width: 14 },
  { width: 14 },
  { width: 12 },
  { width: 10 },
  { width: 10 },
  { width: 12 },
  { width: 12 },
  { width: 10 },
  { width: 48 },
]

// Encabezados en negrita
ws.getRow(1).font = { bold: true }

await wb.xlsx.writeFile(outPath)

console.log('Escrito:', outPath)
