import { useMemo, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { useSnapshotSync } from './hooks/useSnapshotSync'
import { useAuth } from './modules/auth/useAuth'
import { useAdministracion } from './modules/administracion/useAdministracion'
import { useJugadoresManagement } from './modules/jugadores/useJugadoresManagement'
import { useCalendarManagement } from './modules/calendar/useCalendarManagement'
import { usePlayerDevelopment } from './modules/player-development/usePlayerDevelopment'
import { LoginView } from './views/LoginView'
import { PanelView } from './views/PanelView'
import { GestorView } from './views/GestorView'
import type { InterfazGestion } from './types/app'

function App() {
  const [vista, setVista] = useState<'inicio' | 'panel' | 'jugadores'>('inicio')
  const [interfaz, setInterfaz] = useState<InterfazGestion>('gestion-jugadores')
  const [modoControlInputs, setModoControlInputs] = useState(true)

  const hoy = new Date().toISOString().slice(0, 10)
  const puedeEditar = true
  const registrarBloqueo = (_motivo: string) => {}

  // ── Core state ───────────────────────────────────────────────────
  const store = useAppStore()

  // ── Remote sync ──────────────────────────────────────────────────
  const sync = useSnapshotSync({
    jugadores: store.jugadores,
    setJugadores: store.setJugadores,
    setJugadorActivoId: store.setJugadorActivoId,
    recursos: store.recursos,
    setRecursos: store.setRecursos,
    entrenadores: store.entrenadores,
    setEntrenadores: store.setEntrenadores,
    setEntrenadorActivoId: store.setEntrenadorActivoId,
    sesiones: store.sesiones,
    setSesiones: store.setSesiones,
    feedbackSesiones: store.feedbackSesiones,
    setFeedbackSesiones: store.setFeedbackSesiones,
    seguimientosJugadores: store.seguimientosJugadores,
    setSeguimientosJugadores: store.setSeguimientosJugadores,
    permisos: store.permisos,
    setPermisos: store.setPermisos,
    sedes: store.sedes,
    setSedes: store.setSedes,
  })

  // ── Feature hooks ────────────────────────────────────────────────
  const auth = useAuth({
    permisos: store.permisos,
    setPermisos: store.setPermisos,
    recursos: store.recursos,
    entrenadores: store.entrenadores,
    sedes: store.sedes,
    guardarAdministracionInmediatamente: sync.guardarAdministracionInmediatamente,
    onLoginSuccess: () => setVista('panel'),
  })

  const adminM = useAdministracion({
    recursos: store.recursos,
    setRecursos: store.setRecursos,
    entrenadores: store.entrenadores,
    setEntrenadores: store.setEntrenadores,
    sedes: store.sedes,
    setSedes: store.setSedes,
    permisos: store.permisos,
    setPermisos: store.setPermisos,
    entrenadorActivoId: store.entrenadorActivoId,
    setEntrenadorActivoId: store.setEntrenadorActivoId,
    jugadores: store.jugadores,
    setJugadores: store.setJugadores,
    sesiones: store.sesiones,
    setSesiones: store.setSesiones,
    feedbackSesiones: store.feedbackSesiones,
    guardarAdministracionInmediatamente: sync.guardarAdministracionInmediatamente,
    guardarSesionesInmediatamente: sync.guardarSesionesInmediatamente,
    guardarJugadoresInmediatamente: sync.guardarJugadoresInmediatamente,
    puedeEditar,
    registrarBloqueo,
  })

  const jugadoresM = useJugadoresManagement({
    jugadores: store.jugadores,
    setJugadores: store.setJugadores,
    jugadorActivoId: store.jugadorActivoId,
    setJugadorActivoId: store.setJugadorActivoId,
    setSeguimientosJugadores: store.setSeguimientosJugadores,
    recursos: store.recursos,
    feedbackSesiones: store.feedbackSesiones,
    guardarJugadoresInmediatamente: sync.guardarJugadoresInmediatamente,
    puedeEditar,
    registrarBloqueo,
    timestampCambiosLocales: sync.timestampCambiosLocales,
  })

  const calendarM = useCalendarManagement({
    jugadores: store.jugadores,
    setJugadores: store.setJugadores,
    entrenadores: store.entrenadores,
    recursos: store.recursos,
    sedes: store.sedes,
    sesiones: store.sesiones,
    setSesiones: store.setSesiones,
    feedbackSesiones: store.feedbackSesiones,
    setFeedbackSesiones: store.setFeedbackSesiones,
    guardarSesionesInmediatamente: sync.guardarSesionesInmediatamente,
    guardarJugadoresInmediatamente: sync.guardarJugadoresInmediatamente,
    puedeEditar,
    registrarBloqueo,
  })

  // Shared derived value used by both playerDevM and GestorView
  const feedbackPorSesionId = useMemo(
    () => new Map(store.feedbackSesiones.map((f) => [f.sesionId, f])),
    [store.feedbackSesiones],
  )

  const playerDevM = usePlayerDevelopment({
    jugadorActivo: jugadoresM.jugadorActivo,
    jugadores: store.jugadores,
    entrenadores: store.entrenadores,
    sesiones: store.sesiones,
    feedbackPorSesionId,
    comentariosJugadorActivo: jugadoresM.comentariosJugadorActivo,
    seguimientosJugadores: store.seguimientosJugadores,
    setSeguimientosJugadores: store.setSeguimientosJugadores,
    puedeEditar,
    registrarBloqueo,
    timestampCambiosLocales: sync.timestampCambiosLocales,
  })

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCerrarSesion = () => {
    auth.resetearSesion()
    setVista('inicio')
  }

  const handleAbrirInterfaz = (siguiente: InterfazGestion) => {
    setInterfaz(siguiente)
    setVista('jugadores')
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f33_0%,_transparent_60%)]" />

      {vista !== 'inicio' ? (
        <div className="relative mb-6 flex items-center justify-end gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={modoControlInputs}
              onChange={(e) => setModoControlInputs(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-400"
            />
            Controles de depuración
          </label>
        </div>
      ) : null}

      {vista === 'inicio' ? (
        <LoginView
          correoLogin={auth.correoLogin}
          setCorreoLogin={auth.setCorreoLogin}
          passwordLogin={auth.passwordLogin}
          setPasswordLogin={auth.setPasswordLogin}
          modoAcceso={auth.modoAcceso}
          pasoLogin={auth.pasoLogin}
          setPasoLogin={auth.setPasoLogin}
          mensajeLogin={auth.mensajeLogin}
          setMensajeLogin={auth.setMensajeLogin}
          correoRegistro={auth.correoRegistro}
          setCorreoRegistro={auth.setCorreoRegistro}
          passwordRegistro={auth.passwordRegistro}
          setPasswordRegistro={auth.setPasswordRegistro}
          confirmacionRegistro={auth.confirmacionRegistro}
          setConfirmacionRegistro={auth.setConfirmacionRegistro}
          mensajeRegistro={auth.mensajeRegistro}
          setMensajeRegistro={auth.setMensajeRegistro}
          cambiarModoAcceso={auth.cambiarModoAcceso}
          iniciarSesion={auth.iniciarSesion}
          registrarNuevoUsuario={auth.registrarNuevoUsuario}
        />
      ) : vista === 'panel' ? (
        <PanelView
          correoSesion={auth.correoSesion}
          onAbrirInterfaz={handleAbrirInterfaz}
          onCerrarSesion={handleCerrarSesion}
        />
      ) : (
        <GestorView
          interfaz={interfaz}
          correoSesion={auth.correoSesion}
          hoy={hoy}
          puedeEditar={puedeEditar}
          onVolverAlPanel={() => setVista('panel')}
          onCerrarSesion={handleCerrarSesion}
          jugadores={store.jugadores}
          recursos={store.recursos}
          entrenadores={store.entrenadores}
          sesiones={store.sesiones}
          feedbackSesiones={store.feedbackSesiones}
          sedes={store.sedes}
          permisos={store.permisos}
          jugadorActivoId={store.jugadorActivoId}
          setJugadorActivoId={store.setJugadorActivoId}
          entrenadorActivoId={store.entrenadorActivoId}
          setEntrenadorActivoId={store.setEntrenadorActivoId}
          feedbackPorSesionId={feedbackPorSesionId}
          jugadoresM={jugadoresM}
          adminM={adminM}
          calendarM={calendarM}
          playerDevM={playerDevM}
        />
      )}
    </main>
  )
}

export default App
