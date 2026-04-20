import { useMemo, useState } from 'react'
import { normalizarCorreo, normalizarRecursos } from '../../lib/appHelpers'
import type {
  BloqueRecurso,
  Entrenador,
  FeedbackSesion,
  GrupoRecurso,
  Jugador,
  NivelRecurso,
  PermisoUsuario,
  PosicionRecurso,
  Recurso,
  Sede,
  SesionCalendario,
} from '../../types/app'

type Params = {
  recursos: Recurso[]
  setRecursos: React.Dispatch<React.SetStateAction<Recurso[]>>
  entrenadores: Entrenador[]
  setEntrenadores: React.Dispatch<React.SetStateAction<Entrenador[]>>
  sedes: Sede[]
  setSedes: React.Dispatch<React.SetStateAction<Sede[]>>
  permisos: PermisoUsuario[]
  setPermisos: React.Dispatch<React.SetStateAction<PermisoUsuario[]>>
  entrenadorActivoId: number
  setEntrenadorActivoId: React.Dispatch<React.SetStateAction<number>>
  jugadores: Jugador[]
  setJugadores: React.Dispatch<React.SetStateAction<Jugador[]>>
  sesiones: SesionCalendario[]
  setSesiones: React.Dispatch<React.SetStateAction<SesionCalendario[]>>
  feedbackSesiones: FeedbackSesion[]
  guardarAdministracionInmediatamente: (
    recursos: Recurso[],
    entrenadores: Entrenador[],
    permisos: PermisoUsuario[],
    sedes: Sede[],
  ) => Promise<void>
  guardarSesionesInmediatamente: (sesiones: SesionCalendario[], feedback: FeedbackSesion[]) => Promise<void>
  guardarJugadoresInmediatamente: (jugadores: Jugador[]) => Promise<void>
  puedeEditar: boolean
  registrarBloqueo: (motivo: string) => void
}

