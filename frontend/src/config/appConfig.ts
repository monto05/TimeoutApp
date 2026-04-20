import type { BloqueRecurso, GrupoRecurso, NivelRecurso, PosicionRecurso } from '../types/app'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')

export const API_STATE_URL = `${API_BASE_URL}/api/state`
export const API_SESIONES_URL = `${API_BASE_URL}/api/sesiones`
export const API_JUGADORES_URL = `${API_BASE_URL}/api/jugadores`
export const API_ADMIN_URL = `${API_BASE_URL}/api/admin-data`
export const API_AI_SUGERIR_OBJETIVO_URL = `${API_BASE_URL}/api/ai/sugerir-objetivo`
export const API_SYNC_DEBOUNCE_MS = 900
export const API_POLL_INTERVAL_MS = 1500

export const STORAGE_KEYS = {
  jugadores: 'timeout_app_jugadores',
  recursos: 'timeout_app_recursos',
  entrenadores: 'timeout_app_entrenadores',
  sesiones: 'timeout_app_sesiones',
  feedbackSesiones: 'timeout_app_feedback_sesiones',
  seguimientosJugadores: 'timeout_app_seguimientos_jugadores',
  permisos: 'timeout_app_permisos',
  sedes: 'timeout_app_sedes',
  entrenadoresNoDisponibles: 'timeout_app_entrenadores_no_disponibles',
} as const

export const LEVELS: { key: string; threshold: number }[] = [
  { key: 'Skills (Bronce)', threshold: 0 },
  { key: 'Game Skills (Plata)', threshold: 100 },
  { key: 'Game Action (Azul)', threshold: 400 },
  { key: 'Player To Go (Oro)', threshold: 1200 },
]

export const PASSWORD_INICIAL = 'timeout123'
export const posicionesRecurso: PosicionRecurso[] = ['Base', 'Escolta', 'Alero', 'Ala Pívot', 'Pívot']
export const nivelesRecurso: NivelRecurso[] = ['Bronce', 'Plata', 'Azul', 'Oro']
export const gruposRecurso: GrupoRecurso[] = ['Recursos', 'Dificultades', 'Handicaps', 'Sesión']
export const bloquesRecurso: BloqueRecurso[] = ['Técnica']