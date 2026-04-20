import { useMemo, useState } from 'react'
import { formatearMesCorto, mediaAspectosJugador, normalizarSeguimientoJugador, normalizarSeguimientos } from './utils'
import type {
  AutorMensajeSeguimiento,
  Entrenador,
  EvaluacionJugador,
  FeedbackSesion,
  InformeAutomaticoJugador,
  Jugador,
  ObjetivoJugador,
  SeguimientoJugador,
  SesionCalendario,
  VideoJugador,
} from '../../types/app'

type TimestampCambiosSeguimientoRef = {
  current: {
    seguimientosJugadores: number
  }
}

type UsePlayerDevelopmentParams = {
  jugadorActivo?: Jugador
  jugadores: Jugador[]
  entrenadores: Entrenador[]
  sesiones: SesionCalendario[]
  feedbackPorSesionId: Map<number, FeedbackSesion>
  comentariosJugadorActivo: FeedbackSesion[]
  seguimientosJugadores: SeguimientoJugador[]
  setSeguimientosJugadores: React.Dispatch<React.SetStateAction<SeguimientoJugador[]>>
  puedeEditar: boolean
  registrarBloqueo: (motivo: string) => void
  timestampCambiosLocales: TimestampCambiosSeguimientoRef
}

export function usePlayerDevelopment({
  jugadorActivo,
  jugadores,
  entrenadores,
  sesiones,
  feedbackPorSesionId,
  comentariosJugadorActivo,
  seguimientosJugadores,
  setSeguimientosJugadores,
  puedeEditar,
  registrarBloqueo,
  timestampCambiosLocales,
}: UsePlayerDevelopmentParams) {
  const [tabActiva, setTabActiva] = useState<'staff' | 'portal'>('staff')
  const [nuevaDebilidad, setNuevaDebilidad] = useState('')
  const [formNuevoObjetivo, setFormNuevoObjetivo] = useState({
    titulo: '',
    descripcion: '',
    fechaObjetivo: new Date().toISOString().slice(0, 10),
  })
  const [formNuevaEvaluacion, setFormNuevaEvaluacion] = useState({
    area: 'Toma de decisiones',
    puntuacion: '7',
    comentario: '',
  })
  const [formNuevoVideo, setFormNuevoVideo] = useState({
    titulo: '',
    url: '',
    comentarioFamilia: '',
  })
  const [formNuevoMensajeSeguimiento, setFormNuevoMensajeSeguimiento] = useState({
    autor: 'Staff' as AutorMensajeSeguimiento,
    texto: '',
  })

  const seguimientoActivo = useMemo(() => {
    if (!jugadorActivo) return null
    return (
      seguimientosJugadores.find((seguimiento) => seguimiento.jugadorId === jugadorActivo.id) ??
      normalizarSeguimientoJugador(undefined, jugadorActivo)
    )
  }, [jugadorActivo, seguimientosJugadores])

  const sesionesJugadorActivo = useMemo(() => {
    if (!jugadorActivo) return [] as SesionCalendario[]
    return [...sesiones]
      .filter((sesion) => sesion.jugadorIds.includes(jugadorActivo.id))
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
  }, [jugadorActivo, sesiones])

  const responsablesSeguimientoActivo = useMemo(() => {
    if (!seguimientoActivo) return [] as Entrenador[]
    return entrenadores.filter((entrenador) => seguimientoActivo.responsablesIds.includes(entrenador.id))
  }, [entrenadores, seguimientoActivo])

  const evaluacionesOrdenadasActivo = useMemo(() => {
    if (!seguimientoActivo) return [] as EvaluacionJugador[]
    return [...seguimientoActivo.evaluaciones].sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [seguimientoActivo])

  const evolucionMensualJugadorActivo = useMemo(() => {
    if (!jugadorActivo || !seguimientoActivo) return [] as Array<{ mes: string; valor: number; sesiones: number }>

    const porMes = new Map<string, { puntos: number[]; sesiones: number }>()

    seguimientoActivo.evaluaciones.forEach((evaluacion) => {
      const clave = evaluacion.fecha.slice(0, 7)
      const registro = porMes.get(clave) ?? { puntos: [], sesiones: 0 }
      registro.puntos.push(evaluacion.puntuacion * 10)
      porMes.set(clave, registro)
    })

    sesionesJugadorActivo.forEach((sesion) => {
      const clave = sesion.fecha.slice(0, 7)
      const registro = porMes.get(clave) ?? { puntos: [], sesiones: 0 }
      registro.sesiones += 1
      porMes.set(clave, registro)
    })

    const claves = Array.from(porMes.keys()).sort().slice(-6)
    if (claves.length === 0) {
      return [
        {
          mes: formatearMesCorto(new Date().toISOString().slice(0, 10)),
          valor: mediaAspectosJugador(jugadorActivo),
          sesiones: sesionesJugadorActivo.length,
        },
      ]
    }

    return claves.map((clave) => {
      const registro = porMes.get(clave) ?? { puntos: [], sesiones: 0 }
      const valorBase = registro.puntos.length > 0
        ? Math.round(registro.puntos.reduce((total, punto) => total + punto, 0) / registro.puntos.length)
        : mediaAspectosJugador(jugadorActivo)

      return {
        mes: formatearMesCorto(`${clave}-01`),
        valor: valorBase,
        sesiones: registro.sesiones,
      }
    })
  }, [jugadorActivo, seguimientoActivo, sesionesJugadorActivo])

  const actualizarSeguimientoActivo = (actualizar: (seguimiento: SeguimientoJugador) => SeguimientoJugador) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar el seguimiento del jugador en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    setSeguimientosJugadores((previo) => {
      const normalizados = normalizarSeguimientos(previo, jugadores)
      timestampCambiosLocales.current.seguimientosJugadores = Date.now()
      return normalizados.map((seguimiento) =>
        seguimiento.jugadorId === jugadorActivo.id ? actualizar(seguimiento) : seguimiento,
      )
    })
  }

  const construirInformeAutomatico = () => {
    if (!jugadorActivo || !seguimientoActivo) return null

    const objetivosConseguidos = seguimientoActivo.objetivos.filter((objetivo) => objetivo.estado === 'Conseguido').length
    const objetivosEnCurso = seguimientoActivo.objetivos.filter((objetivo) => objetivo.estado === 'En progreso').length
    const ultimaEvaluacion = evaluacionesOrdenadasActivo[0]
    const ultimoFeedback = comentariosJugadorActivo[0]
    const hitos = [
      `${objetivosConseguidos} objetivos cerrados`,
      `${objetivosEnCurso} objetivos activos`,
      `${sesionesJugadorActivo.length} sesiones registradas`,
    ]

    if (ultimaEvaluacion) {
      hitos.push(`Última evaluación en ${ultimaEvaluacion.area}: ${ultimaEvaluacion.puntuacion}/10`)
    }

    return {
      id: Math.max(0, ...seguimientoActivo.informes.map((informe) => informe.id)) + 1,
      jugadorId: jugadorActivo.id,
      fecha: new Date().toISOString(),
      cadencia: seguimientoActivo.cadenciaInforme,
      resumen: `${jugadorActivo.nombre} mantiene un progreso medio del ${mediaAspectosJugador(jugadorActivo)}%. El foco actual está en ${seguimientoActivo.focoActual.toLowerCase()} y se observa una evolución ${objetivosConseguidos > 0 ? 'positiva' : 'todavía incipiente'} en la transferencia al juego. ${ultimoFeedback ? `Último feedback: ${ultimoFeedback.comentario}` : 'Aún no hay feedback de sesión consolidado.'}`,
      hitos,
      siguientePaso:
        seguimientoActivo.objetivos.find((objetivo) => objetivo.estado !== 'Conseguido')?.titulo ??
        'Subir la exigencia contextual y redefinir nuevos objetivos de desarrollo.',
    } satisfies InformeAutomaticoJugador
  }

  const anadirDebilidadJugador = () => {
    const valor = nuevaDebilidad.trim()
    if (!valor) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      debilidades: seguimiento.debilidades.includes(valor) ? seguimiento.debilidades : [...seguimiento.debilidades, valor],
    }))
    setNuevaDebilidad('')
  }

  const eliminarDebilidadJugador = (debilidad: string) => {
    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      debilidades: seguimiento.debilidades.filter((item) => item !== debilidad),
    }))
  }

  const alternarResponsableSeguimiento = (entrenadorId: number) => {
    actualizarSeguimientoActivo((seguimiento) => {
      const incluido = seguimiento.responsablesIds.includes(entrenadorId)
      return {
        ...seguimiento,
        responsablesIds: incluido
          ? seguimiento.responsablesIds.filter((id) => id !== entrenadorId)
          : [...seguimiento.responsablesIds, entrenadorId],
      }
    })
  }

  const anadirObjetivoJugador = () => {
    const titulo = formNuevoObjetivo.titulo.trim()
    const descripcion = formNuevoObjetivo.descripcion.trim()
    if (!titulo || !descripcion) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      objetivos: [
        ...seguimiento.objetivos,
        {
          id: Math.max(0, ...seguimiento.objetivos.map((objetivo) => objetivo.id)) + 1,
          titulo,
          descripcion,
          estado: 'Pendiente',
          progreso: 0,
          fechaObjetivo: formNuevoObjetivo.fechaObjetivo,
        },
      ],
    }))

    setFormNuevoObjetivo((previo) => ({
      ...previo,
      titulo: '',
      descripcion: '',
    }))
  }

  const actualizarObjetivoJugador = (objetivoId: number, cambios: Partial<ObjetivoJugador>) => {
    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      objetivos: seguimiento.objetivos.map((objetivo) => {
        if (objetivo.id !== objetivoId) return objetivo
        const progreso = Math.max(0, Math.min(100, Number(cambios.progreso ?? objetivo.progreso)))
        const estado = cambios.estado ?? (progreso >= 100 ? 'Conseguido' : progreso > 0 ? 'En progreso' : objetivo.estado)
        return {
          ...objetivo,
          ...cambios,
          progreso,
          estado,
        }
      }),
    }))
  }

  const eliminarObjetivoJugador = (objetivoId: number) => {
    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      objetivos: seguimiento.objetivos.filter((objetivo) => objetivo.id !== objetivoId),
    }))
  }

  const anadirEvaluacionJugador = () => {
    if (!jugadorActivo) return
    const comentario = formNuevaEvaluacion.comentario.trim()
    const area = formNuevaEvaluacion.area.trim()
    const puntuacion = Number(formNuevaEvaluacion.puntuacion)
    if (!area || !comentario || Number.isNaN(puntuacion)) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      evaluaciones: [
        {
          id: Math.max(0, ...seguimiento.evaluaciones.map((evaluacion) => evaluacion.id)) + 1,
          jugadorId: jugadorActivo.id,
          fecha: new Date().toISOString().slice(0, 10),
          area,
          puntuacion: Math.max(1, Math.min(10, puntuacion)),
          comentario,
        },
        ...seguimiento.evaluaciones,
      ],
    }))

    setFormNuevaEvaluacion((previo) => ({ ...previo, comentario: '', puntuacion: '7' }))
  }

  const anadirVideoJugador = () => {
    if (!jugadorActivo) return
    const titulo = formNuevoVideo.titulo.trim()
    const url = formNuevoVideo.url.trim()
    if (!titulo || !url) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      videos: [
        {
          id: Math.max(0, ...seguimiento.videos.map((video) => video.id)) + 1,
          jugadorId: jugadorActivo.id,
          fecha: new Date().toISOString().slice(0, 10),
          titulo,
          url,
          comentarioFamilia: formNuevoVideo.comentarioFamilia.trim(),
          comentarioStaff: '',
          estado: 'Pendiente',
        },
        ...seguimiento.videos,
      ],
    }))

    setFormNuevoVideo({ titulo: '', url: '', comentarioFamilia: '' })
  }

  const actualizarVideoJugador = (videoId: number, cambios: Partial<VideoJugador>) => {
    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      videos: seguimiento.videos.map((video) =>
        video.id === videoId ? { ...video, ...cambios } : video,
      ),
    }))
  }

  const anadirMensajeSeguimiento = () => {
    if (!jugadorActivo) return
    const texto = formNuevoMensajeSeguimiento.texto.trim()
    if (!texto) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      mensajes: [
        {
          id: Math.max(0, ...seguimiento.mensajes.map((mensaje) => mensaje.id)) + 1,
          jugadorId: jugadorActivo.id,
          fecha: new Date().toISOString(),
          autor: formNuevoMensajeSeguimiento.autor,
          texto,
        },
        ...seguimiento.mensajes,
      ],
    }))

    setFormNuevoMensajeSeguimiento((previo) => ({ ...previo, texto: '' }))
  }

  const generarInformeJugador = () => {
    const informe = construirInformeAutomatico()
    if (!informe) return

    actualizarSeguimientoActivo((seguimiento) => ({
      ...seguimiento,
      informes: [informe, ...seguimiento.informes],
    }))
  }

  return {
    seguimientoActivo,
    sesionesJugadorActivo,
    responsablesSeguimientoActivo,
    evaluacionesOrdenadasActivo,
    evolucionMensualJugadorActivo,
    feedbackPorSesionId,
    tabActiva,
    setTabActiva,
    nuevaDebilidad,
    setNuevaDebilidad,
    formNuevoObjetivo,
    setFormNuevoObjetivo,
    formNuevaEvaluacion,
    setFormNuevaEvaluacion,
    formNuevoVideo,
    setFormNuevoVideo,
    formNuevoMensajeSeguimiento,
    setFormNuevoMensajeSeguimiento,
    actualizarSeguimientoActivo,
    anadirDebilidadJugador,
    eliminarDebilidadJugador,
    alternarResponsableSeguimiento,
    anadirObjetivoJugador,
    actualizarObjetivoJugador,
    eliminarObjetivoJugador,
    anadirEvaluacionJugador,
    anadirVideoJugador,
    actualizarVideoJugador,
    anadirMensajeSeguimiento,
    generarInformeJugador,
  }
}