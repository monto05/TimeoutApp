import { useEffect, useMemo, useState } from 'react'
import type { MutableRefObject } from 'react'
import { LEVELS, posicionesRecurso } from '../../config/appConfig'
import { categoriasJugador, plantillaAspectosPorCategoria } from '../../data/appSeeds'
import {
  inferirNivelRecurso,
  inferirPosicionRecurso,
  normalizarNivelJugador,
  normalizarPosicionJugador,
} from '../../lib/appHelpers'
import type {
  FeedbackSesion,
  GrupoRecurso,
  Jugador,
  NivelRecurso,
  PosicionRecurso,
  Recurso,
  SeguimientoJugador,
} from '../../types/app'

type Params = {
  jugadores: Jugador[]
  setJugadores: React.Dispatch<React.SetStateAction<Jugador[]>>
  jugadorActivoId: number
  setJugadorActivoId: React.Dispatch<React.SetStateAction<number>>
  setSeguimientosJugadores: React.Dispatch<React.SetStateAction<SeguimientoJugador[]>>
  recursos: Recurso[]
  feedbackSesiones: FeedbackSesion[]
  guardarJugadoresInmediatamente: (jugadores: Jugador[]) => Promise<void>
  puedeEditar: boolean
  registrarBloqueo: (motivo: string) => void
  timestampCambiosLocales: MutableRefObject<Record<string, number>>
}

