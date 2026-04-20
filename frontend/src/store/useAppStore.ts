import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../config/appConfig'
import {
  leerStorage,
  mezclarRecursosConIniciales,
  normalizarEntrenadores,
  normalizarJugadores,
  normalizarPermisos,
  normalizarRecursos,
} from '../lib/appHelpers'
import {
  entrenadoresIniciales,
  jugadoresIniciales,
  permisosIniciales,
  recursosIniciales,
  sedesIniciales,
  sesionesIniciales,
} from '../data/appSeeds'
import { normalizarSeguimientos } from '../modules/player-development/utils'
import type {
  Entrenador,
  FeedbackSesion,
  Jugador,
  PermisoUsuario,
  Recurso,
  Sede,
  SeguimientoJugador,
  SesionCalendario,
} from '../types/app'

export function useAppStore() {
  const [jugadores, setJugadores] = useState<Jugador[]>(() =>
    normalizarJugadores(leerStorage<Jugador[]>(STORAGE_KEYS.jugadores, [])),
  )

  const [recursos, setRecursos] = useState<Recurso[]>(() =>
    mezclarRecursosConIniciales(leerStorage<Recurso[]>(STORAGE_KEYS.recursos, recursosIniciales)),
  )

  const [entrenadores, setEntrenadores] = useState<Entrenador[]>(() =>
    normalizarEntrenadores(leerStorage<Entrenador[]>(STORAGE_KEYS.entrenadores, [])),
  )

  const [sesiones, setSesiones] = useState<SesionCalendario[]>(() =>
    leerStorage<SesionCalendario[]>(STORAGE_KEYS.sesiones, sesionesIniciales),
  )

  const [feedbackSesiones, setFeedbackSesiones] = useState<FeedbackSesion[]>(() =>
    leerStorage<FeedbackSesion[]>(STORAGE_KEYS.feedbackSesiones, []),
  )

  const [seguimientosJugadores, setSeguimientosJugadores] = useState<SeguimientoJugador[]>(() =>
    normalizarSeguimientos(
      leerStorage<SeguimientoJugador[]>(STORAGE_KEYS.seguimientosJugadores, []),
      normalizarJugadores(leerStorage<Jugador[]>(STORAGE_KEYS.jugadores, jugadoresIniciales)),
    ),
  )

  const [permisos, setPermisos] = useState<PermisoUsuario[]>(() =>
    normalizarPermisos(leerStorage<PermisoUsuario[]>(STORAGE_KEYS.permisos, permisosIniciales)),
  )

  const [sedes, setSedes] = useState<Sede[]>(() =>
    leerStorage<Sede[]>(STORAGE_KEYS.sedes, sedesIniciales),
  )

  const [jugadorActivoId, setJugadorActivoId] = useState<number>(() => {
    const guardados = normalizarJugadores(leerStorage<Jugador[]>(STORAGE_KEYS.jugadores, jugadoresIniciales))
    return guardados[0]?.id ?? 0
  })

  const [entrenadorActivoId, setEntrenadorActivoId] = useState<number>(() => {
    const guardados = normalizarEntrenadores(leerStorage<Entrenador[]>(STORAGE_KEYS.entrenadores, entrenadoresIniciales))
    return guardados[0]?.id ?? 0
  })

  // Normalización en montaje
  useEffect(() => {
    setRecursos((prev) => normalizarRecursos(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia en localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.jugadores, JSON.stringify(jugadores)) }, [jugadores])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.recursos, JSON.stringify(recursos)) }, [recursos])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.entrenadores, JSON.stringify(entrenadores)) }, [entrenadores])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.sesiones, JSON.stringify(sesiones)) }, [sesiones])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.feedbackSesiones, JSON.stringify(feedbackSesiones)) }, [feedbackSesiones])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.seguimientosJugadores, JSON.stringify(seguimientosJugadores)) }, [seguimientosJugadores])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.permisos, JSON.stringify(permisos)) }, [permisos])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.sedes, JSON.stringify(sedes)) }, [sedes])

  // Sincronizar seguimientos cuando cambian los jugadores
  useEffect(() => {
    setSeguimientosJugadores((prev) => normalizarSeguimientos(prev, jugadores))
  }, [jugadores])

  // Guardar jugador activo válido
  useEffect(() => {
    if (jugadores.length === 0) { setJugadorActivoId(0); return }
    if (!jugadores.some((j) => j.id === jugadorActivoId)) {
      setJugadorActivoId(jugadores[0].id)
    }
  }, [jugadorActivoId, jugadores])

  // Guardar entrenador activo válido
  useEffect(() => {
    if (entrenadores.length === 0) { setEntrenadorActivoId(0); return }
    if (!entrenadores.some((e) => e.id === entrenadorActivoId)) {
      setEntrenadorActivoId(entrenadores[0].id)
    }
  }, [entrenadorActivoId, entrenadores])

  return {
    jugadores, setJugadores,
    recursos, setRecursos,
    entrenadores, setEntrenadores,
    sesiones, setSesiones,
    feedbackSesiones, setFeedbackSesiones,
    seguimientosJugadores, setSeguimientosJugadores,
    permisos, setPermisos,
    sedes, setSedes,
    jugadorActivoId, setJugadorActivoId,
    entrenadorActivoId, setEntrenadorActivoId,
  }
}
