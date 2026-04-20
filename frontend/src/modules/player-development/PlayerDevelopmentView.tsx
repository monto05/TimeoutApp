import { colorEstadoObjetivo, colorEstadoVideo, mediaAspectosJugador } from './utils'
import type {
  AutorMensajeSeguimiento,
  CadenciaInforme,
  Entrenador,
  EstadoVideoJugador,
  EvaluacionJugador,
  FeedbackSesion,
  Jugador,
  ObjetivoJugador,
  SeguimientoJugador,
  SesionCalendario,
  VideoJugador,
} from '../../types/app'

type FormObjetivo = {
  titulo: string
  descripcion: string
  fechaObjetivo: string
}

type FormEvaluacion = {
  area: string
  puntuacion: string
  comentario: string
}

type FormVideo = {
  titulo: string
  url: string
  comentarioFamilia: string
}

type FormMensaje = {
  autor: AutorMensajeSeguimiento
  texto: string
}

type Props = {
  jugadorActivo: Jugador
  seguimientoActivo: SeguimientoJugador
  tabActiva: 'staff' | 'portal'
  responsablesSeguimientoActivo: Entrenador[]
  entrenadores: Entrenador[]
  sesionesJugadorActivo: SesionCalendario[]
  feedbackPorSesionId: Map<number, FeedbackSesion>
  evaluacionesOrdenadasActivo: EvaluacionJugador[]
  evolucionMensualJugadorActivo: Array<{ mes: string; valor: number; sesiones: number }>
  nuevaDebilidad: string
  formNuevoObjetivo: FormObjetivo
  formNuevaEvaluacion: FormEvaluacion
  formNuevoVideo: FormVideo
  formNuevoMensajeSeguimiento: FormMensaje
  onCambiarTab: (tab: 'staff' | 'portal') => void
  onCambiarNuevaDebilidad: (valor: string) => void
  onAddDebilidad: () => void
  onRemoveDebilidad: (debilidad: string) => void
  onActualizarFoco: (foco: string) => void
  onActualizarCadencia: (cadencia: CadenciaInforme) => void
  onAlternarResponsable: (entrenadorId: number) => void
  onGenerarInforme: () => void
  onCambiarFormObjetivo: (campo: keyof FormObjetivo, valor: string) => void
  onAddObjetivo: () => void
  onActualizarObjetivo: (objetivoId: number, cambios: Partial<ObjetivoJugador>) => void
  onEliminarObjetivo: (objetivoId: number) => void
  onCambiarFormEvaluacion: (campo: keyof FormEvaluacion, valor: string) => void
  onAddEvaluacion: () => void
  onCambiarFormVideo: (campo: keyof FormVideo, valor: string) => void
  onAddVideo: () => void
  onActualizarVideo: (videoId: number, cambios: Partial<VideoJugador>) => void
  onCambiarFormMensaje: (campo: keyof FormMensaje, valor: string) => void
  onAddMensaje: () => void
}

