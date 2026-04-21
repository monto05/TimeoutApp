import {
  bloquesRecurso,
  gruposRecurso,
  horasSugeridas,
} from '../data/appSeeds'
import { nivelesRecurso, posicionesRecurso } from '../config/appConfig'
import {
  archivoADataUrl,
  colorPrioridad,
  desplazarFechaISO,
  estiloSedePorIndice,
  inferirNivelRecurso,
  inferirPosicionRecurso,
  normalizarPosicionJugador,
  obtenerIniciales,
} from '../lib/appHelpers'
import { PlayerDevelopmentView } from '../modules/player-development/PlayerDevelopmentView'
import type { useAdministracion } from '../modules/administracion/useAdministracion'
import type { useCalendarManagement } from '../modules/calendar/useCalendarManagement'
import type { useJugadoresManagement } from '../modules/jugadores/useJugadoresManagement'
import type { usePlayerDevelopment } from '../modules/player-development/usePlayerDevelopment'
import type {
  Entrenador,
  FeedbackSesion,
  InterfazGestion,
  Jugador,
  PermisoUsuario,
  Recurso,
  Sede,
  SesionCalendario,
} from '../types/app'

const etiquetaInterfaz: Record<InterfazGestion, string> = {
  'gestion-jugadores': 'Jugadores',
  'gestion-player-development': 'Player Development System',
  'gestion-conceptos': 'Biblioteca de recursos',
  'gestion-entrenadores': 'Entrenadores',
  'gestion-calendario': 'Calendario',
  'gestion-permisos': 'Usuarios',
}

type Props = {
  // Navigation
  interfaz: InterfazGestion
  correoSesion: string
  hoy: string
  puedeEditar: boolean
  onVolverAlPanel: () => void
  onCerrarSesion: () => void
  // Store data
  jugadores: Jugador[]
  recursos: Recurso[]
  entrenadores: Entrenador[]
  sesiones: SesionCalendario[]
  feedbackSesiones: FeedbackSesion[]
  sedes: Sede[]
  permisos: PermisoUsuario[]
  jugadorActivoId: number
  setJugadorActivoId: React.Dispatch<React.SetStateAction<number>>
  entrenadorActivoId: number
  setEntrenadorActivoId: React.Dispatch<React.SetStateAction<number>>
  feedbackPorSesionId: Map<number, FeedbackSesion>
  // Feature hook return objects (destructured in component body)
  jugadoresM: ReturnType<typeof useJugadoresManagement>
  adminM: ReturnType<typeof useAdministracion>
  calendarM: ReturnType<typeof useCalendarManagement>
  playerDevM: ReturnType<typeof usePlayerDevelopment>
}