export function useAdministracion({
  recursos,
  setRecursos,
  entrenadores,
  setEntrenadores,
  sedes,
  setSedes,
  permisos,
  setPermisos,
  entrenadorActivoId,
  setEntrenadorActivoId,
  jugadores,
  setJugadores,
  sesiones,
  setSesiones,
  feedbackSesiones,
  guardarAdministracionInmediatamente,
  guardarSesionesInmediatamente,
  guardarJugadoresInmediatamente,
  puedeEditar,
  registrarBloqueo,
}: Params) {
  const [formNuevoConcepto, setFormNuevoConcepto] = useState({
    nombre: '',
    grupo: 'Recursos' as GrupoRecurso,
    bloque: 'Técnica' as BloqueRecurso,
    posicion: 'Base' as PosicionRecurso,
    nivel: 'Bronce' as NivelRecurso,
    descripcion: '',
  })

  const [formNuevoEntrenador, setFormNuevoEntrenador] = useState({
    nombre: '',
    fotoUrl: '',
    especialidad: '',
    experiencia: '1',
    email: '',
    telefono: '',
  })

  const [formNuevoPermiso, setFormNuevoPermiso] = useState({
    correo: '',
    password: '',
  })

  const [nuevaSede, setNuevaSede] = useState('')
  const [mensajeSede, setMensajeSede] = useState('')
  const [mensajeEntrenador, setMensajeEntrenador] = useState('')

  const entrenadorActivo = useMemo(
    () => entrenadores.find((e) => e.id === entrenadorActivoId) ?? entrenadores[0],
    [entrenadorActivoId, entrenadores],
  )

  // ── Conceptos/recursos ──────────────────────────────────────────────────────

  const anadirConcepto = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de añadir concepto sin permisos.')
      return
    }
    const nombre = formNuevoConcepto.nombre.trim()
    const descripcion = formNuevoConcepto.descripcion.trim()
    if (!nombre || !descripcion) return

    const siguienteId = Math.max(0, ...recursos.map((r) => r.id)) + 1
    const nuevoRecurso: Recurso = {
      id: siguienteId,
      nombre,
      grupo: formNuevoConcepto.grupo,
      bloque: formNuevoConcepto.bloque,
      posicion: formNuevoConcepto.posicion,
      nivel: formNuevoConcepto.nivel,
      descripcion,
    }

    const nuevosRecursos = normalizarRecursos([...recursos, nuevoRecurso])
    setRecursos(nuevosRecursos)
    void guardarAdministracionInmediatamente(nuevosRecursos, entrenadores, permisos, sedes)
    setFormNuevoConcepto((prev) => ({ ...prev, nombre: '', descripcion: '' }))
  }

  const eliminarConcepto = (recursoId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar concepto sin permisos.')
      return
    }
    const nuevosRecursos = recursos.filter((r) => r.id !== recursoId)
    const nuevosJugadores = jugadores.map((j) => ({
      ...j,
      recursosTrabajados: j.recursosTrabajados.filter((id) => id !== recursoId),
    }))
    setRecursos(nuevosRecursos)
    setJugadores(nuevosJugadores)
    void guardarAdministracionInmediatamente(nuevosRecursos, entrenadores, permisos, sedes)
    void guardarJugadoresInmediatamente(nuevosJugadores)
  }

  // ── Entrenadores ───────────────────────────────────────────────────────────

  const anadirEntrenador = () => {
    if (!puedeEditar) {
      setMensajeEntrenador('No tienes permisos de edición para añadir entrenadores.')
      registrarBloqueo('Intento de añadir entrenador sin permisos.')
      return
    }
    const nombre = formNuevoEntrenador.nombre.trim()
    const fotoUrl = formNuevoEntrenador.fotoUrl.trim()
    const especialidad = formNuevoEntrenador.especialidad.trim()
    const email = formNuevoEntrenador.email.trim()
    const telefono = formNuevoEntrenador.telefono.trim()
    const experiencia = Number(formNuevoEntrenador.experiencia)

    if (!nombre || !especialidad || !email || !telefono || Number.isNaN(experiencia)) {
      setMensajeEntrenador('Completa nombre, especialidad, email, teléfono y experiencia válidos.')
      return
    }

    const siguienteId = Math.max(0, ...entrenadores.map((e) => e.id)) + 1
    const nuevoEntrenador: Entrenador = { id: siguienteId, nombre, fotoUrl, especialidad, experiencia, email, telefono }

    const nuevosEntrenadores = [...entrenadores, nuevoEntrenador]
    setEntrenadores(nuevosEntrenadores)
    void guardarAdministracionInmediatamente(recursos, nuevosEntrenadores, permisos, sedes)
    setEntrenadorActivoId(siguienteId)
    setFormNuevoEntrenador({ nombre: '', fotoUrl: '', especialidad: '', experiencia: '1', email: '', telefono: '' })
    setMensajeEntrenador('Entrenador añadido correctamente.')
  }

  const actualizarCampoEntrenadorActivo = (campo: keyof Omit<Entrenador, 'id'>, valor: string | number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar entrenadores en modo visualizador.')
      return
    }
    if (!entrenadorActivo) return

    const nuevosEntrenadores = entrenadores.map((e) =>
      e.id === entrenadorActivo.id ? { ...e, [campo]: valor } : e,
    )
    setEntrenadores(nuevosEntrenadores)
    void guardarAdministracionInmediatamente(recursos, nuevosEntrenadores, permisos, sedes)
  }

  const eliminarEntrenadorActivo = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar entrenador sin permisos.')
      return
    }
    if (!entrenadorActivo) return

    const restantes = entrenadores.filter((e) => e.id !== entrenadorActivo.id)
    const nuevasSesiones = sesiones.filter((s) => s.entrenadorId !== entrenadorActivo.id)
    setEntrenadores(restantes)
    setEntrenadorActivoId(restantes[0]?.id ?? 0)
    setSesiones(nuevasSesiones)
    void guardarAdministracionInmediatamente(recursos, restantes, permisos, sedes)
    void guardarSesionesInmediatamente(nuevasSesiones, feedbackSesiones)
  }

  // ── Permisos ───────────────────────────────────────────────────────────────

  const anadirPermiso = () => {
    const correo = normalizarCorreo(formNuevoPermiso.correo)
    const password = formNuevoPermiso.password.trim()
    if (!correo.includes('@')) return

    const existente = permisos.find((p) => normalizarCorreo(p.correo) === correo)
    let nuevosPermisos = permisos
    if (existente) {
      nuevosPermisos = permisos.map((p) =>
        normalizarCorreo(p.correo) === correo ? { ...p, password: password || p.password } : p,
      )
    } else {
      if (password.length < 4) return
      nuevosPermisos = [...permisos, { correo, password }]
    }

    setPermisos(nuevosPermisos)
    void guardarAdministracionInmediatamente(recursos, entrenadores, nuevosPermisos, sedes)
    setFormNuevoPermiso({ correo: '', password: '' })
  }

  const eliminarPermiso = (correo: string) => {
    const nuevosPermisos = permisos.filter((p) => normalizarCorreo(p.correo) !== normalizarCorreo(correo))
    setPermisos(nuevosPermisos)
    void guardarAdministracionInmediatamente(recursos, entrenadores, nuevosPermisos, sedes)
  }

  // ── Sedes ──────────────────────────────────────────────────────────────────

  const anadirSede = () => {
    const nombre = nuevaSede.trim()
    if (!nombre) { setMensajeSede('Introduce un nombre de sede.'); return }

    const yaExiste = sedes.some((s) => s.trim().toLowerCase() === nombre.toLowerCase())
    if (yaExiste) { setMensajeSede('Esa sede ya existe.'); return }

    const nuevasSedes = [...sedes, nombre]
    setSedes(nuevasSedes)
    void guardarAdministracionInmediatamente(recursos, entrenadores, permisos, nuevasSedes)
    setNuevaSede('')
    setMensajeSede('Sede añadida.')
  }

  const eliminarSede = (sede: Sede) => {
    if (sedes.length <= 1) { setMensajeSede('Debe existir al menos una sede.'); return }

    const sedeEnUso = sesiones.some((s) => s.sede === sede)
    if (sedeEnUso) { setMensajeSede('No puedes eliminar una sede que ya tiene sesiones.'); return }

    const nuevasSedes = sedes.filter((s) => s !== sede)
    setSedes(nuevasSedes)
    void guardarAdministracionInmediatamente(recursos, entrenadores, permisos, nuevasSedes)
    setMensajeSede('Sede eliminada.')
  }

  return {
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
  }
}