export function useJugadoresManagement({
  jugadores,
  setJugadores,
  jugadorActivoId,
  setJugadorActivoId,
  setSeguimientosJugadores,
  recursos,
  feedbackSesiones,
  guardarJugadoresInmediatamente,
  puedeEditar,
  registrarBloqueo,
  timestampCambiosLocales,
}: Params) {
  const [formNuevoJugador, setFormNuevoJugador] = useState({
    nombre: '',
    fotoUrl: '',
    equipo: '',
    categoria: 'Bronce (Grupo C)',
    nivel: 'Skills (Bronce)',
    posicion: 'Base',
    edad: '15',
  })

  const [mensajeJugador, setMensajeJugador] = useState('')
  const [grupoRecursoActivo, setGrupoRecursoActivo] = useState<GrupoRecurso>('Recursos')
  const [posicionRecursoActiva, setPosicionRecursoActiva] = useState<PosicionRecurso>('Base')
  const [nivelRecursoActivo, setNivelRecursoActivo] = useState<NivelRecurso>('Bronce')
  const [tabJugadorActiva, setTabJugadorActiva] = useState<'plan' | 'comentarios'>('plan')

  const jugadorActivo = useMemo(
    () => jugadores.find((j) => j.id === jugadorActivoId) ?? jugadores[0],
    [jugadorActivoId, jugadores],
  )

  const recursosPendientes = useMemo(
    () => (jugadorActivo ? recursos.filter((r) => !jugadorActivo.recursosTrabajados.includes(r.id)) : []),
    [jugadorActivo, recursos],
  )

  const posicionFiltroRecursosJugador = useMemo(
    () => (jugadorActivo ? normalizarPosicionJugador(jugadorActivo.posicion) : posicionRecursoActiva),
    [jugadorActivo, posicionRecursoActiva],
  )

  const recursosVisibles = useMemo(
    () =>
      recursos.filter((recurso) => {
        if (recurso.grupo !== grupoRecursoActivo) return false
        const posicion = recurso.posicion ?? inferirPosicionRecurso(recurso.nombre)
        const nivel = recurso.nivel ?? inferirNivelRecurso(recurso.nombre)
        return (posicion === 'General' || posicion === posicionFiltroRecursosJugador) && nivel === nivelRecursoActivo
      }),
    [grupoRecursoActivo, nivelRecursoActivo, posicionFiltroRecursosJugador, recursos],
  )

  const pendientesDelGrupo = useMemo(
    () => (jugadorActivo ? recursosVisibles.filter((r) => !jugadorActivo.recursosTrabajados.includes(r.id)).length : 0),
    [jugadorActivo, recursosVisibles],
  )

  const comentariosJugadorActivo = useMemo(() => {
    if (!jugadorActivo) return [] as FeedbackSesion[]
    return feedbackSesiones
      .filter((f) => f.jugadorIds.includes(jugadorActivo.id))
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
  }, [feedbackSesiones, jugadorActivo])

  // Sincronizar posición/nivel activos con el jugador seleccionado
  useEffect(() => {
    if (!jugadorActivo) return
    setPosicionRecursoActiva(normalizarPosicionJugador(jugadorActivo.posicion))
    setNivelRecursoActivo(normalizarNivelJugador(jugadorActivo.categoria, jugadorActivo.nivel))
  }, [jugadorActivo])

  const anadirJugador = () => {
    if (!puedeEditar) {
      setMensajeJugador('No tienes permisos de edición para añadir jugadores.')
      registrarBloqueo('Intento de añadir jugador sin permisos.')
      return
    }
    const nombre = formNuevoJugador.nombre.trim()
    const fotoUrl = formNuevoJugador.fotoUrl.trim()
    const equipo = formNuevoJugador.equipo.trim()
    const posicion = formNuevoJugador.posicion.trim() as PosicionRecurso
    const edadNumero = Number(formNuevoJugador.edad)

    if (!nombre || !equipo || !posicion || Number.isNaN(edadNumero)) {
      setMensajeJugador('Completa nombre, equipo, posición y edad válidos.')
      return
    }

    if (!posicionesRecurso.includes(posicion)) {
      setMensajeJugador('La posición debe ser Base, Escolta, Alero, Ala Pívot o Pívot.')
      return
    }

    const siguienteId = Math.max(0, ...jugadores.map((j) => j.id)) + 1
    const nivelAsignado = formNuevoJugador.nivel ?? formNuevoJugador.categoria
    const aspectosIniciales = plantillaAspectosPorCategoria[nivelAsignado] ?? plantillaAspectosPorCategoria[LEVELS[0].key]

    const nuevoJugador: Jugador = {
      id: siguienteId,
      nombre,
      fotoUrl,
      equipo,
      categoria: formNuevoJugador.categoria,
      nivel: nivelAsignado,
      posicion,
      edad: edadNumero,
      aspectos: aspectosIniciales,
      recursosTrabajados: [],
      disponibilidadFechas: [],
    }

    const nuevosJugadores = [...jugadores, nuevoJugador]
    setJugadores(nuevosJugadores)
    void guardarJugadoresInmediatamente(nuevosJugadores)
    setJugadorActivoId(siguienteId)
    setFormNuevoJugador({
      nombre: '',
      fotoUrl: '',
      equipo: '',
      categoria: formNuevoJugador.categoria,
      nivel: formNuevoJugador.nivel ?? formNuevoJugador.categoria,
      posicion: 'Base',
      edad: '15',
    })
    setMensajeJugador('Jugador añadido correctamente.')
  }

  const eliminarJugadorActivo = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar jugador sin permisos.')
      return
    }
    if (!jugadorActivo) return

    const restantes = jugadores.filter((j) => j.id !== jugadorActivo.id)
    setJugadores(restantes)
    setSeguimientosJugadores((prev) => prev.filter((s) => s.jugadorId !== jugadorActivo.id))
    timestampCambiosLocales.current.seguimientosJugadores = Date.now()
    void guardarJugadoresInmediatamente(restantes)
    setJugadorActivoId(restantes[0]?.id ?? 0)
  }

  const actualizarCampoJugadorActivo = (
    campo: keyof Omit<Jugador, 'id' | 'aspectos' | 'recursosTrabajados' | 'disponibilidadFechas'>,
    valor: string | number,
  ) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar jugadores en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    const nuevosJugadores = jugadores.map((j) =>
      j.id === jugadorActivo.id ? { ...j, [campo]: valor } : j,
    )
    setJugadores(nuevosJugadores)
    void guardarJugadoresInmediatamente(nuevosJugadores)
  }

  const actualizarProgresoAspecto = (nombreAspecto: string, progreso: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar progreso en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    const nuevosJugadores = jugadores.map((j) => {
      if (j.id !== jugadorActivo.id) return j
      return {
        ...j,
        aspectos: j.aspectos.map((a) =>
          a.nombre === nombreAspecto ? { ...a, progreso } : a,
        ),
      }
    })
    setJugadores(nuevosJugadores)
    void guardarJugadoresInmediatamente(nuevosJugadores)
  }

  const alternarRecursoTrabajado = (recursoId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes cambiar recursos en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    setJugadores((prev) =>
      prev.map((j) => {
        if (j.id !== jugadorActivo.id) return j
        const yaTrabajado = j.recursosTrabajados.includes(recursoId)
        return {
          ...j,
          recursosTrabajados: yaTrabajado
            ? j.recursosTrabajados.filter((id) => id !== recursoId)
            : [...j.recursosTrabajados, recursoId],
        }
      }),
    )
  }

  return {
    jugadorActivo,
    formNuevoJugador, setFormNuevoJugador,
    mensajeJugador,
    grupoRecursoActivo, setGrupoRecursoActivo,
    posicionRecursoActiva, setPosicionRecursoActiva,
    nivelRecursoActivo, setNivelRecursoActivo,
    tabJugadorActiva, setTabJugadorActiva,
    recursosPendientes,
    posicionFiltroRecursosJugador,
    categoriasJugador,
    anadirJugador,
    eliminarJugadorActivo,
    actualizarCampoJugadorActivo,
    actualizarProgresoAspecto,
    alternarRecursoTrabajado,
    recursosVisibles,
    pendientesDelGrupo,
    comentariosJugadorActivo,
  }
}