export function GestorView({
  interfaz,
  correoSesion,
  hoy,
  puedeEditar,
  onVolverAlPanel,
  onCerrarSesion,
  jugadores,
  recursos,
  entrenadores,
  sesiones: _sesiones,
  feedbackSesiones: _feedbackSesiones,
  sedes,
  permisos,
  jugadorActivoId,
  setJugadorActivoId,
  entrenadorActivoId,
  setEntrenadorActivoId,
  feedbackPorSesionId,
  jugadoresM,
  adminM,
  calendarM,
  playerDevM,
}: Props) {
  // Destructure hook return values so JSX can use original variable names
  const {
    jugadorActivo,
    formNuevoJugador, setFormNuevoJugador,
    mensajeJugador,
    grupoRecursoActivo, setGrupoRecursoActivo,
    posicionRecursoActiva, setPosicionRecursoActiva,
    nivelRecursoActivo, setNivelRecursoActivo,
    tabJugadorActiva, setTabJugadorActiva,
    recursosPendientes,
    posicionFiltroRecursosJugador,
    recursosVisibles,
    pendientesDelGrupo,
    comentariosJugadorActivo,
    anadirJugador,
    eliminarJugadorActivo,
    actualizarCampoJugadorActivo,
    actualizarProgresoAspecto,
    alternarRecursoTrabajado,
  } = jugadoresM

  const {
    entrenadorActivo,
    formNuevoConcepto, setFormNuevoConcepto,
    formNuevoEntrenador, setFormNuevoEntrenador,
    formNuevoPermiso, setFormNuevoPermiso,
    nuevaSede, setNuevaSede,
    mensajeSede, setMensajeSede,
    mensajeEntrenador,
    anadirConcepto,
    eliminarConcepto,
    anadirEntrenador,
    actualizarCampoEntrenadorActivo,
    eliminarEntrenadorActivo,
    anadirPermiso,
    eliminarPermiso,
    anadirSede,
    eliminarSede,
  } = adminM

  const {
    filtroFecha,
    formNuevaSesion, setFormNuevaSesion,
    formMatch, setFormMatch,
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
    sesionFeedbackAbiertaId, setSesionFeedbackAbiertaId,
    textoFeedbackSesion, setTextoFeedbackSesion,
    cambiarFechaActiva,
    alternarSeccionCalendario,
    alternarDisponibilidadJugador,
    alternarDisponibilidadEntrenador,
    alternarJugadorEnSesion,
    sugerirObjetivoSesionIA,
    anadirSesionCalendario,
    eliminarSesionCalendario,
    guardarFeedbackSesion,
    eliminarFeedbackSesion,
    descartarMatchActual,
    usarMatchEnSesion,
  } = calendarM

  const {
    seguimientoActivo,
    sesionesJugadorActivo,
    responsablesSeguimientoActivo,
    evaluacionesOrdenadasActivo,
    evolucionMensualJugadorActivo,
    tabActiva: tabPlayerDevelopmentActiva,
    setTabActiva: setTabPlayerDevelopmentActiva,
    nuevaDebilidad, setNuevaDebilidad,
    formNuevoObjetivo, setFormNuevoObjetivo,
    formNuevaEvaluacion, setFormNuevaEvaluacion,
    formNuevoVideo, setFormNuevoVideo,
    formNuevoMensajeSeguimiento, setFormNuevoMensajeSeguimiento,
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
  } = playerDevM

  return (
    <section
      className={`relative mx-auto grid w-full gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl lg:p-8 ${
        interfaz === 'gestion-calendario'
          ? 'max-w-[96rem] lg:grid-cols-[280px_minmax(0,1fr)]'
          : 'max-w-6xl lg:grid-cols-[330px_minmax(0,1fr)]'
      }`}
    >
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{etiquetaInterfaz[interfaz]}</h2>
            <p className="text-xs text-slate-300">Sesión: {correoSesion || 'sin correo'}</p>
          </div>
          <button
            type="button"
            onClick={onCerrarSesion}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>

        {interfaz === 'gestion-jugadores' || interfaz === 'gestion-player-development' ? (
          <>
            <div className="grid gap-3">
              {jugadores.map((jugador) => {
                const activo = jugador.id === jugadorActivoId
                return (
                  <button
                    key={jugador.id}
                    type="button"
                    onClick={() => setJugadorActivoId(jugador.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      activo
                        ? 'border-blue-400/60 bg-blue-500/15'
                        : 'border-white/10 bg-slate-950/30 hover:border-white/30 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {jugador.fotoUrl ? (
                        <img src={jugador.fotoUrl} alt={jugador.nombre} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-100">
                          {obtenerIniciales(jugador.nombre)}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-white">{jugador.nombre}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      {jugador.categoria} · {jugador.posicion}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{jugador.equipo}</p>
                  </button>
                )
              })}
            </div>

            {interfaz === 'gestion-player-development' && seguimientoActivo ? (
              <div className="mt-5 rounded-xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
                <p className="text-sm font-semibold text-white">Resumen de desarrollo</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-200">
                  <p>Foco actual: <span className="font-semibold text-white">{seguimientoActivo.focoActual}</span></p>
                  <p>Objetivos activos: <span className="font-semibold text-white">{seguimientoActivo.objetivos.filter((o) => o.estado !== 'Conseguido').length}</span></p>
                  <p>Vídeos pendientes: <span className="font-semibold text-white">{seguimientoActivo.videos.filter((v) => v.estado !== 'Corregido').length}</span></p>
                  <p>Responsables: <span className="font-semibold text-white">{responsablesSeguimientoActivo.length}</span></p>
                </div>
              </div>
            ) : null}

            {interfaz === 'gestion-jugadores' ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Añadir jugador</p>
                <div className="mt-3 grid gap-2">
                  <input
                    value={formNuevoJugador.nombre}
                    onChange={(e) => setFormNuevoJugador((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                    disabled={!puedeEditar}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                  />
                  <input
                    value={formNuevoJugador.fotoUrl}
                    onChange={(e) => setFormNuevoJugador((p) => ({ ...p, fotoUrl: e.target.value }))}
                    placeholder="URL foto"
                    disabled={!puedeEditar}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!puedeEditar}
                    onChange={async (e) => {
                      const archivo = e.target.files?.[0]
                      if (!archivo) return
                      const dataUrl = await archivoADataUrl(archivo)
                      setFormNuevoJugador((p) => ({ ...p, fotoUrl: dataUrl }))
                    }}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                  />
                  <input
                    value={formNuevoJugador.equipo}
                    onChange={(e) => setFormNuevoJugador((p) => ({ ...p, equipo: e.target.value }))}
                    placeholder="Equipo"
                    disabled={!puedeEditar}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formNuevoJugador.categoria}
                      onChange={(e) => setFormNuevoJugador((p) => ({ ...p, categoria: e.target.value }))}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {jugadoresM.categoriasJugador.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={formNuevoJugador.posicion}
                      onChange={(e) => setFormNuevoJugador((p) => ({ ...p, posicion: e.target.value }))}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {posicionesRecurso.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={formNuevoJugador.edad}
                    onChange={(e) => setFormNuevoJugador((p) => ({ ...p, edad: e.target.value }))}
                    type="number"
                    min={8}
                    max={45}
                    placeholder="Edad"
                    disabled={!puedeEditar}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={anadirJugador}
                    disabled={!puedeEditar}
                    className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                  >
                    Guardar jugador
                  </button>
                  {mensajeJugador ? <p className="text-xs text-slate-300">{mensajeJugador}</p> : null}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {interfaz === 'gestion-conceptos' ? (
          <div className="grid gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Filtros rápidos</p>
              <p className="mt-2 text-xs text-slate-300">Usa estos accesos para moverte por la biblioteca sin saturar la vista principal.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Grupo</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {gruposRecurso.map((grupo) => (
                  <button
                    key={grupo}
                    type="button"
                    onClick={() => setGrupoRecursoActivo(grupo)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      grupoRecursoActivo === grupo
                        ? 'border-blue-300/60 bg-blue-500/20 text-blue-100'
                        : 'border-white/20 bg-white/5 text-slate-200'
                    }`}
                  >
                    {grupo}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Posición</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {posicionesRecurso.map((posicion) => (
                  <button
                    key={posicion}
                    type="button"
                    onClick={() => setPosicionRecursoActiva(posicion)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      posicionRecursoActiva === posicion
                        ? 'border-violet-300/60 bg-violet-500/20 text-violet-100'
                        : 'border-white/20 bg-white/5 text-slate-200'
                    }`}
                  >
                    {posicion}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Nivel</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nivelesRecurso.map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setNivelRecursoActivo(nivel)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      nivelRecursoActivo === nivel
                        ? 'border-amber-300/60 bg-amber-500/20 text-amber-100'
                        : 'border-white/20 bg-white/5 text-slate-200'
                    }`}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {interfaz === 'gestion-entrenadores' ? (
          <div className="grid gap-3">
            {entrenadores.map((entrenador) => {
              const activo = entrenador.id === entrenadorActivoId
              return (
                <button
                  key={entrenador.id}
                  type="button"
                  onClick={() => setEntrenadorActivoId(entrenador.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    activo
                      ? 'border-blue-400/60 bg-blue-500/15'
                      : 'border-white/10 bg-slate-950/30 hover:border-white/30 hover:bg-slate-900/70'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{entrenador.nombre}</p>
                  <p className="mt-1 text-xs text-slate-300">{entrenador.especialidad}</p>
                  <p className="mt-1 text-xs text-slate-400">{entrenador.email}</p>
                </button>
              )
            })}
          </div>
        ) : null}

        {interfaz === 'gestion-calendario' ? (
          <div className="grid gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Resumen rápido</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-300">
                <p>Fecha activa: <span className="font-semibold text-slate-100">{filtroFecha}</span></p>
                <p>Sedes disponibles: <span className="font-semibold text-slate-100">{sedes.length}</span></p>
                <p>Sesiones del día: <span className="font-semibold text-slate-100">{sesionesDelDia.length}</span></p>
                <p>Jugadores disponibles: <span className="font-semibold text-slate-100">{jugadoresDisponiblesFecha.length}</span></p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Sedes</p>
              <div className="mt-3 grid gap-2">
                {sedes.map((sede) => (
                  <div key={sede} className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-slate-200">
                    {sede}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {interfaz === 'gestion-permisos' ? (
          <div className="grid gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Acceso actual</p>
              <p className="mt-2 text-xs text-slate-300">Correo activo: <span className="font-semibold text-slate-100">{correoSesion || 'sin sesión'}</span></p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Usuarios registrados</p>
              <div className="mt-3 grid gap-2">
                {permisos.map((permiso) => (
                  <div key={permiso.correo} className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-slate-200">
                    {permiso.correo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <article
        className={`rounded-2xl border border-white/10 bg-slate-900/40 p-6 ${
          interfaz === 'gestion-calendario' ? 'min-h-[82vh] p-7' : ''
        }`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm text-blue-200/90">Área de trabajo</p>
            <h3 className="mt-1 text-2xl font-bold text-white">{etiquetaInterfaz[interfaz]}</h3>
          </div>
          <button
            type="button"
            onClick={onVolverAlPanel}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            ← Volver al panel
          </button>
        </div>

        {/* ── Jugadores ── */}
        {interfaz === 'gestion-jugadores' && jugadorActivo ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-blue-200/90">Ficha de jugador</p>
                <div className="mt-2 flex items-center gap-3">
                  {jugadorActivo.fotoUrl ? (
                    <img src={jugadorActivo.fotoUrl} alt={jugadorActivo.nombre} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-100">
                      {obtenerIniciales(jugadorActivo.nombre)}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white">{jugadorActivo.nombre}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Categoría: <span className="font-medium text-slate-100">{jugadorActivo.categoria}</span> · Posición:{' '}
                  <span className="font-medium text-slate-100">{jugadorActivo.posicion}</span> · Edad:{' '}
                  <span className="font-medium text-slate-100">{jugadorActivo.edad}</span>
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Equipo: <span className="font-medium text-slate-100">{jugadorActivo.equipo}</span>
                </p>
              </div>
              <span className="rounded-full border border-blue-300/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
                Plan semanal
              </span>
            </header>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTabJugadorActiva('plan')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  tabJugadorActiva === 'plan'
                    ? 'border-blue-300/60 bg-blue-500/20 text-blue-100'
                    : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                Plan semanal
              </button>
              <button
                type="button"
                onClick={() => setTabJugadorActiva('comentarios')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  tabJugadorActiva === 'comentarios'
                    ? 'border-fuchsia-300/60 bg-fuchsia-500/20 text-fuchsia-100'
                    : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                Comentarios ({comentariosJugadorActivo.length})
              </button>
            </div>

            {tabJugadorActiva === 'plan' ? (
              <>
                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Editar jugador</p>
                    <button
                      type="button"
                      onClick={eliminarJugadorActivo}
                      className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25"
                    >
                      Eliminar jugador
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={jugadorActivo.nombre}
                      onChange={(e) => actualizarCampoJugadorActivo('nombre', e.target.value)}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      value={jugadorActivo.fotoUrl}
                      onChange={(e) => actualizarCampoJugadorActivo('fotoUrl', e.target.value)}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!puedeEditar}
                      onChange={async (e) => {
                        const archivo = e.target.files?.[0]
                        if (!archivo) return
                        const dataUrl = await archivoADataUrl(archivo)
                        actualizarCampoJugadorActivo('fotoUrl', dataUrl)
                      }}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                    />
                    <input
                      value={jugadorActivo.equipo}
                      onChange={(e) => actualizarCampoJugadorActivo('equipo', e.target.value)}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    />
                    <select
                      value={normalizarPosicionJugador(jugadorActivo.posicion)}
                      onChange={(e) => actualizarCampoJugadorActivo('posicion', e.target.value)}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {posicionesRecurso.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                    <input
                      value={jugadorActivo.edad}
                      type="number"
                      onChange={(e) => actualizarCampoJugadorActivo('edad', Number(e.target.value))}
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <section>
                    <h4 className="text-base font-semibold text-white">Aspectos a trabajar</h4>
                    <div className="mt-4 grid gap-4">
                      {jugadorActivo.aspectos.map((aspecto) => (
                        <div key={aspecto.nombre} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-100">{aspecto.nombre}</p>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colorPrioridad(aspecto.prioridad)}`}>
                              Prioridad {aspecto.prioridad}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-slate-300">
                              <span>Progreso</span>
                              <span>{aspecto.progreso}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={aspecto.progreso}
                              onChange={(e) => actualizarProgresoAspecto(aspecto.nombre, Number(e.target.value))}
                              disabled={!puedeEditar}
                              className="mb-2 w-full"
                            />
                            <div className="h-2 w-full rounded-full bg-white/10">
                              <div className="h-2 rounded-full bg-blue-400" style={{ width: `${aspecto.progreso}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-semibold text-white">Recursos a trabajar</h4>
                      <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        Pendientes: {recursosPendientes.length}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {gruposRecurso.map((grupo) => {
                        const activo = grupoRecursoActivo === grupo
                        return (
                          <button
                            key={grupo}
                            type="button"
                            onClick={() => setGrupoRecursoActivo(grupo)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              activo
                                ? 'border-blue-300/60 bg-blue-500/20 text-blue-100'
                                : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            {grupo}
                          </button>
                        )
                      })}
                    </div>

                    <p className="mt-3 rounded-lg border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                      Filtro automático por posición del jugador: <span className="font-semibold">{posicionFiltroRecursosJugador}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {nivelesRecurso.map((nivel) => {
                        const activo = nivelRecursoActivo === nivel
                        return (
                          <button
                            key={nivel}
                            type="button"
                            onClick={() => setNivelRecursoActivo(nivel)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              activo
                                ? 'border-amber-300/60 bg-amber-500/20 text-amber-100'
                                : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            {nivel}
                          </button>
                        )
                      })}
                    </div>

                    <p className="mt-3 text-xs text-slate-300">
                      Grupo activo: <span className="font-semibold text-slate-100">{grupoRecursoActivo}</span> · Pendientes del grupo:{' '}
                      <span className="font-semibold text-amber-200">{pendientesDelGrupo}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Posición activa: <span className="font-semibold text-slate-200">{posicionFiltroRecursosJugador}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Nivel activo: <span className="font-semibold text-slate-200">{nivelRecursoActivo}</span>
                    </p>

                    <div className="mt-4 grid gap-3">
                      {recursosVisibles.map((recurso) => {
                        const trabajado = jugadorActivo.recursosTrabajados.includes(recurso.id)
                        return (
                          <div key={recurso.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-100">{recurso.nombre}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {recurso.bloque} · {recurso.posicion ?? inferirPosicionRecurso(recurso.nombre)} · {recurso.nivel ?? inferirNivelRecurso(recurso.nombre)} · Método Timeout
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => alternarRecursoTrabajado(recurso.id)}
                                disabled={!puedeEditar}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  trabajado
                                    ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                                    : 'border-amber-300/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
                                }`}
                              >
                                {trabajado ? 'Trabajado' : 'Pendiente'}
                              </button>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">{recurso.descripcion}</p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <div className="mt-6 rounded-xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                  Sugerencia de sesión Timeout: Activación/Calentamiento → Conocer gesto técnico → Aplicación en contextos y handicaps → Volumen de tiro.
                </div>
                <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Regla metodológica: no cambiar de nivel hasta dominar los gestos en varios contextos y handicaps.
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Comentarios de sesiones</p>
                {comentariosJugadorActivo.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-300">Aún no hay feedback guardado para este jugador.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {comentariosJugadorActivo.map((feedback) => {
                      const entrenador = entrenadores.find((e) => e.id === feedback.entrenadorId)
                      return (
                        <div key={feedback.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                          <p className="text-xs font-semibold text-slate-100">
                            {feedback.fecha} · {feedback.hora} · {feedback.sede}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-300">Entrenador: {entrenador?.nombre ?? 'Sin entrenador'}</p>
                          <p className="mt-2 text-xs text-slate-200">{feedback.comentario}</p>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => eliminarFeedbackSesion(feedback.id)}
                              className="rounded border border-rose-300/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-100"
                            >
                              Eliminar comentario
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}

        {/* ── Player Development ── */}
        {interfaz === 'gestion-player-development' && jugadorActivo && seguimientoActivo ? (
          <PlayerDevelopmentView
            jugadorActivo={jugadorActivo}
            seguimientoActivo={seguimientoActivo}
            tabActiva={tabPlayerDevelopmentActiva}
            responsablesSeguimientoActivo={responsablesSeguimientoActivo}
            entrenadores={entrenadores}
            sesionesJugadorActivo={sesionesJugadorActivo}
            feedbackPorSesionId={feedbackPorSesionId}
            evaluacionesOrdenadasActivo={evaluacionesOrdenadasActivo}
            evolucionMensualJugadorActivo={evolucionMensualJugadorActivo}
            nuevaDebilidad={nuevaDebilidad}
            formNuevoObjetivo={formNuevoObjetivo}
            formNuevaEvaluacion={formNuevaEvaluacion}
            formNuevoVideo={formNuevoVideo}
            formNuevoMensajeSeguimiento={formNuevoMensajeSeguimiento}
            onCambiarTab={setTabPlayerDevelopmentActiva}
            onCambiarNuevaDebilidad={setNuevaDebilidad}
            onAddDebilidad={anadirDebilidadJugador}
            onRemoveDebilidad={eliminarDebilidadJugador}
            onActualizarFoco={(foco) =>
              actualizarSeguimientoActivo((s) => ({ ...s, focoActual: foco }))
            }
            onActualizarCadencia={(cadencia) =>
              actualizarSeguimientoActivo((s) => ({ ...s, cadenciaInforme: cadencia }))
            }
            onAlternarResponsable={alternarResponsableSeguimiento}
            onGenerarInforme={generarInformeJugador}
            onCambiarFormObjetivo={(campo, valor) =>
              setFormNuevoObjetivo((p) => ({ ...p, [campo]: valor }))
            }
            onAddObjetivo={anadirObjetivoJugador}
            onActualizarObjetivo={actualizarObjetivoJugador}
            onEliminarObjetivo={eliminarObjetivoJugador}
            onCambiarFormEvaluacion={(campo, valor) =>
              setFormNuevaEvaluacion((p) => ({ ...p, [campo]: valor }))
            }
            onAddEvaluacion={anadirEvaluacionJugador}
            onCambiarFormVideo={(campo, valor) =>
              setFormNuevoVideo((p) => ({ ...p, [campo]: valor }))
            }
            onAddVideo={anadirVideoJugador}
            onActualizarVideo={actualizarVideoJugador}
            onCambiarFormMensaje={(campo, valor) =>
              setFormNuevoMensajeSeguimiento((p) => ({
                ...p,
                [campo]: campo === 'autor' ? (valor as 'Staff' | 'Familia') : valor,
              }))
            }
            onAddMensaje={anadirMensajeSeguimiento}
          />
        ) : null}

        {/* ── Conceptos ── */}
        {interfaz === 'gestion-conceptos' ? (
          <>
            <header className="border-b border-white/10 pb-5">
              <p className="text-sm text-blue-200/90">Gestión metodológica</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Biblioteca de recursos</h3>
              <p className="mt-2 text-sm text-slate-300">Añade o elimina recursos para que todo el staff trabaje con la misma biblioteca metodológica.</p>
            </header>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Añadir recurso</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={formNuevoConcepto.nombre}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre del recurso"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                />
                <select
                  value={formNuevoConcepto.grupo}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, grupo: e.target.value as typeof formNuevoConcepto.grupo }))}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                >
                  {gruposRecurso.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
                <select
                  value={formNuevoConcepto.bloque}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, bloque: e.target.value as typeof formNuevoConcepto.bloque }))}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                >
                  {bloquesRecurso.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
                <select
                  value={formNuevoConcepto.posicion}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, posicion: e.target.value as typeof formNuevoConcepto.posicion }))}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                >
                  {posicionesRecurso.map((pos) => (<option key={pos} value={pos}>{pos}</option>))}
                </select>
                <select
                  value={formNuevoConcepto.nivel}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, nivel: e.target.value as typeof formNuevoConcepto.nivel }))}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                >
                  {nivelesRecurso.map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
                <input
                  value={formNuevoConcepto.descripcion}
                  onChange={(e) => setFormNuevoConcepto((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Descripción funcional"
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={anadirConcepto}
                className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
              >
                Guardar recurso
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {recursos.map((recurso) => {
                const totalJugadores = jugadores.length
                const trabajados = jugadores.filter((j) => j.recursosTrabajados.includes(recurso.id)).length
                const pendientes = totalJugadores - trabajados
                return (
                  <div key={recurso.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{recurso.nombre}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {recurso.grupo} · {recurso.bloque} · {recurso.posicion ?? inferirPosicionRecurso(recurso.nombre)} · {recurso.nivel ?? inferirNivelRecurso(recurso.nombre)} · Método Timeout
                        </p>
                        {totalJugadores > 0 && (
                          <div className="mt-2 flex gap-2">
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                              ✓ Trabajado: {trabajados}
                            </span>
                            <span className="rounded-full border border-amber-300/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                              ⏳ Pendiente: {pendientes}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarConcepto(recurso.id)}
                        className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25"
                      >
                        Eliminar
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{recurso.descripcion}</p>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}

        {/* ── Entrenadores ── */}
        {interfaz === 'gestion-entrenadores' ? (
          <>
            <header className="border-b border-white/10 pb-5">
              <p className="text-sm text-blue-200/90">Gestión de staff</p>
              <h3 className="mt-1 text-2xl font-bold text-white">CRUD de entrenadores</h3>
              <p className="mt-2 text-sm text-slate-300">Gestiona altas, ediciones y bajas del equipo de entrenadores de Timeout Workouts.</p>
            </header>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Añadir entrenador</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input value={formNuevoEntrenador.nombre} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre completo" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input value={formNuevoEntrenador.fotoUrl} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, fotoUrl: e.target.value }))} placeholder="URL foto" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input type="file" accept="image/*" disabled={!puedeEditar} onChange={async (e) => { const archivo = e.target.files?.[0]; if (!archivo) return; const dataUrl = await archivoADataUrl(archivo); setFormNuevoEntrenador((p) => ({ ...p, fotoUrl: dataUrl })) }} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white" />
                <input value={formNuevoEntrenador.especialidad} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, especialidad: e.target.value }))} placeholder="Especialidad" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input value={formNuevoEntrenador.experiencia} type="number" min={0} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, experiencia: e.target.value }))} placeholder="Años experiencia" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input value={formNuevoEntrenador.email} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, email: e.target.value }))} placeholder="Email" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input value={formNuevoEntrenador.telefono} onChange={(e) => setFormNuevoEntrenador((p) => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400 sm:col-span-2" />
              </div>
              <button type="button" onClick={anadirEntrenador} disabled={!puedeEditar} className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400">Guardar entrenador</button>
              {mensajeEntrenador ? <p className="mt-2 text-xs text-slate-300">{mensajeEntrenador}</p> : null}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
              <aside className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Listado de entrenadores</p>
                <div className="mt-3 grid gap-2">
                  {entrenadores.map((entrenador) => {
                    const activo = entrenadorActivo?.id === entrenador.id
                    return (
                      <button key={entrenador.id} type="button" onClick={() => setEntrenadorActivoId(entrenador.id)} className={`rounded-lg border px-3 py-2 text-left transition ${activo ? 'border-blue-400/60 bg-blue-500/15' : 'border-white/10 bg-slate-900/50 hover:border-white/30'}`}>
                        <div className="flex items-center gap-2">
                          {entrenador.fotoUrl ? (
                            <img src={entrenador.fotoUrl} alt={entrenador.nombre} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-100">{obtenerIniciales(entrenador.nombre)}</div>
                          )}
                          <p className="text-xs font-semibold text-white">{entrenador.nombre}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{entrenador.especialidad}</p>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <section className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                {entrenadorActivo ? (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Editar entrenador</p>
                      <button type="button" onClick={eliminarEntrenadorActivo} className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25">Eliminar entrenador</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input value={entrenadorActivo.nombre} onChange={(e) => actualizarCampoEntrenadorActivo('nombre', e.target.value)} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                      <input value={entrenadorActivo.fotoUrl} onChange={(e) => actualizarCampoEntrenadorActivo('fotoUrl', e.target.value)} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                      <input type="file" accept="image/*" disabled={!puedeEditar} onChange={async (e) => { const archivo = e.target.files?.[0]; if (!archivo) return; const dataUrl = await archivoADataUrl(archivo); actualizarCampoEntrenadorActivo('fotoUrl', dataUrl) }} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white" />
                      <input value={entrenadorActivo.especialidad} onChange={(e) => actualizarCampoEntrenadorActivo('especialidad', e.target.value)} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                      <input value={entrenadorActivo.experiencia} type="number" min={0} onChange={(e) => actualizarCampoEntrenadorActivo('experiencia', Number(e.target.value))} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                      <input value={entrenadorActivo.email} onChange={(e) => actualizarCampoEntrenadorActivo('email', e.target.value)} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                      <input value={entrenadorActivo.telefono} onChange={(e) => actualizarCampoEntrenadorActivo('telefono', e.target.value)} disabled={!puedeEditar} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none sm:col-span-2" />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-300">No hay entrenadores. Añade uno para empezar.</p>
                )}
              </section>
            </div>
          </>
        ) : null}

        {/* ── Permisos ── */}
        {interfaz === 'gestion-permisos' ? (
          <>
            <header className="border-b border-white/10 pb-5">
              <p className="text-sm text-blue-200/90">Control de acceso</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Gestión de usuarios por correo</h3>
              <p className="mt-2 text-sm text-slate-300">Define correos y contraseñas de acceso (sin jerarquía de roles).</p>
            </header>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Añadir o actualizar permiso</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input value={formNuevoPermiso.correo} onChange={(e) => setFormNuevoPermiso((p) => ({ ...p, correo: e.target.value }))} placeholder="correo@timeoutworkouts.com" className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <input type="password" value={formNuevoPermiso.password} onChange={(e) => setFormNuevoPermiso((p) => ({ ...p, password: e.target.value }))} placeholder="Contraseña (mínimo 4)" className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
              </div>
              <button type="button" onClick={anadirPermiso} className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400">Guardar usuario</button>
            </div>

            <div className="mt-5 grid gap-3">
              {permisos.map((permiso) => (
                <div key={permiso.correo} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{permiso.correo}</p>
                      <p className="text-xs text-slate-300">Usuario activo</p>
                    </div>
                    <button type="button" onClick={() => eliminarPermiso(permiso.correo)} className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* ── Calendario ── */}
        {interfaz === 'gestion-calendario' ? (
          <>
            <header className="border-b border-white/10 pb-5">
              <p className="text-sm text-blue-200/90">Planificación operativa</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Calendario de sesiones</h3>
              <p className="mt-2 text-sm text-slate-300">Un solo calendario operativo para navegar día por día.</p>
            </header>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <div className="rounded-lg border border-amber-300/30 bg-amber-500/85 px-4 py-3 text-center">
                <p className="text-base font-bold uppercase text-slate-900">{etiquetaFechaCalendario}</p>
                <p className="text-sm font-semibold text-slate-800">{filtroFecha}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => cambiarFechaActiva(desplazarFechaISO(filtroFecha, -1))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-white">← Día anterior</button>
                <button type="button" onClick={() => cambiarFechaActiva(desplazarFechaISO(filtroFecha, -7))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200">−7 días</button>
                <input type="date" value={filtroFecha} onChange={(e) => cambiarFechaActiva(e.target.value)} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                <button type="button" onClick={() => cambiarFechaActiva(hoy)} className="rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100">Hoy</button>
                <button type="button" onClick={() => cambiarFechaActiva(desplazarFechaISO(filtroFecha, 7))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200">+7 días</button>
                <button type="button" onClick={() => cambiarFechaActiva(desplazarFechaISO(filtroFecha, 1))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-white">Día siguiente →</button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Gestión de sedes</p>
              <p className="mt-1 text-xs text-slate-300">Puedes crear y eliminar sedes libremente; no hace falta que estén preestablecidas.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input value={nuevaSede} onChange={(e) => { setNuevaSede(e.target.value); setMensajeSede('') }} placeholder="Nueva sede" className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                <button type="button" onClick={anadirSede} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400">Añadir sede</button>
              </div>
              {mensajeSede ? <p className="mt-2 text-xs text-slate-300">{mensajeSede}</p> : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sedes.map((sede) => (
                  <div key={sede} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                    <span className="text-xs text-slate-100">{sede}</span>
                    <button type="button" onClick={() => eliminarSede(sede)} className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-100">Eliminar</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <button type="button" onClick={() => alternarSeccionCalendario('disponibilidad')} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white">
                Disponibilidad de jugadores
                <span>{seccionesCalendarioAbiertas.disponibilidad ? '−' : '+'}</span>
              </button>
              {seccionesCalendarioAbiertas.disponibilidad ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {jugadores.map((jugador) => {
                    const disponible = jugador.disponibilidadFechas.includes(filtroFecha)
                    return (
                      <button key={jugador.id} type="button" onClick={() => alternarDisponibilidadJugador(jugador.id, filtroFecha)} className={`rounded-lg border px-3 py-2 text-left text-xs transition ${disponible ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100' : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/30'}`}>
                        {jugador.nombre} · {jugador.equipo}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <button type="button" onClick={() => alternarSeccionCalendario('match')} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white">
                Match de jugadores (estilo swipe)
                <span>{seccionesCalendarioAbiertas.match ? '−' : '+'}</span>
              </button>
              {seccionesCalendarioAbiertas.match ? (
                <div className="mt-3">
                  {matchActual ? (
                    <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-4">
                      <p className="text-xs text-fuchsia-100">Compatibles para {filtroFecha}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{matchActual.jugadorA.nombre} ↔ {matchActual.jugadorB.nombre}</p>
                      <p className="mt-2 text-xs text-slate-200">Categoría: {matchActual.jugadorA.categoria} · Diferencia de edad: {matchActual.diferenciaEdad} año(s)</p>
                      <p className="mt-2 text-xs text-slate-200">Opciones para trabajar: {matchActual.recursosCompartidos.slice(0, 4).join(' · ')}</p>
                      <div className="mt-2">
                        <p className="text-[11px] text-slate-300">Selecciona una opción de trabajo:</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {matchActual.recursosCompartidos.map((opcion) => (
                            <button
                              key={`match-opcion-${opcion}`}
                              type="button"
                              onClick={() => setOpcionTrabajoMatchSeleccionada(opcion)}
                              className={`rounded border px-2 py-1 text-[10px] font-semibold transition ${
                                opcionTrabajoMatchSeleccionada === opcion
                                  ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                                  : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'
                              }`}
                            >
                              {opcion}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-fuchsia-100">Score compatibilidad: {matchActual.puntuacionCompatibilidad}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="grid gap-1">
                          <label className="text-[10px] text-slate-300">Hora</label>
                          <input type="time" value={formMatch.hora} onChange={(e) => setFormMatch((p) => ({ ...p, hora: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none" />
                          <div className="flex flex-wrap gap-1">
                            {horasSugeridas.map((hora) => (
                              <button key={`match-hora-${hora}`} type="button" onClick={() => setFormMatch((p) => ({ ...p, hora }))} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${formMatch.hora === hora ? 'border-blue-300/60 bg-blue-500/20 text-blue-100' : 'border-white/20 bg-white/5 text-slate-300'}`}>{hora}</button>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-1">
                          <label className="text-[10px] text-slate-300">Sede</label>
                          <select value={formMatch.sede} onChange={(e) => setFormMatch((p) => ({ ...p, sede: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none">
                            {sedes.map((sede) => (<option key={sede} value={sede}>{sede}</option>))}
                          </select>
                        </div>
                        <div className="grid gap-1">
                          <label className="text-[10px] text-slate-300">Entrenador</label>
                          <select value={formMatch.entrenadorId} onChange={(e) => setFormMatch((p) => ({ ...p, entrenadorId: Number(e.target.value) }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none">
                            <option value={0}>Seleccionar</option>
                            {entrenadores.map((ent) => (<option key={ent.id} value={ent.id}>{ent.nombre}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={descartarMatchActual} className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100">👎 Pasar</button>
                        <button type="button" onClick={usarMatchEnSesion} className="rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">✅ Agendar sesión</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">No hay parejas compatibles para ese día con disponibilidad, misma categoría, diferencia de edad ≤ 3 y recursos pendientes en común.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <button type="button" onClick={() => alternarSeccionCalendario('programar')} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white">
                Programar sesión
                <span>{seccionesCalendarioAbiertas.programar ? '−' : '+'}</span>
              </button>
              {seccionesCalendarioAbiertas.programar ? (
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs text-slate-300">Fecha</label>
                    <input type="date" value={formNuevaSesion.fecha} onChange={(e) => setFormNuevaSesion((p) => ({ ...p, fecha: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-slate-300">Hora</label>
                    <input type="time" value={formNuevaSesion.hora} onChange={(e) => setFormNuevaSesion((p) => ({ ...p, hora: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none" />
                    <div className="flex flex-wrap gap-1">
                      {horasSugeridas.map((hora) => (
                        <button key={`programar-hora-${hora}`} type="button" onClick={() => setFormNuevaSesion((p) => ({ ...p, hora }))} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${formNuevaSesion.hora === hora ? 'border-blue-300/60 bg-blue-500/20 text-blue-100' : 'border-white/20 bg-white/5 text-slate-300'}`}>{hora}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-slate-300">Sede</label>
                    <select value={formNuevaSesion.sede} onChange={(e) => setFormNuevaSesion((p) => ({ ...p, sede: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none">
                      {sedes.map((sede) => (<option key={sede} value={sede}>{sede}</option>))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-slate-300">Entrenador</label>
                    <select value={formNuevaSesion.entrenadorId} onChange={(e) => setFormNuevaSesion((p) => ({ ...p, entrenadorId: Number(e.target.value) }))} className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none">
                      <option value={0}>Seleccionar entrenador</option>
                      {entrenadores.map((ent) => (<option key={ent.id} value={ent.id}>{ent.nombre}</option>))}
                    </select>
                  </div>
                  <div className="grid gap-2 lg:col-span-2">
                    <label className="text-xs text-slate-300">Objetivo de la sesión</label>
                    <input value={formNuevaSesion.objetivo} onChange={(e) => setFormNuevaSesion((p) => ({ ...p, objetivo: e.target.value }))} placeholder="Ejemplo: C4-C6 + H1-H2 con foco en lectura" className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400" />
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={sugerirObjetivoSesionIA}
                        disabled={cargandoSugerenciaIA}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          cargandoSugerenciaIA
                            ? 'cursor-wait border-slate-500/40 bg-slate-600/20 text-slate-300'
                            : 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                        }`}
                      >
                        {cargandoSugerenciaIA ? 'Generando sugerencia...' : 'Sugerir objetivo con IA'}
                      </button>
                      {sugerenciaIA ? <span className="text-[11px] text-emerald-200">Objetivo autocompletado</span> : null}
                    </div>
                    {errorSugerenciaIA ? (
                      <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        {errorSugerenciaIA}
                      </p>
                    ) : null}
                    {sugerenciaIA ? (
                      <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-50">
                        <p className="font-semibold">Plan breve IA</p>
                        <p className="mt-1 leading-relaxed text-cyan-100">{sugerenciaIA.planBreve || 'Sin detalle adicional.'}</p>
                        {sugerenciaIA.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sugerenciaIA.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-2 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-300">Jugadores asignados</label>
                      <button type="button" onClick={() => setFormNuevaSesion((p) => ({ ...p, jugadorIds: jugadoresDisponiblesFecha.map((j) => j.id) }))} className="rounded-lg border border-blue-300/40 bg-blue-500/15 px-2 py-1 text-[11px] font-semibold text-blue-100">Cargar disponibles del día</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {jugadores.map((jugador) => {
                        const activo = formNuevaSesion.jugadorIds.includes(jugador.id)
                        const disponible = jugador.disponibilidadFechas.includes(formNuevaSesion.fecha)
                        return (
                          <button key={jugador.id} type="button" onClick={() => alternarJugadorEnSesion(jugador.id)} className={`rounded-lg border px-3 py-2 text-left text-xs transition ${activo ? 'border-blue-400/60 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/30'}`}>
                            {jugador.nombre} · {jugador.equipo}
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${disponible ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>{disponible ? 'Disponible' : 'No disponible'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button type="button" onClick={anadirSesionCalendario} disabled={jugadoresNoDisponiblesEnSesion.length > 0} className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition lg:col-span-2 ${jugadoresNoDisponiblesEnSesion.length > 0 ? 'cursor-not-allowed bg-slate-600/70' : 'bg-blue-500 hover:bg-blue-400'}`}>Guardar sesión</button>
                  {nuevaSesionTieneConflicto ? (
                    <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 lg:col-span-2">
                      <span className="font-semibold">⚠️ Atención:</span> Esta sesión está en conflicto (misma sede u otro entrenador ya tiene sesión a esa hora). Revisa si es intencional.
                    </p>
                  ) : null}
                  {jugadoresNoDisponiblesEnSesion.length > 0 ? (
                    <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 lg:col-span-2">
                      No se puede guardar: estos jugadores no están disponibles el día seleccionado ({formNuevaSesion.fecha}):{' '}
                      {jugadoresNoDisponiblesEnSesion.map((j) => j.nombre).join(', ')}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Calendario diario único</p>
              <p className="mt-1 text-xs text-slate-300">Colores por sede y fila de entrenadores completa. Pulsa un entrenador para marcarlo como no disponible.</p>
              <div className="mt-3 overflow-x-auto">
                <div className="min-w-[950px] rounded-xl border border-white/10 bg-slate-900/40">
                  <div className="grid" style={{ gridTemplateColumns: `90px repeat(${Math.max(sedes.length, 1)}, minmax(150px, 1fr))` }}>
                    <div className="border-b border-r border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Hora</div>
                    {sedes.map((sede, indice) => (
                      <div key={sede} className={`border-b border-r border-white/10 px-3 py-3 text-center text-sm font-semibold last:border-r-0 ${estiloSedePorIndice(indice).header}`}>
                        CANASTA {indice + 1}
                        <p className="mt-0.5 text-[11px] font-medium opacity-90">{sede}</p>
                      </div>
                    ))}

                    {horasAgendaDia.map((hora) => (
                      <div key={`fila-${hora}`} className="contents">
                        <div className="border-r border-t border-white/10 bg-white/5 px-3 py-4 text-center text-sm font-semibold text-slate-200">{hora}</div>
                        {sedes.map((sede) => {
                          const indiceSede = Math.max(0, sedes.indexOf(sede))
                          const sesionesCelda = sesionesDelDia.filter((s) => s.hora === hora && s.sede === sede)
                          return (
                            <div key={`${hora}-${sede}`} className={`min-h-[104px] border-r border-t border-white/10 px-2 py-2 last:border-r-0 ${estiloSedePorIndice(indiceSede).cell}`}>
                              {sesionesCelda.length > 0 ? (
                                <div className="grid gap-2">
                                  {sesionesCelda.map((sesion) => {
                                    const entrenador = entrenadores.find((e) => e.id === sesion.entrenadorId)
                                    const nombresJugadores = sesion.jugadorIds
                                      .map((id) => jugadores.find((j) => j.id === id)?.nombre)
                                      .filter(Boolean)
                                      .join(' · ')
                                    return (
                                      <div key={sesion.id} className={`rounded-lg border px-2 py-2 text-[11px] ${idsSesionesConConflicto.has(sesion.id) ? 'border-rose-300/40 bg-rose-500/15 text-rose-100' : 'border-white/10 bg-slate-950/55 text-slate-100'}`}>
                                        <p className="font-semibold">{entrenador?.nombre ?? 'Sin entrenador'}</p>
                                        <p className="mt-1 leading-relaxed text-slate-200">{nombresJugadores || 'Sin jugadores'}</p>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                          <span className="text-[10px] text-slate-300">{sesion.objetivo || 'Sin objetivo'}</span>
                                          <div className="flex items-center gap-1">
                                            {feedbackPorSesionId.has(sesion.id) ? (
                                              <span className="rounded border border-emerald-300/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">Feedback ✓</span>
                                            ) : null}
                                            <button type="button" onClick={() => { const existente = feedbackPorSesionId.get(sesion.id); setSesionFeedbackAbiertaId((actual) => (actual === sesion.id ? null : sesion.id)); setTextoFeedbackSesion(existente?.comentario ?? '') }} className="rounded border border-fuchsia-300/40 bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-100">📝</button>
                                            <button type="button" onClick={() => eliminarSesionCalendario(sesion.id)} className="rounded border border-rose-300/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-100">×</button>
                                          </div>
                                        </div>
                                        {sesionFeedbackAbiertaId === sesion.id ? (
                                          <div className="mt-2 grid gap-2">
                                            <textarea value={textoFeedbackSesion} onChange={(e) => setTextoFeedbackSesion(e.target.value)} placeholder="Feedback de la sesión (evolución, actitud, foco técnico, próximos pasos...)" className="min-h-[72px] rounded border border-white/15 bg-slate-900/70 px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-400" />
                                            <div className="flex justify-end gap-2">
                                              <button type="button" onClick={() => { setSesionFeedbackAbiertaId(null); setTextoFeedbackSesion('') }} className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold text-slate-200">Cancelar</button>
                                              <button type="button" onClick={() => guardarFeedbackSesion(sesion)} className="rounded border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100">Guardar feedback</button>
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="flex h-full min-h-[88px] items-center justify-center text-xs text-slate-500">Libre</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}

                    <div className="contents">
                      <div className="border-r border-t border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Coach</div>
                      {entrenadoresAsignadosPorSedeDia.map(({ sede, ids }, indice) => {
                        const estiloSede = estiloSedePorIndice(indice)
                        return (
                          <div key={`coach-${sede}`} className={`min-h-[82px] border-r border-t border-white/10 px-2 py-2 text-center last:border-r-0 ${estiloSede.coach}`}>
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {entrenadores.map((entrenador) => {
                                const noDisponible = entrenadoresNoDisponiblesDia.has(entrenador.id)
                                const asignadoEnSede = ids.has(entrenador.id)
                                return (
                                  <button key={`coach-chip-${sede}-${entrenador.id}`} type="button" onClick={() => alternarDisponibilidadEntrenador(entrenador.id)} className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition ${noDisponible ? 'border-rose-300/60 bg-rose-500/80 text-white' : asignadoEnSede ? estiloSede.chip : 'border-white/25 bg-slate-900/55 text-slate-200 hover:bg-slate-800/70'}`}>
                                    {entrenador.nombre}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!jugadorActivo && interfaz === 'gestion-jugadores' ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
            No hay jugadores activos. Añade uno desde el panel lateral para empezar.
          </div>
        ) : null}
      </article>
    </section>
  )
}
