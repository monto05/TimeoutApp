export type Aspecto = {
  nombre: string
  prioridad: 'Alta' | 'Media' | 'Baja'
  progreso: number
}

export type GrupoRecurso = 'Recursos' | 'Dificultades' | 'Handicaps' | 'Sesión'

export type BloqueRecurso = 'Técnica' | 'Táctica'

export type PosicionRecurso = 'General' | 'Base' | 'Escolta' | 'Alero' | 'Ala Pívot' | 'Pívot'

export type NivelRecurso = 'Bronce' | 'Plata' | 'Azul' | 'Oro'

export type Jugador = {
  id: number
  nombre: string
  fotoUrl: string
  equipo: string
  categoria: string
  nivel?: string
  posicion: string
  edad: number
  aspectos: Aspecto[]
  recursosTrabajados: number[]
  disponibilidadFechas: string[]
}

export type Recurso = {
  id: number
  nombre: string
  grupo: GrupoRecurso
  bloque: BloqueRecurso
  posicion?: PosicionRecurso
  nivel?: NivelRecurso
  descripcion: string
}

export type Entrenador = {
  id: number
  nombre: string
  fotoUrl: string
  especialidad: string
  experiencia: number
  email: string
  telefono: string
}

export type Sede = string

export type SesionCalendario = {
  id: number
  fecha: string
  hora: string
  sede: Sede
  entrenadorId: number
  jugadorIds: number[]
  objetivo: string
}

export type FeedbackSesion = {
  id: number
  sesionId: number
  fecha: string
  hora: string
  sede: Sede
  entrenadorId: number
  jugadorIds: number[]
  objetivo: string
  comentario: string
  creadoEn: string
}

export type EstadoObjetivoJugador = 'Pendiente' | 'En progreso' | 'Conseguido'

export type EstadoVideoJugador = 'Pendiente' | 'Revisando' | 'Corregido'

export type AutorMensajeSeguimiento = 'Familia' | 'Staff'

export type CadenciaInforme = 'Semanal' | 'Quincenal' | 'Mensual'

export type ObjetivoJugador = {
  id: number
  titulo: string
  descripcion: string
  estado: EstadoObjetivoJugador
  progreso: number
  fechaObjetivo: string
}

export type EvaluacionJugador = {
  id: number
  jugadorId: number
  fecha: string
  area: string
  puntuacion: number
  comentario: string
}

export type VideoJugador = {
  id: number
  jugadorId: number
  fecha: string
  titulo: string
  url: string
  comentarioFamilia: string
  comentarioStaff: string
  estado: EstadoVideoJugador
}

export type MensajeSeguimiento = {
  id: number
  jugadorId: number
  fecha: string
  autor: AutorMensajeSeguimiento
  texto: string
}

export type InformeAutomaticoJugador = {
  id: number
  jugadorId: number
  fecha: string
  cadencia: CadenciaInforme
  resumen: string
  hitos: string[]
  siguientePaso: string
}

export type SeguimientoJugador = {
  jugadorId: number
  responsablesIds: number[]
  debilidades: string[]
  focoActual: string
  cadenciaInforme: CadenciaInforme
  objetivos: ObjetivoJugador[]
  evaluaciones: EvaluacionJugador[]
  videos: VideoJugador[]
  mensajes: MensajeSeguimiento[]
  informes: InformeAutomaticoJugador[]
}

export type PermisoUsuario = {
  correo: string
  password: string
}

export type InterfazGestion =
  | 'gestion-jugadores'
  | 'gestion-player-development'
  | 'gestion-conceptos'
  | 'gestion-entrenadores'
  | 'gestion-calendario'
  | 'gestion-permisos'

export type EstadoRemoto = {
  jugadores?: Jugador[] | null
  recursos?: Recurso[] | null
  entrenadores?: Entrenador[] | null
  sesiones?: SesionCalendario[] | null
  feedbackSesiones?: FeedbackSesion[] | null
  seguimientosJugadores?: SeguimientoJugador[] | null
  permisos?: PermisoUsuario[] | null
  sedes?: Sede[] | null
  updatedAt?: string | null
  versions?: {
    jugadores?: number
    recursos?: number
    entrenadores?: number
    sesiones?: number
    feedbackSesiones?: number
    seguimientosJugadores?: number
    permisos?: number
  }
}
