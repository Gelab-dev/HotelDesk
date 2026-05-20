/**
 * Parsea el cuerpo JSON de una Response y valida status HTTP.
 * Útil en el cliente para tratar errores de API de forma uniforme.
 */
export async function parseJsonIfOk<T>(res: Response): Promise<T> {
  let data: unknown
  try {
    data = await res.json()
  } catch {
    if (!res.ok) {
      throw new Error(`Solicitud fallida (${res.status})`)
    }
    throw new Error('La respuesta del servidor no es JSON válido')
  }

  if (!res.ok) {
    const message =
      data !== null &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Solicitud fallida (${res.status})`
    throw new Error(message)
  }

  return data as T
}
