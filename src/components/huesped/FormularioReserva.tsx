'use client'

import { useState } from 'react'
import styles from './FormularioReserva.module.css'
import { useVerificarHuesped } from '@/hooks/useVerificarHuesped'
import { useDisponibilidad } from '@/hooks/useDisponibilidad'
import { parseJsonIfOk } from '@/lib/parse-json-response'

type PostReservaResponse = {
  existe: boolean
  reserva: { id: string; turno: string }
}

type PutReservaResponse = {
  reserva: { turno?: string }
}

type Restricciones = {
  sinTacc: boolean
  sinLactosa: boolean
  vegetariano: boolean
  vegano: boolean
}

const TURNOS = ['07:30', '08:30', '09:30']

const RESTRICCIONES: { key: keyof Restricciones; label: string }[] = [
  { key: 'sinTacc',     label: 'Sin TACC' },
  { key: 'sinLactosa',  label: 'Sin lactosa' },
  { key: 'vegetariano', label: 'Vegetariano' },
  { key: 'vegano',      label: 'Vegano' },
]

const LANGS = ['ES', 'EN', 'PT', 'FR']

const getTomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function FormularioReserva({ bloqueado }: { bloqueado: boolean }) {
  const [lang, setLang]         = useState('ES')
  const [habitacion, setHabitacion] = useState('')
  const [nombre,     setNombre]     = useState('')
  const [apellido,   setApellido]   = useState('')
  const [fecha,      setFecha]      = useState(getTomorrow)
  const [turno,      setTurno]      = useState('')

  const [restricciones, setRestricciones] = useState<Restricciones>({
    sinTacc: false, sinLactosa: false, vegetariano: false, vegano: false,
  })
  const [comentarios, setComentarios] = useState('')
  const [reservaExistente, setReservaExistente] = useState<{ id: string; turno: string } | null>(null)
  const [modificando, setModificando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<{ turno: string } | null>(null)
  const [mensajeApi, setMensajeApi] = useState('')

  const { huesped, verificando }   = useVerificarHuesped(habitacion, nombre, apellido, fecha)
  const { disponibilidad, loading: cuposCargando } = useDisponibilidad(fecha)

  const toggleRestriccion = (key: keyof Restricciones) => {
    setRestricciones(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async () => {
    if (!huesped?.valido || !turno || enviando || bloqueado) return
    setMensajeApi('')
    setEnviando(true)
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitacion,
          nombre,
          apellido,
          fecha,
          turno,
          ...restricciones,
          comentarios,
        }),
      })
      const data = await parseJsonIfOk<PostReservaResponse>(res)

      if (data.existe) {
        setReservaExistente({
          id: data.reserva.id,
          turno: data.reserva.turno,
        })
        return
      }

      setModificando(false)
      setExito({ turno })
    } catch (e) {
      setMensajeApi(
        e instanceof Error ? e.message : 'No se pudo confirmar la reserva.'
      )
    } finally {
      setEnviando(false)
    }
  }

  const handleModificar = async () => {
    if (!reservaExistente || !turno || enviando) return
    setMensajeApi('')
    if (turno === reservaExistente.turno) {
      setMensajeApi('Elegí un turno distinto al actual para poder modificar.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/reservas/${reservaExistente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno, ...restricciones, comentarios }),
      })
      const data = await parseJsonIfOk<PutReservaResponse>(res)
      if (!data.reserva) {
        setMensajeApi('No hubo cambios guardados.')
        return
      }
      setModificando(true)
      setExito({ turno })
      setReservaExistente(null)
    } catch (e) {
      setMensajeApi(
        e instanceof Error ? e.message : 'No se pudo modificar la reserva.'
      )
    } finally {
      setEnviando(false)
    }
  }

  if (exito) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>
              {modificando ? '¡Reserva modificada!' : '¡Reserva confirmada!'}
            </div>
            <div className={styles.successDetail}>
              Tu turno de desayuno para el{' '}
              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })} es:
            </div>
            <div className={styles.successBadge}>{exito.turno} hs</div>
            <div className={styles.successDetail}>
              Habitación {habitacion} · {nombre} {apellido}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        {bloqueado && (
          <div className={styles.blocked}>
            🔒 Reservas bloqueadas temporalmente. Contactá a recepción.
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.logo}>☕</div>
            <div>
              <div className={styles.brandName}>Desayunos</div>
              <div className={styles.brandSub}>Reservá tu turno</div>
            </div>
          </div>
          <div className={styles.langs}>
            {LANGS.map(l => (
              <button
                key={l}
                className={`${styles.lang} ${lang === l ? styles.langActive : ''}`}
                onClick={() => setLang(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            {mensajeApi && (
              <div className={styles.formAlert} role="alert">
                {mensajeApi}
              </div>
            )}

            <div className={styles.group}>
              <label className={styles.label}>🚪 Habitación</label>
              <input
                className={styles.input}
                value={habitacion}
                onChange={e => setHabitacion(e.target.value)}
                placeholder="Ej: 304"
                disabled={bloqueado}
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>📅 Fecha del desayuno</label>
              <input
                type="date"
                className={styles.input}
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                disabled={bloqueado}
                suppressHydrationWarning
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Juan Cruz"
                disabled={bloqueado}
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Apellido</label>
              <input
                className={styles.input}
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder="Gelabert"
                disabled={bloqueado}
              />
            </div>

            {/* Verificación Cloudbeds */}
            {(verificando || huesped) && (
              <div className={`${styles.verifyBox} ${
                verificando ? styles.verifyLoading :
                huesped?.valido ? styles.verifyOk : styles.verifyError
              }`}>
                {verificando && '⏳ Verificando en Cloudbeds...'}
                {!verificando && huesped?.valido && (
                  <>✓ Verificado — {huesped.nombre} {huesped.apellido}, hab. {huesped.habitacion}</>
                )}
                {!verificando && huesped && !huesped.valido && (
                  <>✗ {huesped.mensaje}</>
                )}
              </div>
            )}

            {/* Alerta reserva existente */}
            {reservaExistente && (
              <div className={`${styles.modificarAlert} ${styles.full}`}>
                <div className={styles.modificarTitle}>
                  ⚠ Ya tenés una reserva para este día
                </div>
                <div className={styles.modificarText}>
                  Turno actual: {reservaExistente.turno} hs. ¿Querés cambiar el turno?
                </div>
                <div className={styles.modificarBtns}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleModificar}
                    disabled={!turno || enviando}
                  >
                    Sí, modificar
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => setReservaExistente(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Turnos */}
            <div className={`${styles.group} ${styles.full}`}>
              <label className={styles.label}>🕐 Elegí tu turno</label>
              {cuposCargando && (
                <p className={styles.turnosHint}>Actualizando cupos para la fecha elegida…</p>
              )}
              <div
                className={`${styles.turnos} ${cuposCargando ? styles.turnosCargando : ''}`}
              >
                {TURNOS.map(t => {
                  const disp = disponibilidad.find(d => d.turno === t)
                  const lleno = disp?.lleno ?? false
                  const pct = disp ? (disp.ocupados / 24) * 100 : 0
                  return (
                    <div
                      key={t}
                      className={`${styles.turno} ${turno === t ? styles.turnoSel : ''} ${lleno ? styles.turnoLleno : ''}`}
                      onClick={() =>
                        !cuposCargando && !lleno && !bloqueado && setTurno(t)
                      }
                    >
                      <span className={styles.turnoHora}>{t} hs</span>
                      <span className={styles.turnoCupos}>
                        {cuposCargando
                          ? '…'
                          : lleno
                            ? 'Sin cupos'
                            : `${disp?.disponibles ?? 24} disponibles`}
                      </span>
                      <div className={styles.turnoBar}>
                        <div className={styles.turnoBarFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Restricciones */}
            <div className={`${styles.group} ${styles.full}`}>
              <label className={styles.label}>🥗 Restricciones dietarias</label>
              <div className={styles.checks}>
                {RESTRICCIONES.map(r => (
                  <div
                    key={r.key}
                    className={`${styles.check} ${restricciones[r.key] ? styles.checkSel : ''}`}
                    onClick={() => !bloqueado && toggleRestriccion(r.key)}
                  >
                    <span className={styles.checkDot}>
                      {restricciones[r.key] ? '✓' : ''}
                    </span>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div className={`${styles.group} ${styles.full}`}>
              <label className={styles.label}>Comentarios adicionales</label>
              <textarea
                className={styles.input}
                value={comentarios}
                onChange={e => setComentarios(e.target.value)}
                placeholder="Ej: mesa accesible, alergia a frutos secos..."
                rows={3}
                disabled={bloqueado}
                style={{ resize: 'vertical' }}
              />
            </div>

          </div>

          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={!huesped?.valido || !turno || enviando || bloqueado}
            >
              {enviando ? 'Confirmando...' : 'Confirmar reserva →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}