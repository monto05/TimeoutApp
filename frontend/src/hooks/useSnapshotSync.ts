import { useEffect, useRef, useState } from 'react'
import {
  API_ADMIN_URL,
  API_JUGADORES_URL,
  API_POLL_INTERVAL_MS,
  API_SESIONES_URL,
  API_STATE_URL,
  API_SYNC_DEBOUNCE_MS,
} from '../config/appConfig'
import {
  mezclarRecursosConIniciales,
  normalizarEntrenadores,
  normalizarJugadores,
  normalizarPermisos,
  normalizarSedes,
} from '../lib/appHelpers'
import { normalizarSeguimientos } from '../modules/player-development/utils'
import type {
  Entrenador,
  EstadoRemoto,
  FeedbackSesion,
  Jugador,
  PermisoUsuario,
  Recurso,
  Sede,
  SeguimientoJugador,
  SesionCalendario,
} from '../types/app'

type VersionesLocales = {
  jugadores: number
  recursos: number
  entrenadores: number
  sesiones: number
  feedbackSesiones: number
  seguimientosJugadores: number
  permisos: number
}

type TimestampCambiosLocales = {
  sesiones: number
  feedbackSesiones: number
  jugadores: number
  recursos: number
  entrenadores: number
  seguimientosJugadores: number
  permisos: number
}

type Params = {
  jugadores: Jugador[]
  setJugadores: React.Dispatch<React.SetStateAction<Jugador[]>>
  setJugadorActivoId: React.Dispatch<React.SetStateAction<number>>
  recursos: Recurso[]
  setRecursos: React.Dispatch<React.SetStateAction<Recurso[]>>
  entrenadores: Entrenador[]
  setEntrenadores: React.Dispatch<React.SetStateAction<Entrenador[]>>
  setEntrenadorActivoId: React.Dispatch<React.SetStateAction<number>>
  sesiones: SesionCalendario[]
  setSesiones: React.Dispatch<React.SetStateAction<SesionCalendario[]>>
  feedbackSesiones: FeedbackSesion[]
  setFeedbackSesiones: React.Dispatch<React.SetStateAction<FeedbackSesion[]>>
  seguimientosJugadores: SeguimientoJugador[]
  setSeguimientosJugadores: React.Dispatch<React.SetStateAction<SeguimientoJugador[]>>
  permisos: PermisoUsuario[]
  setPermisos: React.Dispatch<React.SetStateAction<PermisoUsuario[]>>
  sedes: Sede[]
  setSedes: React.Dispatch<React.SetStateAction<Sede[]>>
}

