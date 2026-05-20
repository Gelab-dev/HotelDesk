'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import styles from './PanelAdmin.module.css'
import { Reserva } from '@/types'
import { useReservas } from '@/hooks/useReservas'
import { useBuscador } from '@/hooks/useBuscador'
import { parseJsonIfOk } from '@/lib/parse-json-response'
import { CUPO_POR_TURNO, TURNOS } from '@/services/reservas.service'
import type { ResultadoImportacionGrupos } from '@/services/grupos.service'

const formatFecha = (date: Date) =>
  date.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

const toDateKey = (date: Date) => date.toISOString().split('T')[0]

interface TurnoStats {
  turno: string
  reservas: Reserva[]
  sinTacc: number
  sinLactosa: number
  vegetariano: number
  comentarios: Reserva[]
}

export default function PanelAdmin() {
  const [fecha, setFecha]           = useState(new Date())
  const [bloqueado, setBloqueado]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'turnos' | 'buscar'>('turnos')
  const [modalTurno, setModalTurno] = useState<TurnoStats | null>(null)
  const [mensajeLista, setMensajeLista] = useState('')
  const [importandoGrupos, setImportandoGrupos] = useState(false)
  const archivoGruposRef = useRef<HTMLInputElement>(null)

  const { reservas, loading, recargar } = useReservas(toDateKey(fecha))
  const buscador = useBuscador()

  useEffect(() => {
    let cancelado = false
    void fetch('/api/configuracion')
      .then(r => parseJsonIfOk<{ bloqueado?: boolean }>(r))
      .then(d => {
        if (!cancelado) setBloqueado(Boolean(d.bloqueado))
      })
      .catch(() => {
        if (!cancelado) setBloqueado(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!mensajeLista) return
    const t = setTimeout(() => setMensajeLista(''), 7000)
    return () => clearTimeout(t)
  }, [mensajeLista])

  const cambiarFecha = (dias: number) => {
    setFecha(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dias)
      return d
    })
  }

  const toggleBloqueo = async () => {
    const nuevo = !bloqueado
    setBloqueado(nuevo)
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloqueado: nuevo }),
      })
      await parseJsonIfOk<{ bloqueado: boolean }>(res)
    } catch (e) {
      setBloqueado(!nuevo)
      setMensajeLista(
        e instanceof Error ? e.message : 'No se pudo actualizar el bloqueo de reservas.'
      )
    }
  }

  const exportarReporteCsv = () => {
    const key = encodeURIComponent(toDateKey(fecha))
    window.location.assign(`/api/reporte?fecha=${key}`)
  }

  const abrirSelectorExcelGrupos = () => {
    archivoGruposRef.current?.click()
  }

  const procesarExcelGrupos = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file || importandoGrupos) return

    setImportandoGrupos(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/grupos', { method: 'POST', body: fd })
      const resultado = await parseJsonIfOk<ResultadoImportacionGrupos>(res)

      const partes = [
        `Creadas: ${resultado.creadas}`,
        resultado.duplicadasOmitidas
          ? `Duplicadas (omitidas): ${resultado.duplicadasOmitidas}`
          : null,
        resultado.filasVacias > 0
          ? `Filas vacías: ${resultado.filasVacias}`
          : null,
      ].filter(Boolean) as string[]

      let msg = partes.join(' · ')

      if (resultado.errores.length > 0) {
        msg += `. Problemas en ${resultado.errores.length} fila(s): `
        msg += resultado.errores
          .slice(0, 8)
          .map(er => `#${er.fila}: ${er.mensaje}`)
          .join(' · ')
        if (resultado.errores.length > 8) msg += ` · …(+${resultado.errores.length - 8})`
      }

      setMensajeLista(msg || 'Importación terminada.')

      if (resultado.creadas > 0) recargar()
    } catch (err) {
      setMensajeLista(
        err instanceof Error ? err.message : 'No se pudo importar la planilla.'
      )
    } finally {
      setImportandoGrupos(false)
    }
  }

  const eliminarReserva = async (id: string) => {
    if (!confirm('¿Eliminás esta reserva?')) return
    try {
      const res = await fetch(`/api/reservas/${id}`, { method: 'DELETE' })
      await parseJsonIfOk<{ ok?: boolean }>(res)
      recargar()
      if (modalTurno) {
        setModalTurno(prev =>
          prev
            ? { ...prev, reservas: prev.reservas.filter(r => r.id !== id) }
            : null
        )
      }
    } catch (e) {
      setMensajeLista(
        e instanceof Error ? e.message : 'No se pudo eliminar la reserva.'
      )
    }
  }

  const getTurnoStats = (turno: string): TurnoStats => {
    const rs = reservas.filter(r => r.turno === turno)
    return {
      turno,
      reservas: rs,
      sinTacc:     rs.filter(r => r.sinTacc).length,
      sinLactosa:  rs.filter(r => r.sinLactosa).length,
      vegetariano: rs.filter(r => r.vegetariano || r.vegano).length,
      comentarios: rs.filter(r => r.comentarios),
    }
  }

  const getBadgeClass = (ocupados: number) => {
    const pct = ocupados / CUPO_POR_TURNO
    if (pct >= 1)   return styles.badgeRed
    if (pct >= 0.7) return styles.badgeAmber
    return styles.badgeGreen
  }

  const totalDia         = reservas.length
  const totalTacc        = reservas.filter(r => r.sinTacc).length
  const totalLact        = reservas.filter(r => r.sinLactosa).length
  const totalComentarios = reservas.filter(r => r.comentarios).length

  return (
    <div className={styles.wrap}>

      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>🍽️</div>
          <div>
            <div className={styles.brandName}>Panel de administración</div>
            <div className={styles.brandSub}>HotelDesk — recepción</div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <input
            ref={archivoGruposRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className={styles.visuallyHidden}
            onChange={procesarExcelGrupos}
            aria-label="Importar varias reservas desde archivo Excel (.xlsx o .xls)"
          />
          <button
            type="button"
            className={styles.btn}
            onClick={exportarReporteCsv}
            disabled={loading}
          >
            📄 Exportar reporte
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={abrirSelectorExcelGrupos}
            disabled={loading || importandoGrupos}
          >
            {importandoGrupos ? '📤 Importando…' : '📤 Carga masiva'}
          </button>
          <a
            href="/plantilla-grupos.xlsx"
            download="plantilla-grupos-hoteldesk.xlsx"
            className={styles.plantillaLink}
          >
            Plantilla Excel →
          </a>
        </div>
      </header>

      <div className={styles.body}>

        {mensajeLista && (
          <div className={styles.inlineAlert} role="alert">
            <span>{mensajeLista}</span>
            <button
              type="button"
              className={styles.inlineAlertClose}
              aria-label="Cerrar mensaje"
              onClick={() => setMensajeLista('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Topbar fecha + bloqueo */}
        <div className={styles.topbar}>
          <div className={styles.dateNav}>
            <button className={styles.navBtn} onClick={() => cambiarFecha(-1)}>‹</button>
            <div className={styles.dateDisplay}>
              📅 {formatFecha(fecha)}
            </div>
            <button className={styles.navBtn} onClick={() => cambiarFecha(1)}>›</button>
          </div>
          <div
            className={`${styles.lockToggle} ${bloqueado ? styles.locked : ''}`}
            onClick={toggleBloqueo}
          >
            {bloqueado ? '🔒' : '🔓'} Bloquear reservas
            <div className={`${styles.toggle} ${bloqueado ? styles.on : ''}`}>
              <div className={styles.toggleThumb} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Total del día</div>
            <div className={styles.statVal}>{totalDia}</div>
            <div className={styles.statSub}>de {CUPO_POR_TURNO * 3} cupos</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Sin TACC</div>
            <div className={styles.statVal} style={{ color: '#BA7517' }}>{totalTacc}</div>
            <div className={styles.statSub}>personas</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Sin lactosa</div>
            <div className={styles.statVal} style={{ color: '#1D9E75' }}>{totalLact}</div>
            <div className={styles.statSub}>personas</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Con comentarios</div>
            <div className={styles.statVal}>{totalComentarios}</div>
            <div className={styles.statSub}>ver detalle</div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className={styles.tabs}>
            <div
              className={`${styles.tab} ${activeTab === 'turnos' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('turnos')}
            >
              Turnos del día
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'buscar' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('buscar')}
            >
              Buscador
            </div>
          </div>

          <div className={styles.tabContent}>

            {/* TURNOS */}
            {activeTab === 'turnos' && (
              loading ? (
                <div className={styles.empty}>Cargando reservas...</div>
              ) : (
                <div className={styles.turnosGrid}>
                  {TURNOS.map(t => {
                    const stats = getTurnoStats(t)
                    const ocupados = stats.reservas.length
                    return (
                      <div key={t} className={styles.turnoCard} onClick={() => setModalTurno(stats)}>
                        <div className={styles.turnoCardHeader}>
                          <span className={styles.turnoCardTime}>🕐 {t} hs</span>
                          <span className={`${styles.badge} ${getBadgeClass(ocupados)}`}>
                            {ocupados} / {CUPO_POR_TURNO}
                          </span>
                        </div>
                        <div className={styles.turnoCardBody}>
                          <div className={styles.turnoStat}>
                            <span className={styles.turnoStatLabel}>Personas</span>
                            <span className={styles.turnoStatVal}>{ocupados}</span>
                          </div>
                          <div className={styles.divider} />
                          <div className={styles.restrictions}>
                            <div className={styles.restrictionRow}>
                              <span className={styles.restrictionLabel}>Sin TACC</span>
                              <span className={`${styles.restrictionVal} ${styles.cTacc}`}>
                                {stats.sinTacc > 0 ? `${stats.sinTacc} personas` : '—'}
                              </span>
                            </div>
                            <div className={styles.restrictionRow}>
                              <span className={styles.restrictionLabel}>Sin lactosa</span>
                              <span className={`${styles.restrictionVal} ${styles.cLact}`}>
                                {stats.sinLactosa > 0 ? `${stats.sinLactosa} personas` : '—'}
                              </span>
                            </div>
                            <div className={styles.restrictionRow}>
                              <span className={styles.restrictionLabel}>Vegetariano/vegano</span>
                              <span className={`${styles.restrictionVal} ${styles.cVeg}`}>
                                {stats.vegetariano > 0 ? `${stats.vegetariano} personas` : '—'}
                              </span>
                            </div>
                          </div>
                          {stats.comentarios.length > 0 && (
                            <div className={styles.comment}>
                              💬 {stats.comentarios[0].comentarios}
                              {stats.comentarios.length > 1 && ` (+${stats.comentarios.length - 1} más)`}
                            </div>
                          )}
                        </div>
                        <div className={styles.turnoCardFooter}>
                          <span className={styles.verLink}>Ver huéspedes →</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* BUSCADOR */}
            {activeTab === 'buscar' && (
              <div className={styles.searchWrap}>
                <div className={styles.searchBar}>
                  <div className={styles.searchGroup}>
                    <label className={styles.searchLabel}>Habitación</label>
                    <input
                      className={styles.searchInput}
                      value={buscador.habitacion}
                      onChange={e => buscador.setHabitacion(e.target.value)}
                      placeholder="Ej: 304"
                    />
                  </div>
                  <div className={styles.searchGroup}>
                    <label className={styles.searchLabel}>Nombre</label>
                    <input
                      className={styles.searchInput}
                      value={buscador.nombre}
                      onChange={e => buscador.setNombre(e.target.value)}
                      placeholder="Ej: Juan Cruz"
                    />
                  </div>
                  <div className={styles.searchGroup}>
                    <label className={styles.searchLabel}>Apellido</label>
                    <input
                      className={styles.searchInput}
                      value={buscador.apellido}
                      onChange={e => buscador.setApellido(e.target.value)}
                      placeholder="Ej: Gelabert"
                    />
                  </div>
                  <div className={styles.searchGroup}>
                    <label className={styles.searchLabel}>Fecha</label>
                    <input
                      type="date"
                      className={styles.searchInput}
                      value={buscador.fecha}
                      onChange={e => buscador.setFecha(e.target.value)}
                    />
                  </div>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={buscador.buscar}
                    disabled={buscador.buscando}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {buscador.buscando ? '...' : '🔍 Buscar'}
                  </button>
                  {buscador.resultados && (
                    <button
                      className={styles.btn}
                      onClick={buscador.limpiar}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {buscador.error && (
                  <div className={styles.searchResultEmpty}>{buscador.error}</div>
                )}

                {buscador.resultados !== null && (
                  <div className={styles.searchResults}>
                    {buscador.resultados.length === 0 ? (
                      <div className={styles.searchResultEmpty}>
                        No se encontraron reservas con esos criterios.
                      </div>
                    ) : (
                      <>
                        <div className={styles.searchResultHeader}>
                          ✓ {buscador.resultados.length} reserva{buscador.resultados.length !== 1 ? 's' : ''} encontrada{buscador.resultados.length !== 1 ? 's' : ''}
                        </div>
                        {buscador.resultados.map(r => (
                          <div key={r.id} className={styles.resultRow}>
                            <div className={styles.resultField}>
                              <span className={styles.resultLabel}>Huésped</span>
                              <span className={styles.resultVal}>{r.apellido}, {r.nombre}</span>
                            </div>
                            <div className={styles.resultField}>
                              <span className={styles.resultLabel}>Habitación</span>
                              <span className={styles.resultVal}>{r.habitacion}</span>
                            </div>
                            <div className={styles.resultField}>
                              <span className={styles.resultLabel}>Turno</span>
                              <span className={styles.resultVal} style={{ color: 'var(--blue)' }}>
                                {r.turno} hs
                              </span>
                            </div>
                            <div className={styles.resultField}>
                              <span className={styles.resultLabel}>Fecha</span>
                              <span className={styles.resultVal}>
                                {new Date(r.fecha).toLocaleDateString('es-AR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL detalle turno */}
      {modalTurno && (
        <div className={styles.modalOverlay} onClick={() => setModalTurno(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                🕐 Turno {modalTurno.turno} hs — huéspedes
              </div>
              <div className={styles.closeBtn} onClick={() => setModalTurno(null)}>✕</div>
            </div>
            <div className={styles.modalSub}>
              <span className={styles.modalMeta}>👥 {modalTurno.reservas.length} personas</span>
              {modalTurno.sinTacc > 0 && (
                <span className={styles.modalMeta} style={{ color: '#BA7517' }}>
                  🌾 {modalTurno.sinTacc} sin TACC
                </span>
              )}
              {modalTurno.sinLactosa > 0 && (
                <span className={styles.modalMeta} style={{ color: '#1D9E75' }}>
                  🥛 {modalTurno.sinLactosa} sin lactosa
                </span>
              )}
            </div>
            <div className={styles.reservaList}>
              {modalTurno.reservas.length === 0 ? (
                <div className={styles.empty}>Sin reservas para este turno.</div>
              ) : (
                modalTurno.reservas.map(r => (
                  <div key={r.id} className={styles.reservaRow}>
                    <div>
                      <div className={styles.reservaName}>{r.apellido}, {r.nombre} — hab. {r.habitacion}</div>
                      <div className={styles.reservaDet}>
                        {[
                          r.sinTacc && 'Sin TACC',
                          r.sinLactosa && 'Sin lactosa',
                          r.vegetariano && 'Vegetariano',
                          r.vegano && 'Vegano',
                        ].filter(Boolean).join(' · ') || 'Sin restricciones'}
                        {r.comentarios && ` · "${r.comentarios}"`}
                      </div>
                    </div>
                    <div className={styles.reservaActions}>
                      <button
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                        onClick={() => eliminarReserva(r.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}