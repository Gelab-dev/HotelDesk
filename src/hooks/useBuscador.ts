import { useState } from 'react'
import { Reserva } from '@/types'
import { parseJsonIfOk } from '@/lib/parse-json-response'

type BuscarResponse = { reservas?: Reserva[] }

export function useBuscador() {
  const [habitacion, setHabitacion] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fecha, setFecha] = useState('')
  const [resultados, setResultados] = useState<Reserva[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')

  const buscar = async () => {
    if (!habitacion && !nombre && !apellido && !fecha) {
      setError('Ingresá al menos un criterio de búsqueda.')
      return
    }
    setError('')
    setBuscando(true)
    try {
      const params = new URLSearchParams()
      if (habitacion) params.set('habitacion', habitacion)
      if (nombre) params.set('nombre', nombre)
      if (apellido) params.set('apellido', apellido)
      if (fecha) params.set('fecha', fecha)
      const res = await fetch(`/api/buscar?${params}`)
      const data = await parseJsonIfOk<BuscarResponse>(res)
      setResultados(data.reservas ?? [])
    } catch (e) {
      setResultados(null)
      setError(e instanceof Error ? e.message : 'No se pudo completar la búsqueda.')
    } finally {
      setBuscando(false)
    }
  }

  const limpiar = () => {
    setHabitacion('')
    setNombre('')
    setApellido('')
    setFecha('')
    setResultados(null)
    setError('')
  }

  return {
    habitacion,
    setHabitacion,
    nombre,
    setNombre,
    apellido,
    setApellido,
    fecha,
    setFecha,
    resultados,
    buscando,
    error,
    buscar,
    limpiar,
  }
}
