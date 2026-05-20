import { useState, useEffect } from 'react'
import { HuespedVerificado } from '@/types'
import { parseJsonIfOk } from '@/lib/parse-json-response'

const DEBOUNCE_MS = 800

function esAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err instanceof Error && err.name === 'AbortError') return true
  return false
}

export function useVerificarHuesped(
  habitacion: string,
  nombre: string,
  apellido: string,
  fecha: string
) {
  const [huesped, setHuesped] = useState<HuespedVerificado | null>(null)
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    if (!habitacion || !nombre || !apellido || !fecha) {
      void Promise.resolve().then(() => {
        setHuesped(null)
        setVerificando(false)
      })
      return
    }

    const ac = new AbortController()
    const params = new URLSearchParams({
      habitacion,
      nombre,
      apellido,
      fecha,
    })
    const url = `/api/verificar?${params.toString()}`

    const timer = setTimeout(() => {
      setVerificando(true)
      fetch(url, { signal: ac.signal })
        .then(res => parseJsonIfOk<HuespedVerificado>(res))
        .then(d => setHuesped(d))
        .catch(err => {
          if (esAbortError(err)) return
          setHuesped({
            valido: false,
            mensaje: err instanceof Error ? err.message : 'No se pudo verificar',
          })
        })
        .finally(() => setVerificando(false))
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      ac.abort()
    }
  }, [habitacion, nombre, apellido, fecha])

  return { huesped, verificando }
}