export function useSnapshotSync({
  jugadores,
  setJugadores,
  setJugadorActivoId,
  recursos,
  setRecursos,
  entrenadores,
  setEntrenadores,
  setEntrenadorActivoId,
  sesiones,
  setSesiones,
  feedbackSesiones,
  setFeedbackSesiones,
  seguimientosJugadores,
  setSeguimientosJugadores,
  permisos,
  setPermisos,
  sedes,
  setSedes,
}: Params) {
  const [estadoRemotoCargado, setEstadoRemotoCargado] = useState(false)
  const omitirPrimerGuardadoRemoto = useRef(true)
  const ultimoUpdatedAtRemoto = useRef<string | null>(null)
  const versionesLocales = useRef<VersionesLocales>({
    jugadores: 0,
    recursos: 0,
    entrenadores: 0,
    sesiones: 0,
    feedbackSesiones: 0,
    seguimientosJugadores: 0,
    permisos: 0,
  })
  const timestampCambiosLocales = useRef<TimestampCambiosLocales>({
    sesiones: 0,
    feedbackSesiones: 0,
    jugadores: 0,
    recursos: 0,
    entrenadores: 0,
    seguimientosJugadores: 0,
    permisos: 0,
  })

  const guardarSesionesInmediatamente = async (nuevasSesiones: SesionCalendario[], nuevosFeedback: FeedbackSesion[]) => {
    timestampCambiosLocales.current.sesiones = Date.now()
    timestampCambiosLocales.current.feedbackSesiones = Date.now()

    if (!estadoRemotoCargado) {
      return
    }

    try {
      const respuesta = await fetch(API_SESIONES_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sesiones: nuevasSesiones,
          feedbackSesiones: nuevosFeedback,
        }),
      })

      if (!respuesta.ok) {
        return
      }

      const payload = (await respuesta.json()) as { updatedAt?: string; versions?: Record<string, number> }

      if (typeof payload.updatedAt === 'string') {
        ultimoUpdatedAtRemoto.current = payload.updatedAt
      }

      if (payload.versions) {
        versionesLocales.current.sesiones = payload.versions.sesiones ?? versionesLocales.current.sesiones
        versionesLocales.current.feedbackSesiones = payload.versions.feedbackSesiones ?? versionesLocales.current.feedbackSesiones
        timestampCambiosLocales.current.sesiones = 0
        timestampCambiosLocales.current.feedbackSesiones = 0
      }
    } catch (error) {
      console.error('Error al guardar sesiones:', error)
    }
  }

  const guardarJugadoresInmediatamente = async (nuevosJugadores: Jugador[]) => {
    timestampCambiosLocales.current.jugadores = Date.now()

    if (!estadoRemotoCargado) {
      return
    }

    try {
      const respuesta = await fetch(API_JUGADORES_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jugadores: nuevosJugadores,
        }),
      })

      if (!respuesta.ok) {
        return
      }

      const payload = (await respuesta.json()) as { updatedAt?: string; versions?: Record<string, number> }

      if (typeof payload.updatedAt === 'string') {
        ultimoUpdatedAtRemoto.current = payload.updatedAt
      }

      if (payload.versions) {
        versionesLocales.current.jugadores = payload.versions.jugadores ?? versionesLocales.current.jugadores
        timestampCambiosLocales.current.jugadores = 0
      }
    } catch (error) {
      console.error('Error al guardar jugadores:', error)
    }
  }

  const guardarAdministracionInmediatamente = async (
    nuevosRecursos: Recurso[],
    nuevosEntrenadores: Entrenador[],
    nuevosPermisos: PermisoUsuario[],
    nuevasSedes: Sede[],
  ) => {
    timestampCambiosLocales.current.recursos = Date.now()
    timestampCambiosLocales.current.entrenadores = Date.now()
    timestampCambiosLocales.current.permisos = Date.now()

    if (!estadoRemotoCargado) {
      return
    }

    try {
      const respuesta = await fetch(API_ADMIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recursos: nuevosRecursos,
          entrenadores: nuevosEntrenadores,
          permisos: nuevosPermisos,
          sedes: nuevasSedes,
        }),
      })

      if (!respuesta.ok) {
        return
      }

      const payload = (await respuesta.json()) as { updatedAt?: string; versions?: Record<string, number> }
      if (typeof payload.updatedAt === 'string') {
        ultimoUpdatedAtRemoto.current = payload.updatedAt
      }

      if (payload.versions) {
        versionesLocales.current.recursos = payload.versions.recursos ?? versionesLocales.current.recursos
        versionesLocales.current.entrenadores = payload.versions.entrenadores ?? versionesLocales.current.entrenadores
        versionesLocales.current.permisos = payload.versions.permisos ?? versionesLocales.current.permisos
        timestampCambiosLocales.current.recursos = 0
        timestampCambiosLocales.current.entrenadores = 0
        timestampCambiosLocales.current.permisos = 0
      }
    } catch (error) {
      console.error('Error al guardar administración:', error)
    }
  }

  useEffect(() => {
    let cancelado = false

    const cargarEstadoRemoto = async () => {
      try {
        const respuesta = await fetch(API_STATE_URL)
        if (!respuesta.ok) return

        const remoto = (await respuesta.json()) as EstadoRemoto
        const updatedAtRemoto = typeof remoto.updatedAt === 'string' ? remoto.updatedAt : null
        const remotoTieneDatos = [
          remoto.jugadores,
          remoto.recursos,
          remoto.entrenadores,
          remoto.sesiones,
          remoto.feedbackSesiones,
          remoto.seguimientosJugadores,
          remoto.permisos,
          remoto.sedes,
        ].some((coleccion) => Array.isArray(coleccion) && coleccion.length > 0)

        if (cancelado) return

        if (estadoRemotoCargado && updatedAtRemoto && ultimoUpdatedAtRemoto.current === updatedAtRemoto) {
          return
        }

        if (!remotoTieneDatos) {
          if (updatedAtRemoto) {
            ultimoUpdatedAtRemoto.current = updatedAtRemoto
          }
          omitirPrimerGuardadoRemoto.current = false
          return
        }

        const remotoVersions = remoto.versions ?? {}
        if (Array.isArray(remoto.jugadores) && remotoVersions.jugadores !== versionesLocales.current.jugadores) {
          if (timestampCambiosLocales.current.jugadores === 0) {
            const jugadoresRemotos = normalizarJugadores(remoto.jugadores)
            setJugadores(jugadoresRemotos)
            setJugadorActivoId((actual) =>
              jugadoresRemotos.some((jugador) => jugador.id === actual) ? actual : (jugadoresRemotos[0]?.id ?? 0),
            )
            versionesLocales.current.jugadores = remotoVersions.jugadores ?? versionesLocales.current.jugadores
          }
        }

        if (Array.isArray(remoto.recursos) && remotoVersions.recursos !== versionesLocales.current.recursos) {
          if (timestampCambiosLocales.current.recursos === 0) {
            setRecursos(mezclarRecursosConIniciales(remoto.recursos))
            versionesLocales.current.recursos = remotoVersions.recursos ?? versionesLocales.current.recursos
          }
        }

        if (Array.isArray(remoto.entrenadores) && remotoVersions.entrenadores !== versionesLocales.current.entrenadores) {
          if (timestampCambiosLocales.current.entrenadores === 0) {
            const entrenadoresRemotos = normalizarEntrenadores(remoto.entrenadores)
            setEntrenadores(entrenadoresRemotos)
            setEntrenadorActivoId((actual) =>
              entrenadoresRemotos.some((entrenador) => entrenador.id === actual) ? actual : (entrenadoresRemotos[0]?.id ?? 0),
            )
            versionesLocales.current.entrenadores = remotoVersions.entrenadores ?? versionesLocales.current.entrenadores
          }
        }

        if (Array.isArray(remoto.sesiones) && remotoVersions.sesiones !== versionesLocales.current.sesiones) {
          if (timestampCambiosLocales.current.sesiones === 0) {
            setSesiones(remoto.sesiones)
            versionesLocales.current.sesiones = remotoVersions.sesiones ?? versionesLocales.current.sesiones
          }
        }

        if (Array.isArray(remoto.feedbackSesiones) && remotoVersions.feedbackSesiones !== versionesLocales.current.feedbackSesiones) {
          if (timestampCambiosLocales.current.feedbackSesiones === 0) {
            setFeedbackSesiones(remoto.feedbackSesiones)
            versionesLocales.current.feedbackSesiones = remotoVersions.feedbackSesiones ?? versionesLocales.current.feedbackSesiones
          }
        }

        if (Array.isArray(remoto.seguimientosJugadores) && remotoVersions.seguimientosJugadores !== versionesLocales.current.seguimientosJugadores) {
          if (timestampCambiosLocales.current.seguimientosJugadores === 0) {
            setSeguimientosJugadores(normalizarSeguimientos(remoto.seguimientosJugadores, remoto.jugadores ?? jugadores))
            versionesLocales.current.seguimientosJugadores = remotoVersions.seguimientosJugadores ?? versionesLocales.current.seguimientosJugadores
          }
        }

        if (Array.isArray(remoto.permisos) && remotoVersions.permisos !== versionesLocales.current.permisos) {
          if (timestampCambiosLocales.current.permisos === 0) {
            setPermisos(normalizarPermisos(remoto.permisos))
            versionesLocales.current.permisos = remotoVersions.permisos ?? versionesLocales.current.permisos
          }
        }

        if (Array.isArray(remoto.sedes)) {
          if (timestampCambiosLocales.current.permisos === 0) {
            setSedes(normalizarSedes(remoto.sedes))
          }
        }

        if (updatedAtRemoto) {
          ultimoUpdatedAtRemoto.current = updatedAtRemoto
        }
      } catch {
      } finally {
        if (!cancelado) {
          setEstadoRemotoCargado(true)
        }
      }
    }

    void cargarEstadoRemoto()
    const intervalo = window.setInterval(() => {
      void cargarEstadoRemoto()
    }, API_POLL_INTERVAL_MS)

    return () => {
      cancelado = true
      window.clearInterval(intervalo)
    }
  }, [
    estadoRemotoCargado,
    jugadores,
    setEntrenadorActivoId,
    setEntrenadores,
    setFeedbackSesiones,
    setJugadorActivoId,
    setJugadores,
    setPermisos,
    setRecursos,
    setSedes,
    setSeguimientosJugadores,
    setSesiones,
  ])

  useEffect(() => {
    if (!estadoRemotoCargado) return

    if (omitirPrimerGuardadoRemoto.current) {
      omitirPrimerGuardadoRemoto.current = false
      return
    }

    const temporizador = window.setTimeout(() => {
      void (async () => {
        try {
          const respuesta = await fetch(API_STATE_URL, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jugadores,
              recursos,
              entrenadores,
              sesiones,
              feedbackSesiones,
              seguimientosJugadores,
              permisos,
              sedes,
              versions: versionesLocales.current,
            }),
          })

          if (!respuesta.ok) return
          const payload = (await respuesta.json()) as { updatedAt?: string; versions?: Record<string, number> }
          if (typeof payload.updatedAt === 'string') {
            ultimoUpdatedAtRemoto.current = payload.updatedAt
          }
          if (payload.versions) {
            versionesLocales.current = payload.versions as VersionesLocales
            timestampCambiosLocales.current = {
              sesiones: 0,
              feedbackSesiones: 0,
              jugadores: 0,
              recursos: 0,
              entrenadores: 0,
              seguimientosJugadores: 0,
              permisos: 0,
            }
          }
        } catch {
        }
      })()
    }, API_SYNC_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(temporizador)
    }
  }, [estadoRemotoCargado, entrenadores, feedbackSesiones, jugadores, permisos, recursos, sedes, seguimientosJugadores, sesiones])

  return {
    estadoRemotoCargado,
    timestampCambiosLocales,
    guardarSesionesInmediatamente,
    guardarJugadoresInmediatamente,
    guardarAdministracionInmediatamente,
  }
}