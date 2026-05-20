import { NextResponse } from 'next/server'

/**
 * Lee req.json(); si el cuerpo no es JSON válido devuelve 400 y null.
 */
export async function parseRequestBody<T>(
  req: Request
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = (await req.json()) as T
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'El cuerpo de la solicitud debe ser JSON válido.' },
        { status: 400 }
      ),
    }
  }
}
