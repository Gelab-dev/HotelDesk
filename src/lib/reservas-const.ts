/** Constantes y helpers compartidos (cliente/servidor). */
export const CUPO_POR_TURNO = 24

export const TURNOS = ['07:30', '08:30', '09:30'] as const

export type TurnoReserva = (typeof TURNOS)[number]

export function esTurnoValido(turno: string): turno is TurnoReserva {
  return (TURNOS as readonly string[]).includes(turno)
}

