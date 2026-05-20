import { useState, useEffect } from 'react'
import { Disponibilidad } from '@/types'
import { parseJsonIfOk } from '@/lib/parse-json-response'

type DisponibilidadResponse = { disponibilidad?: Disponibilidad[] }

export function useDisponibilidad(fecha: string) {
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fecha) {
      void Promise.resolve().then(() => {
        setDisponibilidad([])
        setLoading(false)
      })
      return
    }

    let activo = true
    void (async () => {
      await Promise.resolve()
      if (!activo) return
      setLoading(true)
      setDisponibilidad([])
      try {
        const res = await fetch(
          `/api/disponibilidad?fecha=${encodeURIComponent(fecha)}`
        )
        const d = await parseJsonIfOk<DisponibilidadResponse>(res)
        if (activo) setDisponibilidad(d.disponibilidad ?? [])
      } catch {
        if (activo) setDisponibilidad([])
      } finally {
        if (activo) setLoading(false)
      }
    })()

    return () => {
      activo = false
    }
  }, [fecha])

  return { disponibilidad, loading }
}
