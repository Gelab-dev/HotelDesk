export type ErrorFilaImportacion = { fila: number; mensaje: string }

export type ResultadoImportacionGrupos = {
  creadas: number
  duplicadasOmitidas: number
  filasVacias: number
  filasTotalesDatos: number
  errores: ErrorFilaImportacion[]
}