export function PlayerDevelopmentView({
  jugadorActivo,
  seguimientoActivo,
  tabActiva,
  responsablesSeguimientoActivo,
  entrenadores,
  sesionesJugadorActivo,
  feedbackPorSesionId,
  evaluacionesOrdenadasActivo,
  evolucionMensualJugadorActivo,
  nuevaDebilidad,
  formNuevoObjetivo,
  formNuevaEvaluacion,
  formNuevoVideo,
  formNuevoMensajeSeguimiento,
  onCambiarTab,
  onCambiarNuevaDebilidad,
  onAddDebilidad,
  onRemoveDebilidad,
  onActualizarFoco,
  onActualizarCadencia,
  onAlternarResponsable,
  onGenerarInforme,
  onCambiarFormObjetivo,
  onAddObjetivo,
  onActualizarObjetivo,
  onEliminarObjetivo,
  onCambiarFormEvaluacion,
  onAddEvaluacion,
  onCambiarFormVideo,
  onAddVideo,
  onActualizarVideo,
  onCambiarFormMensaje,
  onAddMensaje,
}: Props) {
  return (
    <>
      <header className="border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-fuchsia-200/90">Timeout Player Development System</p>
            <h3 className="mt-1 text-2xl font-bold text-white">Seguimiento integral del jugador</h3>
            <p className="mt-2 text-sm text-slate-300">
              Objetivos, historial, evaluaciones, vídeo-feedback, comunicación con familia e informes automáticos.
            </p>
          </div>
          <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 px-4 py-3 text-right text-xs text-fuchsia-100">
            <p className="font-semibold uppercase tracking-[0.14em]">Jugador activo</p>
            <p className="mt-1 text-base font-bold text-white">{jugadorActivo.nombre}</p>
            <p className="text-slate-200">{jugadorActivo.equipo} · {jugadorActivo.posicion}</p>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCambiarTab('staff')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            tabActiva === 'staff'
              ? 'border-fuchsia-300/60 bg-fuchsia-500/20 text-fuchsia-100'
              : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
        >
          Vista staff
        </button>
        <button
          type="button"
          onClick={() => onCambiarTab('portal')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            tabActiva === 'portal'
              ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
              : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
        >
          Portal jugador / familia
        </button>
      </div>

      {tabActiva === 'staff' ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Progreso medio</p>
              <p className="mt-2 text-3xl font-bold text-white">{mediaAspectosJugador(jugadorActivo)}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Objetivos cerrados</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {seguimientoActivo.objetivos.filter((objetivo) => objetivo.estado === 'Conseguido').length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Vídeos por revisar</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {seguimientoActivo.videos.filter((video) => video.estado !== 'Corregido').length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Sesiones registradas</p>
              <p className="mt-2 text-3xl font-bold text-white">{sesionesJugadorActivo.length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Dirección del plan</p>
                <button
                  type="button"
                  onClick={onGenerarInforme}
                  className="rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/15 px-3 py-2 text-xs font-semibold text-fuchsia-100"
                >
                  Generar informe automático
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-slate-300">
                  Foco actual
                  <input
                    value={seguimientoActivo.focoActual}
                    onChange={(evento) => onActualizarFoco(evento.target.value)}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs text-slate-300">
                  Cadencia de informe
                  <select
                    value={seguimientoActivo.cadenciaInforme}
                    onChange={(evento) => onActualizarCadencia(evento.target.value as CadenciaInforme)}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </label>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Debilidades detectadas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {seguimientoActivo.debilidades.map((debilidad) => (
                    <button
                      key={debilidad}
                      type="button"
                      onClick={() => onRemoveDebilidad(debilidad)}
                      className="rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100"
                    >
                      {debilidad} ×
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={nuevaDebilidad}
                    onChange={(evento) => onCambiarNuevaDebilidad(evento.target.value)}
                    placeholder="Añadir debilidad visible para familia/jugador"
                    className="flex-1 rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={onAddDebilidad}
                    className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Responsables del jugador</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entrenadores.map((entrenador) => {
                    const activo = seguimientoActivo.responsablesIds.includes(entrenador.id)
                    return (
                      <button
                        key={entrenador.id}
                        type="button"
                        onClick={() => onAlternarResponsable(entrenador.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          activo
                            ? 'border-cyan-300/50 bg-cyan-500/20 text-cyan-100'
                            : 'border-white/15 bg-white/5 text-slate-200'
                        }`}
                      >
                        {entrenador.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
                <p className="text-sm font-semibold text-fuchsia-100">Último informe</p>
                {seguimientoActivo.informes[0] ? (
                  <>
                    <p className="mt-2 text-xs text-slate-200">{seguimientoActivo.informes[0].resumen}</p>
                    <p className="mt-2 text-xs text-fuchsia-100">Siguiente paso: {seguimientoActivo.informes[0].siguientePaso}</p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-300">
                    Aún no hay informes guardados. Genera uno para tener un resumen automático compartible con familia y staff.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Historial operativo</p>
              <div className="mt-3 grid gap-3">
                {sesionesJugadorActivo.slice(0, 5).map((sesion) => {
                  const entrenador = entrenadores.find((item) => item.id === sesion.entrenadorId)
                  const feedback = feedbackPorSesionId.get(sesion.id)
                  return (
                    <div key={sesion.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                      <p className="text-xs font-semibold text-white">{sesion.fecha} · {sesion.hora} · {sesion.sede}</p>
                      <p className="mt-1 text-xs text-slate-300">{sesion.objetivo}</p>
                      <p className="mt-1 text-[11px] text-slate-400">Entrenador: {entrenador?.nombre ?? 'Sin asignar'}</p>
                      {feedback ? <p className="mt-2 text-xs text-slate-200">{feedback.comentario}</p> : null}
                    </div>
                  )
                })}
                {sesionesJugadorActivo.length === 0 ? (
                  <p className="text-xs text-slate-300">Todavía no hay sesiones ligadas a este jugador.</p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Objetivos y tracking real</p>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_160px_auto]">
                <input
                  value={formNuevoObjetivo.titulo}
                  onChange={(evento) => onCambiarFormObjetivo('titulo', evento.target.value)}
                  placeholder="Objetivo"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                />
                <input
                  value={formNuevoObjetivo.descripcion}
                  onChange={(evento) => onCambiarFormObjetivo('descripcion', evento.target.value)}
                  placeholder="Plan para conseguirlo"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                />
                <input
                  type="date"
                  value={formNuevoObjetivo.fechaObjetivo}
                  onChange={(evento) => onCambiarFormObjetivo('fechaObjetivo', evento.target.value)}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <button type="button" onClick={onAddObjetivo} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white">
                  Añadir
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {seguimientoActivo.objetivos.map((objetivo) => (
                  <div key={objetivo.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{objetivo.titulo}</p>
                        <p className="mt-1 text-xs text-slate-300">{objetivo.descripcion}</p>
                        <p className="mt-1 text-[11px] text-slate-400">Objetivo para {objetivo.fechaObjetivo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${colorEstadoObjetivo(objetivo.estado)}`}>
                          {objetivo.estado}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEliminarObjetivo(objetivo.id)}
                          className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={objetivo.progreso}
                        onChange={(evento) => onActualizarObjetivo(objetivo.id, { progreso: Number(evento.target.value) })}
                      />
                      <span className="text-xs font-semibold text-slate-100">{objetivo.progreso}%</span>
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={objetivo.estado === 'Conseguido'}
                          onChange={(evento) =>
                            onActualizarObjetivo(objetivo.id, {
                              estado: evento.target.checked ? 'Conseguido' : 'En progreso',
                              progreso: evento.target.checked ? 100 : Math.max(objetivo.progreso, 50),
                            })
                          }
                        />
                        Conseguido
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Evaluaciones periódicas</p>
              <div className="mt-3 grid gap-2 md:grid-cols-[180px_120px_1fr_auto]">
                <input
                  value={formNuevaEvaluacion.area}
                  onChange={(evento) => onCambiarFormEvaluacion('area', evento.target.value)}
                  placeholder="Área"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={formNuevaEvaluacion.puntuacion}
                  onChange={(evento) => onCambiarFormEvaluacion('puntuacion', evento.target.value)}
                  type="number"
                  min={1}
                  max={10}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={formNuevaEvaluacion.comentario}
                  onChange={(evento) => onCambiarFormEvaluacion('comentario', evento.target.value)}
                  placeholder="Comentario de evaluación"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <button type="button" onClick={onAddEvaluacion} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">
                  Guardar
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {evaluacionesOrdenadasActivo.map((evaluacion) => (
                  <div key={evaluacion.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{evaluacion.area}</p>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                        {evaluacion.puntuacion}/10
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{evaluacion.fecha}</p>
                    <p className="mt-2 text-xs text-slate-200">{evaluacion.comentario}</p>
                  </div>
                ))}
                {evaluacionesOrdenadasActivo.length === 0 ? (
                  <p className="text-xs text-slate-300">Todavía no hay evaluaciones registradas.</p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Vídeos de familia y feedback técnico</p>
              <p className="mt-1 text-xs text-slate-300">Usa enlaces compartidos de Drive, YouTube privado, Vimeo o almacenamiento interno. Evitamos incrustar archivos grandes en la base local.</p>
              <div className="mt-3 grid gap-2">
                <input
                  value={formNuevoVideo.titulo}
                  onChange={(evento) => onCambiarFormVideo('titulo', evento.target.value)}
                  placeholder="Título del vídeo"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={formNuevoVideo.url}
                  onChange={(evento) => onCambiarFormVideo('url', evento.target.value)}
                  placeholder="URL del vídeo"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <textarea
                  value={formNuevoVideo.comentarioFamilia}
                  onChange={(evento) => onCambiarFormVideo('comentarioFamilia', evento.target.value)}
                  placeholder="Comentario de la familia sobre el vídeo"
                  rows={3}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <button type="button" onClick={onAddVideo} className="rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white">
                  Añadir vídeo
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {seguimientoActivo.videos.map((video) => (
                  <div key={video.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{video.titulo}</p>
                        <p className="text-[11px] text-slate-400">{video.fecha}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${colorEstadoVideo(video.estado)}`}>
                        {video.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">Familia: {video.comentarioFamilia || 'Sin comentario.'}</p>
                    <textarea
                      value={video.comentarioStaff}
                      onChange={(evento) => onActualizarVideo(video.id, { comentarioStaff: evento.target.value })}
                      rows={3}
                      placeholder="Correcciones o feedback del staff / scouting"
                      className="mt-3 w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={video.estado}
                        onChange={(evento) => onActualizarVideo(video.id, { estado: evento.target.value as EstadoVideoJugador })}
                        className="rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Revisando">Revisando</option>
                        <option value="Corregido">Corregido</option>
                      </select>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100"
                      >
                        Abrir / descargar vídeo
                      </a>
                    </div>
                  </div>
                ))}
                {seguimientoActivo.videos.length === 0 ? (
                  <p className="text-xs text-slate-300">Todavía no hay vídeos asociados al jugador.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Canal con familia y responsables</p>
              <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_auto]">
                <select
                  value={formNuevoMensajeSeguimiento.autor}
                  onChange={(evento) => onCambiarFormMensaje('autor', evento.target.value)}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="Staff">Staff</option>
                  <option value="Familia">Familia</option>
                </select>
                <input
                  value={formNuevoMensajeSeguimiento.texto}
                  onChange={(evento) => onCambiarFormMensaje('texto', evento.target.value)}
                  placeholder="Nuevo mensaje para el hilo"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <button type="button" onClick={onAddMensaje} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white">
                  Enviar
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {seguimientoActivo.mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    className={`rounded-lg border p-3 ${
                      mensaje.autor === 'Staff'
                        ? 'border-cyan-300/20 bg-cyan-500/10'
                        : 'border-amber-300/20 bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white">{mensaje.autor}</p>
                      <p className="text-[11px] text-slate-300">{new Date(mensaje.fecha).toLocaleString('es-ES')}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-100">{mensaje.texto}</p>
                  </div>
                ))}
                {seguimientoActivo.mensajes.length === 0 ? (
                  <p className="text-xs text-slate-300">No hay mensajes todavía.</p>
                ) : null}
              </div>
            </section>
          </div>
        </>
      ) : (
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.18),transparent_35%),linear-gradient(160deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))] p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Portal del jugador</p>
              <h4 className="mt-2 text-3xl font-bold text-white">{jugadorActivo.nombre}</h4>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Esta es la vista que puede consultar jugador y familia para entender qué se está trabajando, por qué se está trabajando y cómo va evolucionando.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-100">
              <p>Responsables</p>
              <p className="mt-1 font-semibold text-white">
                {responsablesSeguimientoActivo.length > 0
                  ? responsablesSeguimientoActivo.map((entrenador) => entrenador.nombre).join(' · ')
                  : 'Pendiente de asignar'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Sus debilidades</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {seguimientoActivo.debilidades.map((debilidad) => (
                  <span key={debilidad} className="rounded-full border border-rose-300/25 bg-rose-500/10 px-3 py-1 text-xs text-rose-100">
                    {debilidad}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Qué está trabajando</p>
              <p className="mt-3 text-lg font-semibold text-white">{seguimientoActivo.focoActual}</p>
              <p className="mt-2 text-xs text-slate-300">
                {seguimientoActivo.objetivos.filter((objetivo) => objetivo.estado !== 'Conseguido').length} objetivos siguen abiertos.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Evolución mensual</p>
              <div className="mt-3 grid gap-2">
                {evolucionMensualJugadorActivo.map((item) => (
                  <div key={item.mes} className="grid grid-cols-[64px_1fr_50px] items-center gap-2 text-xs text-slate-200">
                    <span>{item.mes}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.valor}%` }} />
                    </div>
                    <span className="text-right">{item.valor}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Objetivos y plan para llegar</p>
              <div className="mt-4 grid gap-3">
                {seguimientoActivo.objetivos.map((objetivo) => (
                  <div key={objetivo.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{objetivo.titulo}</p>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${colorEstadoObjetivo(objetivo.estado)}`}>
                        {objetivo.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{objetivo.descripcion}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-fuchsia-400" style={{ width: `${objetivo.progreso}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Meta: {objetivo.fechaObjetivo}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Pequeño informe</p>
              {seguimientoActivo.informes[0] ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-slate-100">{seguimientoActivo.informes[0].resumen}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {seguimientoActivo.informes[0].hitos.map((hito) => (
                      <span key={hito} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100">
                        {hito}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-fuchsia-100">Siguiente paso: {seguimientoActivo.informes[0].siguientePaso}</p>
                </>
              ) : (
                <p className="mt-3 text-xs text-slate-300">El staff todavía no ha publicado un informe automático.</p>
              )}

              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white">Vídeo-feedback</p>
                <div className="mt-3 grid gap-3">
                  {seguimientoActivo.videos.slice(0, 3).map((video) => (
                    <div key={video.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-white">{video.titulo}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${colorEstadoVideo(video.estado)}`}>
                          {video.estado}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">Comentario familia: {video.comentarioFamilia || 'Sin comentario'}</p>
                      <p className="mt-2 text-xs text-slate-100">Feedback staff: {video.comentarioStaff || 'Pendiente de corrección.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Últimas sesiones</p>
              <div className="mt-3 grid gap-3">
                {sesionesJugadorActivo.slice(0, 4).map((sesion) => (
                  <div key={sesion.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <p className="text-xs font-semibold text-white">{sesion.fecha} · {sesion.hora} · {sesion.sede}</p>
                    <p className="mt-2 text-xs text-slate-300">{sesion.objetivo}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Hablar con responsables</p>
              <div className="mt-3 grid gap-3">
                {seguimientoActivo.mensajes.slice(0, 5).map((mensaje) => (
                  <div key={mensaje.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white">{mensaje.autor}</p>
                      <p className="text-[11px] text-slate-400">{new Date(mensaje.fecha).toLocaleDateString('es-ES')}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-200">{mensaje.texto}</p>
                  </div>
                ))}
                {seguimientoActivo.mensajes.length === 0 ? (
                  <p className="text-xs text-slate-300">No hay mensajes visibles todavía.</p>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      )}
    </>
  )
}
