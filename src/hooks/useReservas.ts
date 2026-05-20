import { useState, useEffect, useCallback } from 'react'
import { Reserva } from '@/types'
import { parseJsonIfOk } from '@/lib/parse-json-response'

type ReservasResponse = { reservas?: Reserva[] }

async function fetchReservasPorFecha(fecha: string): Promise<Reserva[]> {
  const res = await fetch(
    `/api/reservas?fecha=${encodeURIComponent(fecha)}`
  )
  const data = await parseJsonIfOk<ReservasResponse>(res)
  return data.reservas ?? []
}

export function useReservas(fecha: string) {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(false)

  const recargar = useCallback(async () => {
    if (!fecha) {
      setReservas([])
      return
    }
    setLoading(true)
    try {
      setReservas(await fetchReservasPorFecha(fecha))
    } catch {
      setReservas([])
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => {
    if (!fecha) {
      void Promise.resolve().then(() => setReservas([]))
      return
    }
    let activo = true
    void (async () => {
      await Promise.resolve()
      if (!activo) return
      setLoading(true)
      try {
        const list = await fetchReservasPorFecha(fecha)
        if (activo) setReservas(list)
      } catch {
        if (activo) setReservas([])
      } finally {
        if (activo) setLoading(false)
      }
    })()
    return () => {
      activo = false
    }
  }, [fecha])

  return { reservas, loading, recargar }
}
