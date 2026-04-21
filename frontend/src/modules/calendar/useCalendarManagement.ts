import { useEffect, useMemo, useState } from 'react'
import { API_AI_SUGERIR_OBJETIVO_LOCAL_URL, API_AI_SUGERIR_OBJETIVO_URL, STORAGE_KEYS } from '../../config/appConfig'
import { sedesIniciales } from '../../data/appSeeds'
import { leerStorage } from '../../lib/appHelpers'
import type {
  Entrenador,
  FeedbackSesion,
  Jugador,
  Sede,
  SesionCalendario,
} from '../../types/app'

type SeccionesCalendarioAbiertas = {
  disponibilidad: boolean
  programar: boolean
  agenda: boolean
  semanal: boolean
  match: boolean
}

type FormNuevaSesion = {
  fecha: string
  hora: string
  sede: Sede
  entrenadorId: number
  objetivo: string
  jugadorIds: number[]
}

type FormMatch = {
  hora: string
  sede: Sede
  entrenadorId: number
}

type MatchSugerido = {
  clave: string
  jugadorA: Jugador
  jugadorB: Jugador
  recursosCompartidos: string[]
  diferenciaEdad: number
  puntuacionCompatibilidad: number
}

type SugerenciaIA = {
  objetivo: string
  planBreve: string
  tags: string[]
}

type Params = {
  jugadores: Jugador[]
  setJugadores: React.Dispatch<React.SetStateAction<Jugador[]>>
  entrenadores: Entrenador[]
  recursos: Array<{ id: number; nombre: string }>
  sedes: Sede[]
  sesiones: SesionCalendario[]
  setSesiones: React.Dispatch<React.SetStateAction<SesionCalendario[]>>
  feedbackSesiones: FeedbackSesion[]
  setFeedbackSesiones: React.Dispatch<React.SetStateAction<FeedbackSesion[]>>
  guardarSesionesInmediatamente: (nuevasSesiones: SesionCalendario[], nuevosFeedback: FeedbackSesion[]) => Promise<void>
  guardarJugadoresInmediatamente: (nuevosJugadores: Jugador[]) => Promise<void>
  puedeEditar: boolean
  registrarBloqueo: (motivo: string) => void
}

