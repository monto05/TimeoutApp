import type {
  EstadoObjetivoJugador,
  EstadoVideoJugador,
  Jugador,
  ObjetivoJugador,
  SeguimientoJugador,
} from '../../types/app'

export const colorEstadoObjetivo = (estado: EstadoObjetivoJugador) => {
  switch (estado) {
    case 'Conseguido':
      return 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
    case 'En progreso':
      return 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
    default:
      return 'border-white/15 bg-white/5 text-slate-200'
  }
}

export const colorEstadoVideo = (estado: EstadoVideoJugador) => {
  switch (estado) {
    case 'Corregido':
      return 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
    case 'Revisando':
      return 'border-amber-300/40 bg-amber-500/20 text-amber-100'
    default:
      return 'border-fuchsia-300/30 bg-fuchsia-500/15 text-fuchsia-100'
  }
}

export function mediaAspectosJugador(jugador: Jugador) {
  if (jugador.aspectos.length === 0) return 0
  const total = jugador.aspectos.reduce((acumulado, aspecto) => acumulado + aspecto.progreso, 0)
  return Math.round(total / jugador.aspectos.length)
}

export function calcularDebilidadesBase(jugador: Jugador) {
  return [...jugador.aspectos]
    .sort((a, b) => a.progreso - b.progreso)
    .slice(0, 2)
    .map((aspecto) => aspecto.nombre)
}

export function calcularFocoBase(jugador: Jugador) {
  return calcularDebilidadesBase(jugador)[0] ?? 'Consolidar fundamentos y transferencia al juego real.'
}

export function crearObjetivosBase(jugador: Jugador): ObjetivoJugador[] {
  const fechaObjetivo = new Date()
  fechaObjetivo.setDate(fechaObjetivo.getDate() + 45)
  const debilidades = calcularDebilidadesBase(jugador)

  return debilidades.map((debilidad, index) => ({
    id: index + 1,
    titulo: index === 0 ? `Corregir ${debilidad}` : `Transferir ${debilidad} al juego real`,
    descripcion:
      index === 0
        ? 'Crear volumen útil, controlado y medible en entrenamiento individual.'
        : 'Conectar el gesto con lectura, ritmo y toma de decisión bajo presión.',
    estado: index === 0 ? 'En progreso' : 'Pendiente',
    progreso: Math.max(20, Math.min(85, jugador.aspectos[index]?.progreso ?? 30)),
    fechaObjetivo: fechaObjetivo.toISOString().slice(0, 10),
  }))
}

export function normalizarSeguimientoJugador(seguimiento: SeguimientoJugador | undefined, jugador: Jugador): SeguimientoJugador {
  return {
    jugadorId: jugador.id,
    responsablesIds: Array.isArray(seguimiento?.responsablesIds) ? seguimiento?.responsablesIds ?? [] : [],
    debilidades:
      Array.isArray(seguimiento?.debilidades) && (seguimiento?.debilidades?.length ?? 0) > 0
        ? (seguimiento?.debilidades ?? []).map((item) => String(item).trim()).filter(Boolean)
        : calcularDebilidadesBase(jugador),
    focoActual: seguimiento?.focoActual?.trim() || calcularFocoBase(jugador),
    cadenciaInforme: seguimiento?.cadenciaInforme ?? 'Mensual',
    objetivos:
      Array.isArray(seguimiento?.objetivos) && (seguimiento?.objetivos?.length ?? 0) > 0
        ? (seguimiento?.objetivos ?? []).map((objetivo) => ({
            id: objetivo.id,
            titulo: objetivo.titulo,
            descripcion: objetivo.descripcion,
            estado: objetivo.estado,
            progreso: Math.max(0, Math.min(100, Number(objetivo.progreso ?? 0))),
            fechaObjetivo: objetivo.fechaObjetivo || new Date().toISOString().slice(0, 10),
          }))
        : crearObjetivosBase(jugador),
    evaluaciones: Array.isArray(seguimiento?.evaluaciones) ? seguimiento?.evaluaciones ?? [] : [],
    videos: Array.isArray(seguimiento?.videos) ? seguimiento?.videos ?? [] : [],
    mensajes: Array.isArray(seguimiento?.mensajes) ? seguimiento?.mensajes ?? [] : [],
    informes: Array.isArray(seguimiento?.informes) ? seguimiento?.informes ?? [] : [],
  }
}

export function normalizarSeguimientos(seguimientos: SeguimientoJugador[], jugadores: Jugador[]) {
  const porJugador = new Map(seguimientos.map((seguimiento) => [seguimiento.jugadorId, seguimiento]))
  return jugadores.map((jugador) => normalizarSeguimientoJugador(porJugador.get(jugador.id), jugador))
}

export function formatearMesCorto(fechaIso: string) {
  const fecha = new Date(`${fechaIso}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return fechaIso.slice(0, 7)
  const texto = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  return texto.replace('.', '').toUpperCase()
}
