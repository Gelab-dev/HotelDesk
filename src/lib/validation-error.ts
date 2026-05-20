/**
 * Error de negocio / validación devuelto como 4xx desde rutas API.
 */
export class ValidacionApiError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ValidacionApiError'
    this.status = status
  }
}