export function useCalendarManagement({
  jugadores,
  setJugadores,
  entrenadores,
  recursos,
  sedes,
  sesiones,
  setSesiones,
  feedbackSesiones,
  setFeedbackSesiones,
  guardarSesionesInmediatamente,
  guardarJugadoresInmediatamente,
  puedeEditar,
  registrarBloqueo,
}: Params) {
  const hoy = new Date().toISOString().slice(0, 10)
  const sedeInicial = sedes[0] ?? sedesIniciales[0]
  const [filtroFecha, setFiltroFecha] = useState<string>(hoy)
  const [formNuevaSesion, setFormNuevaSesion] = useState<FormNuevaSesion>({
    fecha: hoy,
    hora: '17:30',
    sede: sedeInicial,
    entrenadorId: 0,
    objetivo: '',
    jugadorIds: [],
  })
  const [seccionesCalendarioAbiertas, setSeccionesCalendarioAbiertas] = useState<SeccionesCalendarioAbiertas>({
    disponibilidad: true,
    programar: false,
    agenda: true,
    semanal: false,
    match: true,
  })
  const [descartesMatchPorFecha, setDescartesMatchPorFecha] = useState<Record<string, string[]>>({})
  const [formMatch, setFormMatch] = useState<FormMatch>({ hora: '17:30', sede: sedeInicial, entrenadorId: 0 })
  const [opcionTrabajoMatchSeleccionada, setOpcionTrabajoMatchSeleccionada] = useState('')
  const [entrenadoresNoDisponiblesPorFecha, setEntrenadoresNoDisponiblesPorFecha] = useState<Record<string, number[]>>(() =>
    leerStorage<Record<string, number[]>>(STORAGE_KEYS.entrenadoresNoDisponibles, {}),
  )
  const [sesionFeedbackAbiertaId, setSesionFeedbackAbiertaId] = useState<number | null>(null)
  const [textoFeedbackSesion, setTextoFeedbackSesion] = useState('')
  const [sugerenciaIA, setSugerenciaIA] = useState<SugerenciaIA | null>(null)
  const [cargandoSugerenciaIA, setCargandoSugerenciaIA] = useState(false)
  const [errorSugerenciaIA, setErrorSugerenciaIA] = useState('')

  const cambiarFechaActiva = (nuevaFecha: string) => {
    setFiltroFecha(nuevaFecha)
    setFormNuevaSesion((previo) => ({ ...previo, fecha: nuevaFecha }))
  }

  const sesionesDelDia = useMemo(
    () => sesiones.filter((sesion) => sesion.fecha === filtroFecha).sort((a, b) => a.hora.localeCompare(b.hora)),
    [filtroFecha, sesiones],
  )

  const entrenadoresNoDisponiblesDia = useMemo(
    () => new Set(entrenadoresNoDisponiblesPorFecha[filtroFecha] ?? []),
    [entrenadoresNoDisponiblesPorFecha, filtroFecha],
  )

  const etiquetaFechaCalendario = useMemo(() => {
    const fecha = new Date(`${filtroFecha}T00:00:00`)
    if (Number.isNaN(fecha.getTime())) return filtroFecha
    const texto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }, [filtroFecha])

  const horasAgendaDia = useMemo(() => {
    const horasBase = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    const horasDinamicas = sesionesDelDia.map((sesion) => sesion.hora)
    if (formNuevaSesion.fecha === filtroFecha && formNuevaSesion.hora) {
      horasDinamicas.push(formNuevaSesion.hora)
    }

    return Array.from(new Set([...horasBase, ...horasDinamicas])).sort((a, b) => a.localeCompare(b))
  }, [filtroFecha, formNuevaSesion.fecha, formNuevaSesion.hora, sesionesDelDia])

  const entrenadoresAsignadosPorSedeDia = useMemo(
    () =>
      sedes.map((sede) => {
        const ids = Array.from(
          new Set(
            sesionesDelDia
              .filter((sesion) => sesion.sede === sede)
              .map((sesion) => sesion.entrenadorId)
              .filter((id) => id > 0),
          ),
        )
        return { sede, ids: new Set(ids) }
      }),
    [sedes, sesionesDelDia],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entrenadoresNoDisponibles, JSON.stringify(entrenadoresNoDisponiblesPorFecha))
  }, [entrenadoresNoDisponiblesPorFecha])

  const idsSesionesConConflicto = useMemo(() => {
    const ids = new Set<number>()

    for (let index = 0; index < sesiones.length; index += 1) {
      for (let subIndex = index + 1; subIndex < sesiones.length; subIndex += 1) {
        const actual = sesiones[index]
        const comparada = sesiones[subIndex]

        const mismaFechaHora = actual.fecha === comparada.fecha && actual.hora === comparada.hora
        const conflicto = mismaFechaHora && (actual.sede === comparada.sede || actual.entrenadorId === comparada.entrenadorId)

        if (conflicto) {
          ids.add(actual.id)
          ids.add(comparada.id)
        }
      }
    }

    return ids
  }, [sesiones])

  const nuevaSesionTieneConflicto = useMemo(() => {
    if (!formNuevaSesion.fecha || !formNuevaSesion.hora) return false

    return sesiones.some((sesion) => {
      const mismaFechaHora = sesion.fecha === formNuevaSesion.fecha && sesion.hora === formNuevaSesion.hora
      if (!mismaFechaHora) return false

      const conflictoSede = sesion.sede === formNuevaSesion.sede
      const conflictoEntrenador = formNuevaSesion.entrenadorId > 0 && sesion.entrenadorId === formNuevaSesion.entrenadorId
      return conflictoSede || conflictoEntrenador
    })
  }, [formNuevaSesion, sesiones])

  const jugadoresNoDisponiblesEnSesion = useMemo(() => {
    if (!formNuevaSesion.fecha || formNuevaSesion.jugadorIds.length === 0) return [] as Jugador[]

    const seleccionados = jugadores.filter((jugador) => formNuevaSesion.jugadorIds.includes(jugador.id))
    return seleccionados.filter((jugador) => !jugador.disponibilidadFechas.includes(formNuevaSesion.fecha))
  }, [formNuevaSesion.fecha, formNuevaSesion.jugadorIds, jugadores])

  const jugadoresDisponiblesFecha = useMemo(
    () => jugadores.filter((jugador) => jugador.disponibilidadFechas.includes(filtroFecha)),
    [filtroFecha, jugadores],
  )

  const sugerenciasMatch = useMemo(() => {
    const pendientesPorJugador = new Map<number, number[]>()
    jugadores.forEach((jugador) => {
      const pendientes = recursos
        .filter((recurso) => !jugador.recursosTrabajados.includes(recurso.id))
        .map((recurso) => recurso.id)
      pendientesPorJugador.set(jugador.id, pendientes)
    })

    const descartadosDia = new Set(descartesMatchPorFecha[filtroFecha] ?? [])
    const sugerencias: MatchSugerido[] = []

    for (let index = 0; index < jugadoresDisponiblesFecha.length; index += 1) {
      for (let subIndex = index + 1; subIndex < jugadoresDisponiblesFecha.length; subIndex += 1) {
        const jugadorA = jugadoresDisponiblesFecha[index]
        const jugadorB = jugadoresDisponiblesFecha[subIndex]
        const clave = `${Math.min(jugadorA.id, jugadorB.id)}-${Math.max(jugadorA.id, jugadorB.id)}`
        if (descartadosDia.has(clave)) continue

        if (jugadorA.categoria !== jugadorB.categoria) continue

        const diferenciaEdad = Math.abs(jugadorA.edad - jugadorB.edad)
        if (diferenciaEdad > 1) continue

        const pendientesA = new Set(pendientesPorJugador.get(jugadorA.id) ?? [])
        const pendientesALista = pendientesPorJugador.get(jugadorA.id) ?? []
        const pendientesB = pendientesPorJugador.get(jugadorB.id) ?? []
        const idsCompartidos = pendientesB.filter((id) => pendientesA.has(id))
        if (idsCompartidos.length === 0) continue

        const unionPendientes = new Set([...pendientesALista, ...pendientesB])
        const afinidadConceptual = unionPendientes.size > 0 ? idsCompartidos.length / unionPendientes.size : 0
        const proximidadEdad = (3 - diferenciaEdad) / 3
        const puntuacionCompatibilidad = Math.round(afinidadConceptual * 100 + proximidadEdad * 20 + idsCompartidos.length * 5)

        const recursosCompartidos = idsCompartidos
          .map((id) => recursos.find((recurso) => recurso.id === id)?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre))

        sugerencias.push({
          clave,
          jugadorA,
          jugadorB,
          recursosCompartidos,
          diferenciaEdad,
          puntuacionCompatibilidad,
        })
      }
    }

    return sugerencias.sort((a, b) => {
      if (b.puntuacionCompatibilidad !== a.puntuacionCompatibilidad) {
        return b.puntuacionCompatibilidad - a.puntuacionCompatibilidad
      }
      return b.recursosCompartidos.length - a.recursosCompartidos.length
    })
  }, [descartesMatchPorFecha, filtroFecha, jugadores, jugadoresDisponiblesFecha, recursos])

  const matchActual = sugerenciasMatch[0]

  useEffect(() => {
    if (!matchActual || matchActual.recursosCompartidos.length === 0) {
      setOpcionTrabajoMatchSeleccionada('')
      return
    }

    setOpcionTrabajoMatchSeleccionada((previa) =>
      matchActual.recursosCompartidos.includes(previa) ? previa : matchActual.recursosCompartidos[0],
    )
  }, [matchActual])

  const alternarSeccionCalendario = (seccion: keyof SeccionesCalendarioAbiertas) => {
    setSeccionesCalendarioAbiertas((previo) => ({ ...previo, [seccion]: !previo[seccion] }))
  }

  const alternarDisponibilidadJugador = (jugadorId: number, fecha: string) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes cambiar disponibilidad en modo visualizador.')
      return
    }
    if (!fecha) return

    const nuevosJugadores = jugadores.map((jugador) => {
      if (jugador.id !== jugadorId) return jugador
      const yaDisponible = jugador.disponibilidadFechas.includes(fecha)
      return {
        ...jugador,
        disponibilidadFechas: yaDisponible
          ? jugador.disponibilidadFechas.filter((item) => item !== fecha)
          : [...jugador.disponibilidadFechas, fecha],
      }
    })

    setJugadores(nuevosJugadores)
    void guardarJugadoresInmediatamente(nuevosJugadores)
  }

  const alternarDisponibilidadEntrenador = (entrenadorId: number) => {
    setEntrenadoresNoDisponiblesPorFecha((previo) => {
      const actuales = previo[filtroFecha] ?? []
      const yaNoDisponible = actuales.includes(entrenadorId)
      const siguientes = yaNoDisponible ? actuales.filter((id) => id !== entrenadorId) : [...actuales, entrenadorId]

      return {
        ...previo,
        [filtroFecha]: siguientes,
      }
    })
  }

  const alternarJugadorEnSesion = (jugadorId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar sesiones en modo visualizador.')
      return
    }
    setFormNuevaSesion((previo) => {
      const yaIncluido = previo.jugadorIds.includes(jugadorId)
      return {
        ...previo,
        jugadorIds: yaIncluido ? previo.jugadorIds.filter((id) => id !== jugadorId) : [...previo.jugadorIds, jugadorId],
      }
    })
  }

  const construirPayloadSugerencia = () => {
    const jugadoresSeleccionados = jugadores
      .filter((j) => formNuevaSesion.jugadorIds.includes(j.id))
      .map((jugador) => {
        const recursosPendientes = recursos
          .filter((recurso) => !jugador.recursosTrabajados.includes(recurso.id))
          .map((recurso) => recurso.nombre)
          .slice(0, 8)

        return {
          id: jugador.id,
          nombre: jugador.nombre,
          categoria: jugador.categoria,
          posicion: jugador.posicion,
          edad: jugador.edad,
          recursosPendientes,
        }
      })

    const entrenadorAsignado = entrenadores.find((entrenador) => entrenador.id === formNuevaSesion.entrenadorId)

    return {
      fecha: formNuevaSesion.fecha,
      hora: formNuevaSesion.hora,
      sede: formNuevaSesion.sede,
      entrenador: entrenadorAsignado
        ? {
            id: entrenadorAsignado.id,
            nombre: entrenadorAsignado.nombre,
            especialidad: entrenadorAsignado.especialidad,
          }
        : null,
      jugadores: jugadoresSeleccionados,
    }
  }

  const pedirSugerenciaIA = async (url: string, mensajeFallo: string) => {
    if (formNuevaSesion.jugadorIds.length === 0) {
      setErrorSugerenciaIA('Selecciona al menos un jugador para pedir sugerencia IA.')
      return
    }

    setCargandoSugerenciaIA(true)
    setErrorSugerenciaIA('')

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(construirPayloadSugerencia()),
      })

      if (!respuesta.ok) {
        const payload = (await respuesta.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || mensajeFallo)
      }

      const payload = (await respuesta.json()) as {
        objetivo?: string
        planBreve?: string
        tags?: string[]
      }

      const objetivo = (payload.objetivo ?? '').trim()
      const planBreve = (payload.planBreve ?? '').trim()
      const tags = Array.isArray(payload.tags)
        ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
        : []

      if (!objetivo) {
        throw new Error('La IA no devolvió un objetivo válido.')
      }

      setSugerenciaIA({ objetivo, planBreve, tags })
      setFormNuevaSesion((previo) => ({ ...previo, objetivo }))
    } catch (error) {
      setErrorSugerenciaIA(error instanceof Error ? error.message : 'Error inesperado al consultar IA.')
    } finally {
      setCargandoSugerenciaIA(false)
    }
  }

  const sugerirObjetivoSesionIA = async () => {
    await pedirSugerenciaIA(API_AI_SUGERIR_OBJETIVO_URL, 'No se pudo generar la sugerencia con IA.')
  }

  const sugerirObjetivoSesionIALocal = async () => {
    await pedirSugerenciaIA(API_AI_SUGERIR_OBJETIVO_LOCAL_URL, 'No se pudo generar la sugerencia local con Ollama.')
  }

  const anadirSesionCalendario = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de crear sesión sin permisos.')
      return
    }
    const objetivo = formNuevaSesion.objetivo.trim()

    if (!formNuevaSesion.fecha) {
      alert('Selecciona una fecha para la sesión.')
      return
    }
    if (!formNuevaSesion.hora) {
      alert('Selecciona una hora para la sesión.')
      return
    }
    if (!formNuevaSesion.entrenadorId) {
      alert('Selecciona un entrenador para la sesión.')
      return
    }
    if (formNuevaSesion.jugadorIds.length === 0) {
      alert('Selecciona al menos un jugador para la sesión.')
      return
    }
    if (!objetivo) {
      alert('Añade un objetivo para la sesión.')
      return
    }
    if (jugadoresNoDisponiblesEnSesion.length > 0) {
      alert(`Los siguientes jugadores no están disponibles: ${jugadoresNoDisponiblesEnSesion.map((j) => j.nombre).join(', ')}`)
      return
    }

    const siguienteId = Math.max(0, ...sesiones.map((sesion) => sesion.id)) + 1
    const nuevaSesion: SesionCalendario = {
      id: siguienteId,
      fecha: formNuevaSesion.fecha,
      hora: formNuevaSesion.hora,
      sede: formNuevaSesion.sede,
      entrenadorId: formNuevaSesion.entrenadorId,
      jugadorIds: formNuevaSesion.jugadorIds,
      objetivo,
    }

    const nuevasSesiones = [...sesiones, nuevaSesion]
    setSesiones(nuevasSesiones)
    void guardarSesionesInmediatamente(nuevasSesiones, feedbackSesiones)
    setFormNuevaSesion((previo) => ({ ...previo, objetivo: '', jugadorIds: [] }))
    setFiltroFecha(formNuevaSesion.fecha)
  }

  const eliminarSesionCalendario = (sesionId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar sesión sin permisos.')
      return
    }
    const nuevasSesiones = sesiones.filter((sesion) => sesion.id !== sesionId)
    setSesiones(nuevasSesiones)
    void guardarSesionesInmediatamente(nuevasSesiones, feedbackSesiones)
  }

  const guardarFeedbackSesion = (sesion: SesionCalendario) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes guardar feedback en modo visualizador.')
      return
    }

    const comentario = textoFeedbackSesion.trim()
    if (!comentario) return

    const existente = feedbackSesiones.find((feedback) => feedback.sesionId === sesion.id)
    let nuevosFeedback: FeedbackSesion[]

    if (existente) {
      nuevosFeedback = feedbackSesiones.map((feedback) =>
        feedback.sesionId === sesion.id
          ? { ...feedback, comentario, creadoEn: new Date().toISOString() }
          : feedback,
      )
      setFeedbackSesiones(nuevosFeedback)
    } else {
      const siguienteId = Math.max(0, ...feedbackSesiones.map((feedback) => feedback.id)) + 1
      const nuevoFeedback: FeedbackSesion = {
        id: siguienteId,
        sesionId: sesion.id,
        fecha: sesion.fecha,
        hora: sesion.hora,
        sede: sesion.sede,
        entrenadorId: sesion.entrenadorId,
        jugadorIds: sesion.jugadorIds,
        objetivo: sesion.objetivo,
        comentario,
        creadoEn: new Date().toISOString(),
      }
      nuevosFeedback = [...feedbackSesiones, nuevoFeedback]
      setFeedbackSesiones(nuevosFeedback)
    }

    void guardarSesionesInmediatamente(sesiones, nuevosFeedback)
    setSesionFeedbackAbiertaId(null)
    setTextoFeedbackSesion('')
  }

  const eliminarFeedbackSesion = (feedbackId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes eliminar feedback en modo visualizador.')
      return
    }

    const feedback = feedbackSesiones.find((item) => item.id === feedbackId)
    if (feedback && sesionFeedbackAbiertaId === feedback.sesionId) {
      setSesionFeedbackAbiertaId(null)
      setTextoFeedbackSesion('')
    }

    const nuevosFeedback = feedbackSesiones.filter((item) => item.id !== feedbackId)
    setFeedbackSesiones(nuevosFeedback)
    void guardarSesionesInmediatamente(sesiones, nuevosFeedback)
  }

  const descartarMatchActual = () => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes usar match en modo visualizador.')
      return
    }
    if (!matchActual) return
    setDescartesMatchPorFecha((previo) => ({
      ...previo,
      [filtroFecha]: [...(previo[filtroFecha] ?? []), matchActual.clave],
    }))
  }

  const usarMatchEnSesion = () => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes aplicar match a sesión en modo visualizador.')
      return
    }
    if (!matchActual) return
    if (!formMatch.hora) {
      alert('Selecciona una hora para la sesión del match.')
      return
    }
    if (!formMatch.entrenadorId) {
      alert('Selecciona un entrenador para la sesión del match.')
      return
    }
    if (!opcionTrabajoMatchSeleccionada && matchActual.recursosCompartidos.length > 0) {
      alert('Selecciona una opción de trabajo para la sesión del match.')
      return
    }
    const siguienteId = Math.max(0, ...sesiones.map((s) => s.id)) + 1
    const objetivoMatch = opcionTrabajoMatchSeleccionada
      ? `Trabajo compartido: ${opcionTrabajoMatchSeleccionada}`
      : `Trabajo compartido: ${matchActual.recursosCompartidos.slice(0, 3).join(' · ')}`
    const nuevaSesion: SesionCalendario = {
      id: siguienteId,
      fecha: filtroFecha,
      hora: formMatch.hora,
      sede: formMatch.sede,
      entrenadorId: formMatch.entrenadorId,
      jugadorIds: [matchActual.jugadorA.id, matchActual.jugadorB.id],
      objetivo: objetivoMatch,
    }
    const nuevasSesiones = [...sesiones, nuevaSesion]
    setSesiones(nuevasSesiones)
    void guardarSesionesInmediatamente(nuevasSesiones, feedbackSesiones)
    setDescartesMatchPorFecha((previo) => ({
      ...previo,
      [filtroFecha]: [...(previo[filtroFecha] ?? []), matchActual.clave],
    }))
    setFiltroFecha(filtroFecha)
  }

  useEffect(() => {
    if (sedes.length === 0) return
    if (!sedes.includes(formNuevaSesion.sede)) {
      setFormNuevaSesion((previo) => ({ ...previo, sede: sedes[0] }))
    }
    if (!sedes.includes(formMatch.sede)) {
      setFormMatch((previo) => ({ ...previo, sede: sedes[0] }))
    }
  }, [formMatch.sede, formNuevaSesion.sede, sedes])

  useEffect(() => {
    setSugerenciaIA(null)
    setErrorSugerenciaIA('')
  }, [formNuevaSesion.fecha, formNuevaSesion.hora, formNuevaSesion.sede, formNuevaSesion.entrenadorId, formNuevaSesion.jugadorIds])

  return {
    filtroFecha,
    setFiltroFecha,
    formNuevaSesion,
    setFormNuevaSesion,
    formMatch,
    setFormMatch,
    opcionTrabajoMatchSeleccionada,
    setOpcionTrabajoMatchSeleccionada,
    sugerenciaIA,
    cargandoSugerenciaIA,
    errorSugerenciaIA,
    seccionesCalendarioAbiertas,
    sesionesDelDia,
    entrenadoresNoDisponiblesDia,
    etiquetaFechaCalendario,
    horasAgendaDia,
    entrenadoresAsignadosPorSedeDia,
    idsSesionesConConflicto,
    nuevaSesionTieneConflicto,
    jugadoresNoDisponiblesEnSesion,
    jugadoresDisponiblesFecha,
    matchActual,
    sesionFeedbackAbiertaId,
    setSesionFeedbackAbiertaId,
    textoFeedbackSesion,
    setTextoFeedbackSesion,
    cambiarFechaActiva,
    alternarSeccionCalendario,
    alternarDisponibilidadJugador,
    alternarDisponibilidadEntrenador,
    alternarJugadorEnSesion,
    sugerirObjetivoSesionIA,
    sugerirObjetivoSesionIALocal,
    anadirSesionCalendario,
    eliminarSesionCalendario,
    guardarFeedbackSesion,
    eliminarFeedbackSesion,
    descartarMatchActual,
    usarMatchEnSesion,
  }
}