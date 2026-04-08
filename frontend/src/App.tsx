import { useEffect, useMemo, useRef, useState } from 'react'

// Asigna clases CSS según la prioridad de un aspecto
const colorPrioridad = (prioridad: 'Alta' | 'Media' | 'Baja') => {
  switch (prioridad) {
    case 'Alta':
      return 'bg-rose-600/80 text-white border-rose-300/40'
    case 'Media':
      return 'bg-amber-500/80 text-slate-900 border-amber-300/40'
    default:
      return 'bg-slate-700/60 text-slate-200 border-white/10'
  }
}

type Aspecto = {
  nombre: string
  prioridad: 'Alta' | 'Media' | 'Baja'
  progreso: number
}

type GrupoRecurso = 'Recursos' | 'Dificultades' | 'Handicaps' | 'Sesión'

type BloqueRecurso = 'Técnica' | 'Táctica'

type PosicionRecurso = 'General' | 'Base' | 'Escolta' | 'Alero' | 'Ala Pívot' | 'Pívot'

type NivelRecurso = 'Bronce' | 'Plata' | 'Azul' | 'Oro'

type Jugador = {
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

type Recurso = {
  id: number
  nombre: string
  grupo: GrupoRecurso
  bloque: BloqueRecurso
  posicion?: PosicionRecurso
  nivel?: NivelRecurso
  descripcion: string
}

type Entrenador = {
  id: number
  nombre: string
  fotoUrl: string
  especialidad: string
  experiencia: number
  email: string
  telefono: string
}

type Sede = string

type SesionCalendario = {
  id: number
  fecha: string
  hora: string
  sede: Sede
  entrenadorId: number
  jugadorIds: number[]
  objetivo: string
}

type PermisoUsuario = {
  correo: string
  password: string
}

type EstadoRemoto = {
  jugadores?: Jugador[] | null
  recursos?: Recurso[] | null
  entrenadores?: Entrenador[] | null
  sesiones?: SesionCalendario[] | null
  permisos?: PermisoUsuario[] | null
  sedes?: Sede[] | null
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
const API_STATE_URL = `${API_BASE_URL}/api/state`
const API_SYNC_DEBOUNCE_MS = 900

const permisosIniciales: PermisoUsuario[] = [
  { correo: 'direccion@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'staff@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'coordinacion@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'viewer@timeoutworkouts.com', password: 'timeout123' },
]

const sedesIniciales: Sede[] = ['GreenField', 'Colegio Aleman', 'Tajamr']

const STORAGE_KEYS = {
  jugadores: 'timeout_app_jugadores',
  recursos: 'timeout_app_recursos',
  entrenadores: 'timeout_app_entrenadores',
  sesiones: 'timeout_app_sesiones',
  permisos: 'timeout_app_permisos',
  sedes: 'timeout_app_sedes',
} as const

// Niveles metodológicos
const LEVELS: { key: string; threshold: number }[] = [
  { key: 'Skills (Bronce)', threshold: 0 },
  { key: 'Game Skills (Plata)', threshold: 100 },
  { key: 'Game Action (Azul)', threshold: 400 },
  { key: 'Player To Go (Oro)', threshold: 1200 },
]

const PASSWORD_INICIAL = 'timeout123'
const posicionesRecurso: PosicionRecurso[] = ['Base', 'Escolta', 'Alero', 'Ala Pívot', 'Pívot']
const nivelesRecurso: NivelRecurso[] = ['Bronce', 'Plata', 'Azul', 'Oro']

function normalizarNivelJugador(categoria: string, nivel?: string): NivelRecurso {
  const valor = `${categoria} ${nivel ?? ''}`.toLowerCase()
  if (valor.includes('oro')) return 'Oro'
  if (valor.includes('azul') || valor.includes('raising')) return 'Azul'
  if (valor.includes('plata') || valor.includes('standard')) return 'Plata'
  return 'Bronce'
}

function normalizarPosicionJugador(posicion: string): PosicionRecurso {
  const valor = posicion.trim().toLowerCase()
  if (valor.includes('base')) return 'Base'
  if (valor.includes('escolta') || valor.includes('silla')) return 'Escolta'
  if (valor.includes('alero')) return 'Alero'
  if (valor.includes('ala') && valor.includes('piv')) return 'Ala Pívot'
  if (valor.includes('pivot') || valor.includes('pívot')) return 'Pívot'
  return 'Base'
}

function inferirPosicionRecurso(nombre: string): PosicionRecurso {
  const prefijo = nombre.split('·')[0].trim().toUpperCase()
  if (prefijo.startsWith('BASE')) return 'Base'
  if (prefijo.startsWith('ESCOLTA')) return 'Escolta'
  if (prefijo.startsWith('ALERO')) return 'Alero'
  if (prefijo.startsWith('ALA PÍVOT') || prefijo.startsWith('ALA PIVOT')) return 'Ala Pívot'
  if (prefijo.startsWith('PÍVOT') || prefijo.startsWith('PIVOT')) return 'Pívot'
  return 'General'
}

function inferirNivelRecurso(nombre: string): NivelRecurso {
  const code = nombre.split('·')[0].trim()
  if (/^M[1-7]\b/i.test(code)) return 'Bronce'
  if (/^C[1-3]\b/i.test(code)) return 'Bronce'
  if (/^C[4-6]\b/i.test(code)) return 'Plata'
  if (/^C[7-9]\b/i.test(code)) return 'Azul'
  if (/^C10\b/i.test(code)) return 'Oro'
  if (/^D1\b/i.test(code)) return 'Bronce'
  if (/^D2\b/i.test(code)) return 'Plata'
  if (/^D3\b/i.test(code)) return 'Azul'
  if (/^D4\b/i.test(code)) return 'Oro'
  if (/^H1\b/i.test(code)) return 'Plata'
  if (/^H2\b/i.test(code)) return 'Bronce'
  if (/^H3\b/i.test(code)) return 'Oro'
  if (/^H4\b/i.test(code)) return 'Azul'
  if (/^BASE\b|^ESCOLTA\b/i.test(code)) return 'Plata'
  if (/^ALEROS\b/i.test(code)) return 'Azul'
  if (/^ALA PÍVOT\b|^ALA PIVOT\b|^PÍVOT\b|^PIVOT\b/i.test(code)) return 'Oro'
  return 'Bronce'
}

function normalizarGrupoRecurso(grupo: GrupoRecurso): GrupoRecurso {
  if (grupo === 'Dificultades' || grupo === 'Handicaps' || grupo === 'Sesión') return grupo
  return 'Recursos'
}

function normalizarBloqueRecurso(bloque: BloqueRecurso): BloqueRecurso {
  if (bloque === 'Técnica') return bloque
  return 'Técnica'
}

function normalizarRecursos(recursos: Recurso[]): Recurso[] {
  return recursos.map((recurso) => ({
    ...recurso,
    grupo: normalizarGrupoRecurso(recurso.grupo),
    bloque: normalizarBloqueRecurso(recurso.bloque),
    posicion: recurso.posicion ?? inferirPosicionRecurso(recurso.nombre),
    nivel: recurso.nivel ?? inferirNivelRecurso(recurso.nombre),
  }))
}

function leerStorage<T>(clave: string, valorInicial: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    if (!crudo) return valorInicial
    return JSON.parse(crudo) as T
  } catch {
    return valorInicial
  }
}

function normalizarCorreo(correo: string) {
  return correo.trim().toLowerCase()
}

function normalizarJugadores(jugadores: Jugador[]): Jugador[] {
  return jugadores.map((jugador) => ({
    ...jugador,
    fotoUrl: jugador.fotoUrl ?? '',
    disponibilidadFechas: jugador.disponibilidadFechas ?? [],
    nivel: jugador.nivel ?? jugador.categoria ?? 'Skills (Bronce)',
  }))
}

function normalizarEntrenadores(entrenadores: Entrenador[]): Entrenador[] {
  return entrenadores.map((entrenador) => ({
    ...entrenador,
    fotoUrl: entrenador.fotoUrl ?? '',
  }))
}

function mezclarRecursosConIniciales(recursosActuales: Recurso[]): Recurso[] {
  const porId = new Map<number, Recurso>()
  normalizarRecursos(recursosIniciales).forEach((recurso) => porId.set(recurso.id, recurso))
  normalizarRecursos(recursosActuales).forEach((recurso) => porId.set(recurso.id, recurso))
  return Array.from(porId.values()).sort((a, b) => a.id - b.id)
}

function normalizarPermisos(permisos: PermisoUsuario[]): PermisoUsuario[] {
  const normalizados = permisos
    .map((permiso) => ({
    correo: normalizarCorreo(permiso.correo ?? ''),
    password: String(permiso.password ?? PASSWORD_INICIAL),
    }))
    .filter((permiso) => permiso.correo.includes('@'))

  if (normalizados.length > 0) return normalizados

  return permisosIniciales.map((permiso) => ({
    correo: normalizarCorreo(permiso.correo),
    password: String(permiso.password ?? PASSWORD_INICIAL),
  }))
}

function normalizarSedes(sedes: Sede[]): Sede[] {
  const unicas = new Set(
    sedes
      .map((sede) => String(sede ?? '').trim())
      .filter(Boolean),
  )

  return Array.from(unicas)
}

const recursosIniciales: Recurso[] = [
  {
    id: 1,
    nombre: 'C1 · 1c1 lateral o frontal',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Atacar desde triple amenaza en estático.',
  },
  {
    id: 2,
    nombre: 'C2 · 1c1 en carrera',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Llegada agresiva desde desventaja o ventaja dinámica.',
  },
  {
    id: 3,
    nombre: 'C3 · Closeouts',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Atacar tras recuperación defensiva en ventaja o equilibrio.',
  },
  {
    id: 4,
    nombre: 'C4 · Bloqueo directo central/lateral',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Aplicar lecturas ante show, flat, under, switch y variantes.',
  },
  {
    id: 5,
    nombre: 'C5 · Situaciones de juego',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Crear contextos con BD (zipper, DHO + BD).',
  },
  {
    id: 6,
    nombre: 'C6 · BI (lectura del defensor)',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Leer defensor por encima, por debajo y en contacto.',
  },
  {
    id: 7,
    nombre: 'C7 · Pick and pop',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Jugar desde recepción abierta con toma de decisión rápida.',
  },
  {
    id: 8,
    nombre: 'C8 · Poste bajo/alto',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Jugar con espalda/cara, pivotes, fintas y contacto real.',
  },
  {
    id: 9,
    nombre: 'C9 · Continuaciones del roll',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'Sellar y decidir entre deep roll o short roll.',
  },
  {
    id: 10,
    nombre: 'C10 · Tiro en situación real',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Mecánica, cognitivo, paradas y punteos en contexto de juego.',
  },
  {
    id: 11,
    nombre: 'D1 · Proximidad defensiva',
    grupo: 'Dificultades',
    bloque: 'Táctica',
    descripcion: 'Defensor bien posicionado y equilibrado: cerca/contacto vs media distancia.',
  },
  {
    id: 12,
    nombre: 'D2 · Espacio limitado',
    grupo: 'Dificultades',
    bloque: 'Táctica',
    descripcion: 'Detectar espacio colapsado o libre para acelerar y atacar.',
  },
  {
    id: 13,
    nombre: 'D3 · Control del ritmo',
    grupo: 'Dificultades',
    bloque: 'Técnica',
    descripcion: 'Acelerar, frenar, pausar y variar tipos de bote con intención.',
  },
  {
    id: 14,
    nombre: 'D4 · Recuperación defensiva',
    grupo: 'Dificultades',
    bloque: 'Táctica',
    descripcion: 'Resolver early cut y late cut con contra-movimientos o finalización rápida.',
  },
  {
    id: 15,
    nombre: 'H1 · Posición inicial del defensor',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Introducir presión, hombro con hombro, desventaja y acciones previas.',
  },
  {
    id: 16,
    nombre: 'H2 · Reglas espacio-temporales',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Delimitar zona de 1c1 e incorporar cuenta atrás.',
  },
  {
    id: 17,
    nombre: 'H3 · Limitaciones defensivas',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Condicionar al defensor (por ejemplo, solo un brazo).',
  },
  {
    id: 18,
    nombre: 'H4 · Condiciones ofensivas',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Obligaciones ofensivas y puntuaciones con acciones encadenadas.',
  },
  {
    id: 19,
    nombre: 'Sesión 0 · Finalizaciones técnicas',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: 'Evaluar precisión, velocidad y adaptabilidad desde distintos ángulos.',
  },
  {
    id: 20,
    nombre: 'Sesión Timeout · Volumen de tiro',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: 'Bloque de alto volumen tras activación, gesto técnico y contextualización.',
  },
  {
    id: 21,
    nombre: 'M1 · Manipulación de balón',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Control fino de balón con ambas manos en estático y desplazamiento.',
  },
  {
    id: 22,
    nombre: 'M2 · Correr con el balón',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Bote en carrera con cambios de ritmo y protección.',
  },
  {
    id: 23,
    nombre: 'M3 · Ritmo de bote',
    grupo: 'Dificultades',
    bloque: 'Técnica',
    descripcion: 'Alternar cadencias de bote y pausas para crear ventaja.',
  },
  {
    id: 24,
    nombre: 'M4 · Cambios de altura',
    grupo: 'Dificultades',
    bloque: 'Técnica',
    descripcion: 'Transiciones alto-bajo para proteger y acelerar.',
  },
  {
    id: 25,
    nombre: 'M5 · Parar y arrancar',
    grupo: 'Dificultades',
    bloque: 'Táctica',
    descripcion: 'Frenadas y nuevas aceleraciones con control de equilibrio.',
  },
  {
    id: 26,
    nombre: 'M6 · Movimiento de pies',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Coordinación de apoyos para salida, parada y finalización.',
  },
  {
    id: 27,
    nombre: 'M7 · Engaño de mirada/cintura/hombro',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Uso de fintas corporales para desplazar al defensor.',
  },
  {
    id: 28,
    nombre: 'BASE · Finalizaciones reactivas',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: '1 paso, mismo pie y mano, mano contraria, batida, spin, reverso, euro-step.',
  },
  {
    id: 29,
    nombre: 'BASE · Contactos y apoyos',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Bump+batida/apoyo/euro-step, sobre agarre+batida, stride stop, floater, swing step.',
  },
  {
    id: 30,
    nombre: 'BASE · Catch (fintas + salidas)',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Side jab, cross, lilliard, spin pivot, catch&go, salidas sin pausa, split catch.',
  },
  {
    id: 31,
    nombre: 'BASE · Tiro reactivo',
    grupo: 'Dificultades',
    bloque: 'Técnica',
    descripcion: 'Hop, 1-2, 1-hop, bote, step in, negativa, side step, recortar.',
  },
  {
    id: 32,
    nombre: 'BASE · Footwork carrera/desequilibrio/frenada',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'In&out, in&out+cross, push cross, drop, BTL/BTB, cross step, under drag, partial stop.',
  },
  {
    id: 33,
    nombre: 'ESCOLTA · Finalizaciones y apoyos laterales',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: '1 paso, mismo pie y mano, mano contraria, batida, floater, runner, spin, stride stop.',
  },
  {
    id: 34,
    nombre: 'ESCOLTA · Contactos por bote y agarre',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Bump+step, bump+runner, bump+euro, bump+swing, veer finish, body-body.',
  },
  {
    id: 35,
    nombre: 'ESCOLTA · Catch y generar espacio',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Side jab, cross, lilliard, spin pivot, catch&go, split catch, hip rotation+combos.',
  },
  {
    id: 36,
    nombre: 'ESCOLTA · Tiro + footwork',
    grupo: 'Dificultades',
    bloque: 'Táctica',
    descripcion: 'Reactivo (hop, 1-2, step-in, side-step) y gestos de carrera/frenada (push cross, under drag).',
  },
  {
    id: 37,
    nombre: 'ALEROS · Finalizaciones',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: '1 paso, mismo pie y mano, mano contraria, batida, spin, swing, euro, slow-step.',
  },
  {
    id: 38,
    nombre: 'ALEROS · Contactos y por fondo',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Bump+step/runner/euro/swing, veer finish, body-body, atacar+step-through, spin.',
  },
  {
    id: 39,
    nombre: 'ALEROS · Catch',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Side jab, cross, spin pivot, shimmy, catch&go, catch+push, split catch, estampida.',
  },
  {
    id: 40,
    nombre: 'ALEROS · Tiro reactivo',
    grupo: 'Dificultades',
    bloque: 'Técnica',
    descripcion: 'Hop, 1-2, 1-hop, bote, step-in, negativa, side-step, recortar, salida.',
  },
  {
    id: 41,
    nombre: 'ALEROS · Footwork',
    grupo: 'Recursos',
    bloque: 'Táctica',
    descripcion: 'In&out, push cross, cross jab, wrap, BTL, under drag, inverted drag, speed stop, cross step.',
  },
  {
    id: 42,
    nombre: 'ALEROS · Low post',
    grupo: 'Sesión',
    bloque: 'Táctica',
    descripcion: 'Bote muelle (semi-gancho, floater, reverso), spin, Tim Duncan y Dirk (fondo/centro).',
  },
  {
    id: 43,
    nombre: 'ALA PÍVOT · Finalizaciones',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: '1 paso, reverso, batida, swing, euro-step, mate.',
  },
  {
    id: 44,
    nombre: 'ALA PÍVOT · Contactos y por fondo',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Bump+step/runner/euro/swing, veer finish, atacar+step through, spin, extensión lado contrario.',
  },
  {
    id: 45,
    nombre: 'ALA PÍVOT · Catch y tiro',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Side jab, cross, spin pivot, shimmy, catch&go, split catch, reactivo hasta 0-1 hop.',
  },
  {
    id: 46,
    nombre: 'ALA PÍVOT · Footwork y low post',
    grupo: 'Sesión',
    bloque: 'Táctica',
    descripcion: 'In&out, push cross, cross jab, wrap, BTL + paquete low post.',
  },
  {
    id: 47,
    nombre: 'PÍVOT · Finalizaciones',
    grupo: 'Sesión',
    bloque: 'Técnica',
    descripcion: '1 paso, floater, batida y juego de pies corto en tráfico.',
  },
  {
    id: 48,
    nombre: 'PÍVOT · Contactos y por fondo',
    grupo: 'Handicaps',
    bloque: 'Táctica',
    descripcion: 'Bump+step/euro, veer finish, atacar fondo y atacar centro con step-through.',
  },
  {
    id: 49,
    nombre: 'PÍVOT · Catch',
    grupo: 'Recursos',
    bloque: 'Técnica',
    descripcion: 'Side jab, cross, shimmy, catch funcional para continuidad interior.',
  },
  {
    id: 50,
    nombre: 'PÍVOT · Low post bote muelle',
    grupo: 'Sesión',
    bloque: 'Táctica',
    descripcion: 'Semi gancho, floater, gancho, reverso, step through y open.',
  },
  {
    id: 51,
    nombre: 'PÍVOT · Low post spin',
    grupo: 'Sesión',
    bloque: 'Táctica',
    descripcion: 'Spin y spin+step through con lectura de ayuda.',
  },
  {
    id: 52,
    nombre: 'PÍVOT · Low post finalizadores (Dirk / Duncan)',
    grupo: 'Sesión',
    bloque: 'Táctica',
    descripcion: 'Dirk: atacar fondo con 1-2 y jab. Duncan: atacar directo, spin, jab+atacar fondo.',
  },
]

const jugadoresIniciales: Jugador[] = [
  {
    id: 1,
    nombre: 'Álvaro Gómez',
    fotoUrl: '',
    equipo: 'Júnior Masculino A',
    categoria: 'Bronce (Grupo C)',
    nivel: 'Skills (Bronce)',
    posicion: 'Base',
    edad: 16,
    aspectos: [
      { nombre: 'Alta repetición con intención y ritmo real', prioridad: 'Alta', progreso: 35 },
      { nombre: 'Transferencia al juego real', prioridad: 'Alta', progreso: 44 },
      { nombre: 'Soluciones en contexto', prioridad: 'Media', progreso: 57 },
    ],
    recursosTrabajados: [1, 2, 3, 11, 15, 19],
    disponibilidadFechas: ['2026-03-05', '2026-03-06', '2026-03-07'],
  },
  {
    id: 2,
    nombre: 'Marina Ortega',
    fotoUrl: '',
    equipo: 'Cadete Femenino A',
    categoria: 'Plata (Estándar)',
    nivel: 'Game Skills (Plata)',
    posicion: 'Alero',
    edad: 15,
    aspectos: [
      { nombre: 'Dominio de gestos en varios contextos y handicaps', prioridad: 'Alta', progreso: 54 },
      { nombre: 'Control del ritmo y pausa en ventaja dinámica', prioridad: 'Media', progreso: 63 },
      { nombre: 'Consistencia técnica en tiro', prioridad: 'Media', progreso: 59 },
    ],
    recursosTrabajados: [4, 6, 8, 12, 13, 18, 20],
    disponibilidadFechas: ['2026-03-05', '2026-03-06'],
  },
  {
    id: 3,
    nombre: 'Pablo Serrano',
    fotoUrl: '',
    equipo: 'Senior Masculino Autonómica',
    categoria: 'Oro (Paquete por posición)',
    nivel: 'Player To Go (Oro)',
    posicion: 'Pívot',
    edad: 21,
    aspectos: [
      { nombre: 'Lectura avanzada de contextos C4-C9', prioridad: 'Alta', progreso: 67 },
      { nombre: 'Aplicación del gesto técnico bajo presión real', prioridad: 'Alta', progreso: 61 },
      { nombre: 'Adaptabilidad a escenarios de dificultad D1-D4', prioridad: 'Media', progreso: 53 },
    ],
    recursosTrabajados: [5, 7, 9, 10, 14, 16, 17, 20],
    disponibilidadFechas: ['2026-03-06', '2026-03-07'],
  },
]

const entrenadoresIniciales: Entrenador[] = [
  {
    id: 1,
    nombre: 'Carlos Navarro',
    fotoUrl: '',
    especialidad: 'Técnica individual',
    experiencia: 8,
    email: 'carlos@timeoutworkouts.com',
    telefono: '+34 600 111 222',
  },
  {
    id: 2,
    nombre: 'Laura Beltrán',
    fotoUrl: '',
    especialidad: 'Táctica y toma de decisiones',
    experiencia: 6,
    email: 'laura@timeoutworkouts.com',
    telefono: '+34 600 333 444',
  },
  {
    id: 3,
    nombre: 'Miguel Torres',
    fotoUrl: '',
    especialidad: 'Preparación física específica',
    experiencia: 10,
    email: 'miguel@timeoutworkouts.com',
    telefono: '+34 600 555 666',
  },
]

const sesionesIniciales: SesionCalendario[] = []

// Plantilla de aspectos por nivel utilizando la nueva estructura
const plantillaAspectosPorCategoria: Record<string, Aspecto[]> = {
  'Skills (Bronce)': [
    { nombre: 'Alta repetición con intención y ritmo real', prioridad: 'Alta', progreso: 20 },
    { nombre: 'Precisión mecánica y finalizaciones', prioridad: 'Alta', progreso: 15 },
    { nombre: 'Consistencia en gesto técnico', prioridad: 'Media', progreso: 25 },
  ],
  'Game Skills (Plata)': [
    { nombre: 'Aplicación del gesto en contextos 1c1', prioridad: 'Alta', progreso: 35 },
    { nombre: 'Lectura básica del defensor y toma de decisión', prioridad: 'Media', progreso: 30 },
    { nombre: 'Variedad funcional del gesto', prioridad: 'Media', progreso: 40 },
  ],
  'Game Action (Azul)': [
    { nombre: 'Encadenamiento de gestos y timing', prioridad: 'Alta', progreso: 45 },
    { nombre: 'Adaptación a defensas complejas', prioridad: 'Alta', progreso: 40 },
    { nombre: 'Ejecución en secuencias de juego', prioridad: 'Media', progreso: 35 },
  ],
  'Player To Go (Oro)': [
    { nombre: 'Toma de decisiones en partido', prioridad: 'Alta', progreso: 55 },
    { nombre: 'Gestión de handicaps y escenarios combinados', prioridad: 'Alta', progreso: 50 },
    { nombre: 'Rendimiento estable en contexto de partido', prioridad: 'Media', progreso: 45 },
  ],
}

const gruposRecurso: GrupoRecurso[] = ['Recursos', 'Dificultades', 'Handicaps', 'Sesión']
const bloquesRecurso: BloqueRecurso[] = ['Técnica']
const categoriasJugador = Object.keys(plantillaAspectosPorCategoria)
const diasSemanaNombre = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function formatearFechaISO(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function inicioSemanaDesde(fechaISO: string) {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  const dia = fecha.getDay()
  const desplazamiento = dia === 0 ? -6 : 1 - dia
  fecha.setDate(fecha.getDate() + desplazamiento)
  return fecha
}

function obtenerClaveMes(fechaISO: string) {
  return fechaISO.slice(0, 7)
}

function sumarMeses(claveMes: string, delta: number) {
  const [anioTexto, mesTexto] = claveMes.split('-')
  const fecha = new Date(Number(anioTexto), Number(mesTexto) - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

function formatearMesAnio(claveMes: string) {
  const [anioTexto, mesTexto] = claveMes.split('-')
  const fecha = new Date(Number(anioTexto), Number(mesTexto) - 1, 1)
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function obtenerDiasMes(claveMes: string) {
  const [anioTexto, mesTexto] = claveMes.split('-')
  const anio = Number(anioTexto)
  const mes = Number(mesTexto) - 1
  const primerDiaMes = new Date(anio, mes, 1)
  const inicio = inicioSemanaDesde(formatearFechaISO(primerDiaMes))

  return Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(inicio)
    fecha.setDate(inicio.getDate() + indice)
    return {
      fechaISO: formatearFechaISO(fecha),
      dia: fecha.getDate(),
      esMesActual: fecha.getMonth() === mes,
    }
  })
}

function claseSede(sede: Sede) {
  if (sede === 'GreenField') return 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
  if (sede === 'Colegio Aleman') return 'border-violet-300/40 bg-violet-500/15 text-violet-100'
  return 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
}

function obtenerIniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

function archivoADataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })
}

function App() {
  const [vista, setVista] = useState<'inicio' | 'panel' | 'jugadores'>('inicio')
  const [jugadores, setJugadores] = useState<Jugador[]>(() =>
    normalizarJugadores(leerStorage<Jugador[]>(STORAGE_KEYS.jugadores, [])),
  )
  const [recursos, setRecursos] = useState<Recurso[]>(() =>
    mezclarRecursosConIniciales(leerStorage<Recurso[]>(STORAGE_KEYS.recursos, recursosIniciales)),
  )
  // Asegurar que cada recurso tiene un `nivel` inferido (no reescribe storage hasta guardar)
  useEffect(() => {
    setRecursos((prev) =>
      normalizarRecursos(prev),
    )
    // solo una vez en montaje
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>(() =>
    normalizarEntrenadores(leerStorage<Entrenador[]>(STORAGE_KEYS.entrenadores, [])),
  )
  const [sesiones, setSesiones] = useState<SesionCalendario[]>(() =>
    leerStorage<SesionCalendario[]>(STORAGE_KEYS.sesiones, sesionesIniciales),
  )
  const [permisos, setPermisos] = useState<PermisoUsuario[]>(() =>
    normalizarPermisos(leerStorage<PermisoUsuario[]>(STORAGE_KEYS.permisos, permisosIniciales)),
  )
  const [jugadorActivoId, setJugadorActivoId] = useState<number>(() => {
    const guardados = normalizarJugadores(leerStorage<Jugador[]>(STORAGE_KEYS.jugadores, jugadoresIniciales))
    return guardados[0]?.id ?? 0
  })
  const [entrenadorActivoId, setEntrenadorActivoId] = useState<number>(() => {
    const guardados = normalizarEntrenadores(leerStorage<Entrenador[]>(STORAGE_KEYS.entrenadores, entrenadoresIniciales))
    return guardados[0]?.id ?? 0
  })
  const [grupoRecursoActivo, setGrupoRecursoActivo] = useState<GrupoRecurso>('Recursos')
  const [posicionRecursoActiva, setPosicionRecursoActiva] = useState<PosicionRecurso>('Base')
  const [nivelRecursoActivo, setNivelRecursoActivo] = useState<NivelRecurso>('Bronce')
  const [interfaz, setInterfaz] = useState<
    'gestion-jugadores' | 'gestion-conceptos' | 'gestion-entrenadores' | 'gestion-calendario' | 'gestion-permisos'
  >('gestion-jugadores')
  const [seccionesCalendarioAbiertas, setSeccionesCalendarioAbiertas] = useState({
    disponibilidad: true,
    programar: false,
    agenda: true,
    semanal: false,
    match: true,
  })
  const [descartesMatchPorFecha, setDescartesMatchPorFecha] = useState<Record<string, string[]>>({})
  const [formMatch, setFormMatch] = useState({ hora: '17:30', sede: sedesIniciales[0], entrenadorId: 0 })

  const [formNuevoJugador, setFormNuevoJugador] = useState({
    nombre: '',
    fotoUrl: '',
    equipo: '',
    categoria: 'Bronce (Grupo C)',
    nivel: 'Skills (Bronce)',
    posicion: '',
    edad: '15',
  })

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

  const [correoSesion, setCorreoSesion] = useState('')
  const [correoLogin, setCorreoLogin] = useState('')
  const [passwordLogin, setPasswordLogin] = useState('')
  const [modoAcceso, setModoAcceso] = useState<'login' | 'registro'>('login')
  const [pasoLogin, setPasoLogin] = useState<'correo' | 'password'>('correo')
  const [mensajeLogin, setMensajeLogin] = useState('')
  const [correoRegistro, setCorreoRegistro] = useState('')
  const [passwordRegistro, setPasswordRegistro] = useState('')
  const [confirmacionRegistro, setConfirmacionRegistro] = useState('')
  const [mensajeRegistro, setMensajeRegistro] = useState('')
  const [mensajeJugador, setMensajeJugador] = useState('')
  const [mensajeEntrenador, setMensajeEntrenador] = useState('')

  const [formNuevoPermiso, setFormNuevoPermiso] = useState({
    correo: '',
    password: '',
  })
  const [sedes, setSedes] = useState<Sede[]>(() => leerStorage<Sede[]>(STORAGE_KEYS.sedes, sedesIniciales))
  const [nuevaSede, setNuevaSede] = useState('')
  const [mensajeSede, setMensajeSede] = useState('')
  const [estadoRemotoCargado, setEstadoRemotoCargado] = useState(false)
  const omitirPrimerGuardadoRemoto = useRef(true)

  const permisosPorCorreo = useMemo(
    () => new Map(permisos.map((permiso) => [normalizarCorreo(permiso.correo), permiso])),
    [permisos],
  )
  // Temporal: permitir edición a todos los usuarios
  const puedeEditar = true
  const etiquetaInterfaz = {
    'gestion-jugadores': 'Jugadores',
    'gestion-conceptos': 'Biblioteca de recursos',
    'gestion-entrenadores': 'Entrenadores',
    'gestion-calendario': 'Calendario',
    'gestion-permisos': 'Usuarios',
  } as const

  const registrarBloqueo = (_motivo: string) => {}

  const abrirInterfaz = (
    siguienteInterfaz:
      | 'gestion-jugadores'
      | 'gestion-conceptos'
      | 'gestion-entrenadores'
      | 'gestion-calendario'
      | 'gestion-permisos',
  ) => {
    setInterfaz(siguienteInterfaz)
    setVista('jugadores')
  }

  const cambiarModoAcceso = (modo: 'login' | 'registro') => {
    setModoAcceso(modo)
    setMensajeLogin('')
    setMensajeRegistro('')
    if (modo !== 'login') {
      setPasoLogin('correo')
      setPasswordLogin('')
    }
  }

  const iniciarSesion = () => {
    if (modoAcceso !== 'login') return

    const correo = normalizarCorreo(correoLogin)
    const password = passwordLogin.trim()

    if (!correo || !correo.includes('@')) {
      setMensajeLogin('Introduce un correo válido.')
      return
    }

    if (pasoLogin === 'correo') {
      setMensajeLogin('')
      setPasoLogin('password')
      return
    }

    if (!password) {
      setMensajeLogin('Introduce tu contraseña.')
      return
    }

    const existente = permisosPorCorreo.get(correo)

    if (!existente) {
      setMensajeLogin('No existe este usuario. Usa la pestaña "Nuevo usuario".')
      return
    }

    if (existente.password !== password) {
      setMensajeLogin('Contraseña incorrecta.')
      return
    }

    setCorreoSesion(correo)
    setVista('panel')
    setMensajeLogin('')
    setPasoLogin('correo')
    setPasswordLogin('')
  }

  const registrarNuevoUsuario = () => {
    const correo = normalizarCorreo(correoRegistro)
    const password = passwordRegistro.trim()
    const confirmacion = confirmacionRegistro.trim()

    if (!correo || !correo.includes('@')) {
      setMensajeRegistro('Introduce un correo válido.')
      return
    }

    if (password.length < 4) {
      setMensajeRegistro('La contraseña debe tener al menos 4 caracteres.')
      return
    }

    if (password !== confirmacion) {
      setMensajeRegistro('Las contraseñas no coinciden.')
      return
    }

    if (permisosPorCorreo.has(correo)) {
      setMensajeRegistro('Ese correo ya existe. Inicia sesión con tu cuenta.')
      return
    }

    setPermisos((previo) => [...previo, { correo, password }])
    setMensajeRegistro('Usuario creado. Ya puedes iniciar sesión con ese correo.')
    setCorreoLogin(correo)
    setPasoLogin('password')
    setModoAcceso('login')
    setPasswordRegistro('')
    setConfirmacionRegistro('')
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const [filtroFecha, setFiltroFecha] = useState<string>(hoy)
  const [mesVisible, setMesVisible] = useState<string>(obtenerClaveMes(hoy))
  const [formNuevaSesion, setFormNuevaSesion] = useState({
    fecha: hoy,
    hora: '17:30',
    sede: sedesIniciales[0],
    entrenadorId: 0,
    objetivo: '',
    jugadorIds: [] as number[],
  })

  const jugadorActivo = useMemo(
    () => jugadores.find((jugador) => jugador.id === jugadorActivoId) ?? jugadores[0],
    [jugadorActivoId, jugadores],
  )

  useEffect(() => {
    if (!jugadorActivo) return
    setPosicionRecursoActiva(normalizarPosicionJugador(jugadorActivo.posicion))
    setNivelRecursoActivo(normalizarNivelJugador(jugadorActivo.categoria, jugadorActivo.nivel))
  }, [jugadorActivo])

  const entrenadorActivo = useMemo(
    () => entrenadores.find((entrenador) => entrenador.id === entrenadorActivoId) ?? entrenadores[0],
    [entrenadorActivoId, entrenadores],
  )

  const sesionesDelDia = useMemo(
    () => sesiones.filter((sesion) => sesion.fecha === filtroFecha).sort((a, b) => a.hora.localeCompare(b.hora)),
    [filtroFecha, sesiones],
  )

  const horasAgendaDia = useMemo(() => {
    const horasBase = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    const horasDinamicas = sesionesDelDia.map((sesion) => sesion.hora)
    if (formNuevaSesion.fecha === filtroFecha && formNuevaSesion.hora) {
      horasDinamicas.push(formNuevaSesion.hora)
    }

    return Array.from(new Set([...horasBase, ...horasDinamicas])).sort((a, b) => a.localeCompare(b))
  }, [filtroFecha, formNuevaSesion.fecha, formNuevaSesion.hora, sesionesDelDia])

  const disponibilidadEntrenadoresDia = useMemo(
    () =>
      entrenadores.map((entrenador) => {
        const sesionesEntrenador = sesionesDelDia.filter((sesion) => sesion.entrenadorId === entrenador.id)
        return {
          entrenador,
          sesiones: sesionesEntrenador,
          ocupado: sesionesEntrenador.length > 0,
        }
      }),
    [entrenadores, sesionesDelDia],
  )

  useEffect(() => {
    setMesVisible(obtenerClaveMes(filtroFecha))
  }, [filtroFecha])

  const diasMesVisible = useMemo(() => obtenerDiasMes(mesVisible), [mesVisible])

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

  const diasSemanaActiva = useMemo(() => {
    const inicio = inicioSemanaDesde(filtroFecha)
    return Array.from({ length: 7 }, (_, indice) => {
      const fecha = new Date(inicio)
      fecha.setDate(inicio.getDate() + indice)
      return {
        nombre: diasSemanaNombre[indice],
        fechaISO: formatearFechaISO(fecha),
      }
    })
  }, [filtroFecha])

  const recursosPendientes = useMemo(
    () => (jugadorActivo ? recursos.filter((recurso) => !jugadorActivo.recursosTrabajados.includes(recurso.id)) : []),
    [jugadorActivo, recursos],
  )

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
    const sugerencias: Array<{
      clave: string
      jugadorA: Jugador
      jugadorB: Jugador
      recursosCompartidos: string[]
      diferenciaEdad: number
      puntuacionCompatibilidad: number
    }> = []

    for (let index = 0; index < jugadoresDisponiblesFecha.length; index += 1) {
      for (let subIndex = index + 1; subIndex < jugadoresDisponiblesFecha.length; subIndex += 1) {
        const jugadorA = jugadoresDisponiblesFecha[index]
        const jugadorB = jugadoresDisponiblesFecha[subIndex]
        const clave = `${Math.min(jugadorA.id, jugadorB.id)}-${Math.max(jugadorA.id, jugadorB.id)}`
        if (descartadosDia.has(clave)) continue

        const mismaCategoria = jugadorA.categoria === jugadorB.categoria
        if (!mismaCategoria) continue

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

  const recursosVisibles = useMemo(
    () =>
      recursos.filter((recurso) => {
        if (recurso.grupo !== grupoRecursoActivo) return false
        const posicion = recurso.posicion ?? inferirPosicionRecurso(recurso.nombre)
        const nivel = recurso.nivel ?? inferirNivelRecurso(recurso.nombre)
        return (posicion === 'General' || posicion === posicionRecursoActiva) && nivel === nivelRecursoActivo
      }),
    [grupoRecursoActivo, nivelRecursoActivo, posicionRecursoActiva, recursos],
  )

  const pendientesDelGrupo = useMemo(
    () => (jugadorActivo ? recursosVisibles.filter((recurso) => !jugadorActivo.recursosTrabajados.includes(recurso.id)).length : 0),
    [jugadorActivo, recursosVisibles],
  )

  const alternarRecursoTrabajado = (recursoId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes cambiar recursos en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    setJugadores((previo) =>
      previo.map((jugador) => {
        if (jugador.id !== jugadorActivo.id) return jugador

        const yaTrabajado = jugador.recursosTrabajados.includes(recursoId)
        return {
          ...jugador,
          recursosTrabajados: yaTrabajado
            ? jugador.recursosTrabajados.filter((id) => id !== recursoId)
            : [...jugador.recursosTrabajados, recursoId],
        }
      }),
    )
  }

  const alternarSeccionCalendario = (seccion: keyof typeof seccionesCalendarioAbiertas) => {
    setSeccionesCalendarioAbiertas((previo) => ({ ...previo, [seccion]: !previo[seccion] }))
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

    setJugadores((previo) =>
      previo.map((jugador) => (jugador.id === jugadorActivo.id ? { ...jugador, [campo]: valor } : jugador)),
    )
  }

  const actualizarProgresoAspecto = (nombreAspecto: string, progreso: number) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes editar progreso en modo visualizador.')
      return
    }
    if (!jugadorActivo) return

    setJugadores((previo) =>
      previo.map((jugador) => {
        if (jugador.id !== jugadorActivo.id) return jugador

        return {
          ...jugador,
          aspectos: jugador.aspectos.map((aspecto) =>
            aspecto.nombre === nombreAspecto ? { ...aspecto, progreso } : aspecto,
          ),
        }
      }),
    )
  }

  const alternarDisponibilidadJugador = (jugadorId: number, fecha: string) => {
    if (!puedeEditar) {
      registrarBloqueo('No puedes cambiar disponibilidad en modo visualizador.')
      return
    }
    if (!fecha) return

    setJugadores((previo) =>
      previo.map((jugador) => {
        if (jugador.id !== jugadorId) return jugador
        const yaDisponible = jugador.disponibilidadFechas.includes(fecha)
        return {
          ...jugador,
          disponibilidadFechas: yaDisponible
            ? jugador.disponibilidadFechas.filter((item) => item !== fecha)
            : [...jugador.disponibilidadFechas, fecha],
        }
      }),
    )
  }

  const anadirJugador = () => {
    if (!puedeEditar) {
      setMensajeJugador('No tienes permisos de edición para añadir jugadores.')
      registrarBloqueo('Intento de añadir jugador sin permisos.')
      return
    }
    const nombre = formNuevoJugador.nombre.trim()
    const fotoUrl = formNuevoJugador.fotoUrl.trim()
    const equipo = formNuevoJugador.equipo.trim()
    const posicion = formNuevoJugador.posicion.trim()
    const edadNumero = Number(formNuevoJugador.edad)

    if (!nombre || !equipo || !posicion || Number.isNaN(edadNumero)) {
      setMensajeJugador('Completa nombre, equipo, posición y edad válidos.')
      return
    }

    const siguienteId = Math.max(0, ...jugadores.map((jugador) => jugador.id)) + 1
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

    setJugadores([...jugadores, nuevoJugador])
    setJugadorActivoId(siguienteId)
    setFormNuevoJugador({
      nombre: '',
      fotoUrl: '',
      equipo: '',
      categoria: formNuevoJugador.categoria,
      nivel: formNuevoJugador.nivel ?? formNuevoJugador.categoria,
      posicion: '',
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

    const restantes = jugadores.filter((jugador) => jugador.id !== jugadorActivo.id)
    setJugadores(restantes)
    setJugadorActivoId(restantes[0]?.id ?? 0)
  }

  const anadirConcepto = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de añadir concepto sin permisos.')
      return
    }
    const nombre = formNuevoConcepto.nombre.trim()
    const descripcion = formNuevoConcepto.descripcion.trim()

    if (!nombre || !descripcion) return

    const siguienteId = Math.max(0, ...recursos.map((recurso) => recurso.id)) + 1
    const nuevoRecurso: Recurso = {
      id: siguienteId,
      nombre,
      grupo: formNuevoConcepto.grupo,
      bloque: formNuevoConcepto.bloque,
      posicion: formNuevoConcepto.posicion,
      nivel: formNuevoConcepto.nivel,
      descripcion,
    }

    setRecursos((previo) => normalizarRecursos([...previo, nuevoRecurso]))
    setFormNuevoConcepto((previo) => ({ ...previo, nombre: '', descripcion: '' }))
  }

  const eliminarConcepto = (recursoId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar concepto sin permisos.')
      return
    }
    setRecursos((previo) => previo.filter((recurso) => recurso.id !== recursoId))
    setJugadores((previo) =>
      previo.map((jugador) => ({
        ...jugador,
        recursosTrabajados: jugador.recursosTrabajados.filter((id) => id !== recursoId),
      })),
    )
  }

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

    const siguienteId = Math.max(0, ...entrenadores.map((entrenador) => entrenador.id)) + 1
    const nuevoEntrenador: Entrenador = {
      id: siguienteId,
      nombre,
      fotoUrl,
      especialidad,
      experiencia,
      email,
      telefono,
    }

    setEntrenadores((previo) => [...previo, nuevoEntrenador])
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

    setEntrenadores((previo) =>
      previo.map((entrenador) =>
        entrenador.id === entrenadorActivo.id ? { ...entrenador, [campo]: valor } : entrenador,
      ),
    )
  }

  const eliminarEntrenadorActivo = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar entrenador sin permisos.')
      return
    }
    if (!entrenadorActivo) return

    const restantes = entrenadores.filter((entrenador) => entrenador.id !== entrenadorActivo.id)
    setEntrenadores(restantes)
    setEntrenadorActivoId(restantes[0]?.id ?? 0)
    setSesiones((previo) => previo.filter((sesion) => sesion.entrenadorId !== entrenadorActivo.id))
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

  const anadirSesionCalendario = () => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de crear sesión sin permisos.')
      return
    }
    const objetivo = formNuevaSesion.objetivo.trim()
    if (
      !formNuevaSesion.fecha ||
      !formNuevaSesion.hora ||
      !formNuevaSesion.entrenadorId ||
      formNuevaSesion.jugadorIds.length === 0 ||
      !objetivo ||
      jugadoresNoDisponiblesEnSesion.length > 0
    ) {
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

    setSesiones((previo) => [...previo, nuevaSesion])
    setFormNuevaSesion((previo) => ({ ...previo, objetivo: '', jugadorIds: [] }))
    setFiltroFecha(formNuevaSesion.fecha)
  }

  const eliminarSesionCalendario = (sesionId: number) => {
    if (!puedeEditar) {
      registrarBloqueo('Intento de eliminar sesión sin permisos.')
      return
    }
    setSesiones((previo) => previo.filter((sesion) => sesion.id !== sesionId))
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
      alert('Introduce una hora para la sesión del match.')
      return
    }
    if (!formMatch.entrenadorId) {
      alert('Selecciona un entrenador para la sesión del match.')
      return
    }
    const siguienteId = Math.max(0, ...sesiones.map((s) => s.id)) + 1
    const nuevaSesion: SesionCalendario = {
      id: siguienteId,
      fecha: filtroFecha,
      hora: formMatch.hora,
      sede: formMatch.sede,
      entrenadorId: formMatch.entrenadorId,
      jugadorIds: [matchActual.jugadorA.id, matchActual.jugadorB.id],
      objetivo: `Trabajo compartido: ${matchActual.recursosCompartidos.slice(0, 3).join(' · ')}`,
    }
    setSesiones((previo) => [...previo, nuevaSesion])
    // descartar el match usado para avanzar al siguiente
    setDescartesMatchPorFecha((previo) => ({
      ...previo,
      [filtroFecha]: [...(previo[filtroFecha] ?? []), matchActual.clave],
    }))
    setFiltroFecha(filtroFecha)
  }

  const anadirPermiso = () => {
    const correo = normalizarCorreo(formNuevoPermiso.correo)
    const password = formNuevoPermiso.password.trim()
    if (!correo.includes('@')) return

    setPermisos((previo) => {
      const existente = previo.find((permiso) => normalizarCorreo(permiso.correo) === correo)
      if (existente) {
        return previo.map((permiso) =>
          normalizarCorreo(permiso.correo) === correo ? { ...permiso, password: password || permiso.password } : permiso,
        )
      }

      if (password.length < 4) return previo

      return [...previo, { correo, password }]
    })

    setFormNuevoPermiso({ correo: '', password: '' })
  }

  const eliminarPermiso = (correo: string) => {
    setPermisos((previo) => previo.filter((permiso) => normalizarCorreo(permiso.correo) !== normalizarCorreo(correo)))
  }

  const anadirSede = () => {
    const nombre = nuevaSede.trim()
    if (!nombre) {
      setMensajeSede('Introduce un nombre de sede.')
      return
    }

    const yaExiste = sedes.some((sede) => sede.trim().toLowerCase() === nombre.toLowerCase())
    if (yaExiste) {
      setMensajeSede('Esa sede ya existe.')
      return
    }

    setSedes((previo) => [...previo, nombre])
    setNuevaSede('')
    setMensajeSede('Sede añadida.')
  }

  const eliminarSede = (sede: Sede) => {
    if (sedes.length <= 1) {
      setMensajeSede('Debe existir al menos una sede.')
      return
    }

    const sedeEnUso = sesiones.some((sesion) => sesion.sede === sede)
    if (sedeEnUso) {
      setMensajeSede('No puedes eliminar una sede que ya tiene sesiones.')
      return
    }

    setSedes((previo) => previo.filter((item) => item !== sede))
    setMensajeSede('Sede eliminada.')
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.jugadores, JSON.stringify(jugadores))
  }, [jugadores])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.recursos, JSON.stringify(recursos))
  }, [recursos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entrenadores, JSON.stringify(entrenadores))
  }, [entrenadores])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sesiones, JSON.stringify(sesiones))
  }, [sesiones])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.permisos, JSON.stringify(permisos))
  }, [permisos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sedes, JSON.stringify(sedes))
  }, [sedes])

  useEffect(() => {
    if (sedes.length === 0) return
    if (!sedes.includes(formNuevaSesion.sede)) {
      setFormNuevaSesion((previo) => ({ ...previo, sede: sedes[0] }))
    }
  }, [formNuevaSesion.sede, sedes])

  useEffect(() => {
    let cancelado = false

    const cargarEstadoRemoto = async () => {
      try {
        const respuesta = await fetch(API_STATE_URL)
        if (!respuesta.ok) return

        const remoto = (await respuesta.json()) as EstadoRemoto
        const remotoTieneDatos = [
          remoto.jugadores,
          remoto.recursos,
          remoto.entrenadores,
          remoto.sesiones,
          remoto.permisos,
          remoto.sedes,
        ].some((coleccion) => Array.isArray(coleccion) && coleccion.length > 0)

        if (cancelado) return

        if (!remotoTieneDatos) {
          omitirPrimerGuardadoRemoto.current = false
          return
        }

        if (Array.isArray(remoto.jugadores)) {
          const jugadoresRemotos = normalizarJugadores(remoto.jugadores)
          setJugadores(jugadoresRemotos)
          setJugadorActivoId((actual) =>
            jugadoresRemotos.some((jugador) => jugador.id === actual) ? actual : (jugadoresRemotos[0]?.id ?? 0),
          )
        }

        if (Array.isArray(remoto.recursos)) {
          setRecursos(mezclarRecursosConIniciales(remoto.recursos))
        }

        if (Array.isArray(remoto.entrenadores)) {
          const entrenadoresRemotos = normalizarEntrenadores(remoto.entrenadores)
          setEntrenadores(entrenadoresRemotos)
          setEntrenadorActivoId((actual) =>
            entrenadoresRemotos.some((entrenador) => entrenador.id === actual) ? actual : (entrenadoresRemotos[0]?.id ?? 0),
          )
        }

        if (Array.isArray(remoto.sesiones)) {
          setSesiones(remoto.sesiones)
        }

        if (Array.isArray(remoto.permisos)) {
          setPermisos(normalizarPermisos(remoto.permisos))
        }

        if (Array.isArray(remoto.sedes)) {
          setSedes(normalizarSedes(remoto.sedes))
        }
      } catch {
      } finally {
        if (!cancelado) {
          setEstadoRemotoCargado(true)
        }
      }
    }

    void cargarEstadoRemoto()

    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!estadoRemotoCargado) return

    if (omitirPrimerGuardadoRemoto.current) {
      omitirPrimerGuardadoRemoto.current = false
      return
    }

    const temporizador = window.setTimeout(() => {
      // Filtrar elementos que coinciden exactamente con los valores iniciales
        void fetch(API_STATE_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jugadores,
            recursos,
            entrenadores,
            sesiones,
            permisos,
            sedes,
          }),
        })
    }, API_SYNC_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(temporizador)
    }
  }, [estadoRemotoCargado, jugadores, recursos, entrenadores, sesiones, permisos, sedes])

  useEffect(() => {
    if (jugadores.length === 0) {
      setJugadorActivoId(0)
      return
    }

    if (!jugadores.some((jugador) => jugador.id === jugadorActivoId)) {
      setJugadorActivoId(jugadores[0].id)
    }
  }, [jugadorActivoId, jugadores])

  useEffect(() => {
    if (entrenadores.length === 0) {
      setEntrenadorActivoId(0)
      return
    }

    if (!entrenadores.some((entrenador) => entrenador.id === entrenadorActivoId)) {
      setEntrenadorActivoId(entrenadores[0].id)
    }
  }, [entrenadorActivoId, entrenadores])

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_45%)]" />

      {vista === 'inicio' ? (
        <section className="relative mx-auto flex min-h-[85vh] w-full max-w-5xl items-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-14">
          <div className="mx-auto flex w-full max-w-md flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/90">Timeout Workouts</p>
            </div>

            <form className="grid w-full gap-4 rounded-2xl border border-white/15 bg-slate-950/65 p-6 text-left shadow-xl">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-bold text-white">
                  G
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {modoAcceso === 'login' ? 'Iniciar sesión' : 'Nuevo usuario'}
                  </p>
                  <p className="text-xs text-slate-300">Timeout Coaches</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => cambiarModoAcceso('login')}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    modoAcceso === 'login' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => cambiarModoAcceso('registro')}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    modoAcceso === 'registro' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Nuevo usuario
                </button>
              </div>

              {modoAcceso === 'login' ? (
                <>
                  <p className="text-xs text-slate-300">
                    {pasoLogin === 'correo' ? 'Usa tu cuenta de correo para continuar.' : 'Introduce tu contraseña para continuar.'}
                  </p>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-100">Correo</span>
                    <input
                      type="email"
                      value={correoLogin}
                      onChange={(evento) => {
                        setCorreoLogin(evento.target.value)
                        setMensajeLogin('')
                        if (pasoLogin === 'password') {
                          setPasoLogin('correo')
                          setPasswordLogin('')
                        }
                      }}
                      placeholder="staff@timeoutworkouts.com"
                      className="rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </label>

                  {pasoLogin === 'password' ? (
                    <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200">
                      {normalizarCorreo(correoLogin)}
                    </p>
                  ) : null}

                  {pasoLogin === 'password' ? (
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-slate-100">Contraseña</span>
                      <input
                        type="password"
                        value={passwordLogin}
                        onChange={(evento) => {
                          setPasswordLogin(evento.target.value)
                          setMensajeLogin('')
                        }}
                        placeholder="••••••••"
                        className="rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                      />
                    </label>
                  ) : null}

                  {mensajeLogin ? <p className="text-xs text-rose-200">{mensajeLogin}</p> : null}

                  <div className="mt-1 flex items-center justify-between gap-3">
                    {pasoLogin === 'password' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPasoLogin('correo')
                          setPasswordLogin('')
                          setMensajeLogin('')
                        }}
                        className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                      >
                        Cambiar correo
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={iniciarSesion}
                      className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                    >
                      {pasoLogin === 'correo' ? 'Siguiente' : 'Entrar'}
                    </button>
                  </div>
                </>
              ) : null}

              {modoAcceso === 'registro' ? (
                <>
                  <p className="text-xs text-slate-300">Crea tu cuenta nueva para acceder a la app.</p>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-100">Correo</span>
                    <input
                      type="email"
                      value={correoRegistro}
                      onChange={(evento) => {
                        setCorreoRegistro(evento.target.value)
                        setMensajeRegistro('')
                      }}
                      placeholder="tu.correo@club.com"
                      className="rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-100">Contraseña</span>
                    <input
                      type="password"
                      value={passwordRegistro}
                      onChange={(evento) => {
                        setPasswordRegistro(evento.target.value)
                        setMensajeRegistro('')
                      }}
                      placeholder="Mínimo 4 caracteres"
                      className="rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium text-slate-100">Confirmar contraseña</span>
                    <input
                      type="password"
                      value={confirmacionRegistro}
                      onChange={(evento) => {
                        setConfirmacionRegistro(evento.target.value)
                        setMensajeRegistro('')
                      }}
                      placeholder="Repite tu contraseña"
                      className="rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </label>
                  {mensajeRegistro ? <p className="text-xs text-rose-200">{mensajeRegistro}</p> : null}
                  <div className="mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={registrarNuevoUsuario}
                      className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                    >
                      Crear usuario
                    </button>
                  </div>
                </>
              ) : null}

            </form>
          </div>
        </section>
      ) : vista === 'panel' ? (
        <section className="relative mx-auto flex min-h-[85vh] w-full max-w-6xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-14">
          <div className="w-full">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-200/90">Panel principal</p>
                <h2 className="mt-1 text-3xl font-bold text-white">¿Qué quieres gestionar hoy?</h2>
                <p className="mt-2 text-sm text-slate-300">Selecciona un área para entrar en una vista más limpia y específica.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVista('inicio')
                  setModoAcceso('login')
                  setPasoLogin('correo')
                  setPasswordLogin('')
                  setMensajeLogin('')
                  setMensajeRegistro('')
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { key: 'gestion-jugadores', title: 'Jugadores', text: 'Fichas, progreso, planificación individual y seguimiento.' },
                { key: 'gestion-conceptos', title: 'Biblioteca de recursos', text: 'Recursos por nivel, posición y biblioteca metodológica.' },
                { key: 'gestion-entrenadores', title: 'Entrenadores', text: 'Equipo técnico, especialidades y datos de contacto.' },
                { key: 'gestion-calendario', title: 'Calendario', text: 'Disponibilidad, sedes, agenda diaria y vista semanal.' },
                { key: 'gestion-permisos', title: 'Usuarios', text: 'Correos y contraseñas de acceso a la plataforma.' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    abrirInterfaz(
                      item.key as
                        | 'gestion-jugadores'
                        | 'gestion-conceptos'
                        | 'gestion-entrenadores'
                        | 'gestion-calendario'
                        | 'gestion-permisos',
                    )
                  }
                  className="group rounded-2xl border border-white/10 bg-slate-900/45 p-6 text-left transition hover:border-blue-300/40 hover:bg-slate-900/70"
                >
                  <p className="text-lg font-semibold text-white transition group-hover:text-blue-100">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
                  <span className="mt-5 inline-flex rounded-full border border-blue-300/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                    Entrar
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative mx-auto grid w-full max-w-6xl gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl lg:grid-cols-[330px_minmax(0,1fr)] lg:p-8">
          <aside className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{etiquetaInterfaz[interfaz]}</h2>
                <p className="text-xs text-slate-300">Sesión: {correoSesion || 'sin correo'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVista('inicio')
                  setModoAcceso('login')
                  setPasoLogin('correo')
                  setPasswordLogin('')
                  setMensajeLogin('')
                  setMensajeRegistro('')
                }}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </div>

            {interfaz === 'gestion-jugadores' ? (
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

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-sm font-semibold text-white">Añadir jugador</p>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={formNuevoJugador.nombre}
                      onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, nombre: evento.target.value }))}
                      placeholder="Nombre completo"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={formNuevoJugador.fotoUrl}
                      onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, fotoUrl: evento.target.value }))}
                      placeholder="URL foto"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!puedeEditar}
                      onChange={async (evento) => {
                        const archivo = evento.target.files?.[0]
                        if (!archivo) return
                        const dataUrl = await archivoADataUrl(archivo)
                        setFormNuevoJugador((previo) => ({ ...previo, fotoUrl: dataUrl }))
                      }}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                    />
                    <input
                      value={formNuevoJugador.equipo}
                      onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, equipo: evento.target.value }))}
                      placeholder="Equipo"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formNuevoJugador.categoria}
                        onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, categoria: evento.target.value }))}
                        disabled={!puedeEditar}
                        className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                      >
                        {categoriasJugador.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                      <input
                        value={formNuevoJugador.posicion}
                        onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, posicion: evento.target.value }))}
                        placeholder="Posición"
                        disabled={!puedeEditar}
                        className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <input
                      value={formNuevoJugador.edad}
                      onChange={(evento) => setFormNuevoJugador((previo) => ({ ...previo, edad: evento.target.value }))}
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

          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-blue-200/90">Área de trabajo</p>
                <h3 className="mt-1 text-2xl font-bold text-white">{etiquetaInterfaz[interfaz]}</h3>
              </div>
              <button
                type="button"
                onClick={() => setVista('panel')}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              >
                ← Volver al panel
              </button>
            </div>

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
                  onChange={(evento) => actualizarCampoJugadorActivo('nombre', evento.target.value)}
                  disabled={!puedeEditar}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={jugadorActivo.fotoUrl}
                  onChange={(evento) => actualizarCampoJugadorActivo('fotoUrl', evento.target.value)}
                  disabled={!puedeEditar}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="file"
                  accept="image/*"
                  disabled={!puedeEditar}
                  onChange={async (evento) => {
                    const archivo = evento.target.files?.[0]
                    if (!archivo) return
                    const dataUrl = await archivoADataUrl(archivo)
                    actualizarCampoJugadorActivo('fotoUrl', dataUrl)
                  }}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                />
                <input
                  value={jugadorActivo.equipo}
                  onChange={(evento) => actualizarCampoJugadorActivo('equipo', evento.target.value)}
                  disabled={!puedeEditar}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={jugadorActivo.posicion}
                  onChange={(evento) => actualizarCampoJugadorActivo('posicion', evento.target.value)}
                  disabled={!puedeEditar}
                  className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  value={jugadorActivo.edad}
                  type="number"
                  onChange={(evento) => actualizarCampoJugadorActivo('edad', Number(evento.target.value))}
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
                          onChange={(evento) => actualizarProgresoAspecto(aspecto.nombre, Number(evento.target.value))}
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

                <div className="mt-3 flex flex-wrap gap-2">
                  {posicionesRecurso.map((posicion) => {
                    const activa = posicionRecursoActiva === posicion

                    return (
                      <button
                        key={posicion}
                        type="button"
                        onClick={() => setPosicionRecursoActiva(posicion)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          activa
                            ? 'border-violet-300/60 bg-violet-500/20 text-violet-100'
                            : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {posicion}
                      </button>
                    )
                  })}
                </div>

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
                  Posición activa: <span className="font-semibold text-slate-200">{posicionRecursoActiva}</span>
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
            ) : null}

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
                      onChange={(evento) => setFormNuevoConcepto((previo) => ({ ...previo, nombre: evento.target.value }))}
                      placeholder="Nombre del recurso"
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <select
                      value={formNuevoConcepto.grupo}
                      onChange={(evento) => setFormNuevoConcepto((previo) => ({ ...previo, grupo: evento.target.value as GrupoRecurso }))}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {gruposRecurso.map((grupo) => (
                        <option key={grupo} value={grupo}>
                          {grupo}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formNuevoConcepto.bloque}
                      onChange={(evento) => setFormNuevoConcepto((previo) => ({ ...previo, bloque: evento.target.value as BloqueRecurso }))}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {bloquesRecurso.map((bloque) => (
                        <option key={bloque} value={bloque}>
                          {bloque}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formNuevoConcepto.posicion}
                      onChange={(evento) =>
                        setFormNuevoConcepto((previo) => ({ ...previo, posicion: evento.target.value as PosicionRecurso }))
                      }
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {posicionesRecurso.map((posicion) => (
                        <option key={posicion} value={posicion}>
                          {posicion}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formNuevoConcepto.nivel}
                      onChange={(evento) =>
                        setFormNuevoConcepto((previo) => ({ ...previo, nivel: evento.target.value as NivelRecurso }))
                      }
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                    >
                      {nivelesRecurso.map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    </select>
                    <input
                      value={formNuevoConcepto.descripcion}
                      onChange={(evento) => setFormNuevoConcepto((previo) => ({ ...previo, descripcion: evento.target.value }))}
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
                    <input
                      value={formNuevoEntrenador.nombre}
                      onChange={(evento) => setFormNuevoEntrenador((previo) => ({ ...previo, nombre: evento.target.value }))}
                      placeholder="Nombre completo"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={formNuevoEntrenador.fotoUrl}
                      onChange={(evento) => setFormNuevoEntrenador((previo) => ({ ...previo, fotoUrl: evento.target.value }))}
                      placeholder="URL foto"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!puedeEditar}
                      onChange={async (evento) => {
                        const archivo = evento.target.files?.[0]
                        if (!archivo) return
                        const dataUrl = await archivoADataUrl(archivo)
                        setFormNuevoEntrenador((previo) => ({ ...previo, fotoUrl: dataUrl }))
                      }}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                    />
                    <input
                      value={formNuevoEntrenador.especialidad}
                      onChange={(evento) =>
                        setFormNuevoEntrenador((previo) => ({ ...previo, especialidad: evento.target.value }))
                      }
                      placeholder="Especialidad"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={formNuevoEntrenador.experiencia}
                      type="number"
                      min={0}
                      onChange={(evento) =>
                        setFormNuevoEntrenador((previo) => ({ ...previo, experiencia: evento.target.value }))
                      }
                      placeholder="Años experiencia"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={formNuevoEntrenador.email}
                      onChange={(evento) => setFormNuevoEntrenador((previo) => ({ ...previo, email: evento.target.value }))}
                      placeholder="Email"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={formNuevoEntrenador.telefono}
                      onChange={(evento) => setFormNuevoEntrenador((previo) => ({ ...previo, telefono: evento.target.value }))}
                      placeholder="Teléfono"
                      disabled={!puedeEditar}
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400 sm:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={anadirEntrenador}
                    disabled={!puedeEditar}
                    className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                  >
                    Guardar entrenador
                  </button>
                  {mensajeEntrenador ? <p className="mt-2 text-xs text-slate-300">{mensajeEntrenador}</p> : null}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
                  <aside className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                    <p className="text-sm font-semibold text-white">Listado de entrenadores</p>
                    <div className="mt-3 grid gap-2">
                      {entrenadores.map((entrenador) => {
                        const activo = entrenadorActivo?.id === entrenador.id

                        return (
                          <button
                            key={entrenador.id}
                            type="button"
                            onClick={() => setEntrenadorActivoId(entrenador.id)}
                            className={`rounded-lg border px-3 py-2 text-left transition ${
                              activo
                                ? 'border-blue-400/60 bg-blue-500/15'
                                : 'border-white/10 bg-slate-900/50 hover:border-white/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {entrenador.fotoUrl ? (
                                <img src={entrenador.fotoUrl} alt={entrenador.nombre} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-100">
                                  {obtenerIniciales(entrenador.nombre)}
                                </div>
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
                          <button
                            type="button"
                            onClick={eliminarEntrenadorActivo}
                            className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25"
                          >
                            Eliminar entrenador
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={entrenadorActivo.nombre}
                            onChange={(evento) => actualizarCampoEntrenadorActivo('nombre', evento.target.value)}
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                          />
                          <input
                            value={entrenadorActivo.fotoUrl}
                            onChange={(evento) => actualizarCampoEntrenadorActivo('fotoUrl', evento.target.value)}
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!puedeEditar}
                            onChange={async (evento) => {
                              const archivo = evento.target.files?.[0]
                              if (!archivo) return
                              const dataUrl = await archivoADataUrl(archivo)
                              actualizarCampoEntrenadorActivo('fotoUrl', dataUrl)
                            }}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-2 file:py-1 file:text-white"
                          />
                          <input
                            value={entrenadorActivo.especialidad}
                            onChange={(evento) => actualizarCampoEntrenadorActivo('especialidad', evento.target.value)}
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                          />
                          <input
                            value={entrenadorActivo.experiencia}
                            type="number"
                            min={0}
                            onChange={(evento) =>
                              actualizarCampoEntrenadorActivo('experiencia', Number(evento.target.value))
                            }
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                          />
                          <input
                            value={entrenadorActivo.email}
                            onChange={(evento) => actualizarCampoEntrenadorActivo('email', evento.target.value)}
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                          />
                          <input
                            value={entrenadorActivo.telefono}
                            onChange={(evento) => actualizarCampoEntrenadorActivo('telefono', evento.target.value)}
                            disabled={!puedeEditar}
                            className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none sm:col-span-2"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-300">No hay entrenadores. Añade uno para empezar.</p>
                    )}
                  </section>
                </div>
              </>
            ) : null}

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
                    <input
                      value={formNuevoPermiso.correo}
                      onChange={(evento) =>
                        setFormNuevoPermiso((previo) => ({ ...previo, correo: evento.target.value }))
                      }
                      placeholder="correo@timeoutworkouts.com"
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <input
                      type="password"
                      value={formNuevoPermiso.password}
                      onChange={(evento) =>
                        setFormNuevoPermiso((previo) => ({ ...previo, password: evento.target.value }))
                      }
                      placeholder="Contraseña (mínimo 4)"
                      className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={anadirPermiso}
                    className="mt-3 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                  >
                    Guardar usuario
                  </button>
                </div>

                <div className="mt-5 grid gap-3">
                  {permisos.map((permiso) => (
                    <div key={permiso.correo} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{permiso.correo}</p>
                          <p className="text-xs text-slate-300">Usuario activo</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => eliminarPermiso(permiso.correo)}
                            className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {interfaz === 'gestion-calendario' ? (
              <>
                <header className="border-b border-white/10 pb-5">
                  <p className="text-sm text-blue-200/90">Planificación operativa</p>
                  <h3 className="mt-1 text-2xl font-bold text-white">Calendario de sesiones</h3>
                  <p className="mt-2 text-sm text-slate-300">Abre cada pestaña según la necesites: disponibilidad, match, programación y vistas.</p>
                </header>

                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <label className="text-xs text-slate-300">Fecha de trabajo</label>
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(evento) => {
                      setFiltroFecha(evento.target.value)
                      setFormNuevaSesion((previo) => ({ ...previo, fecha: evento.target.value }))
                    }}
                    className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Vista mensual</p>
                      <p className="mt-1 text-xs text-slate-300">Pulsa sobre un día para ver y programar sesiones en esa fecha.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMesVisible((previo) => sumarMeses(previo, -1))}
                        className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-white"
                      >
                        ←
                      </button>
                      <div className="min-w-[180px] text-center text-sm font-semibold capitalize text-slate-100">
                        {formatearMesAnio(mesVisible)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMesVisible((previo) => sumarMeses(previo, 1))}
                        className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-white"
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {diasSemanaNombre.map((dia) => (
                      <div key={dia} className="rounded-lg bg-white/5 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                        {dia.slice(0, 3)}
                      </div>
                    ))}

                    {diasMesVisible.map((dia) => {
                      const sesionesDia = sesiones
                        .filter((sesion) => sesion.fecha === dia.fechaISO)
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                      const estaActivo = filtroFecha === dia.fechaISO

                      return (
                        <button
                          key={dia.fechaISO}
                          type="button"
                          onClick={() => {
                            setFiltroFecha(dia.fechaISO)
                            setFormNuevaSesion((previo) => ({ ...previo, fecha: dia.fechaISO }))
                          }}
                          className={`min-h-[120px] rounded-xl border p-2 text-left transition ${
                            estaActivo
                              ? 'border-blue-300/60 bg-blue-500/15'
                              : dia.esMesActual
                                ? 'border-white/10 bg-slate-900/50 hover:border-white/30'
                                : 'border-white/5 bg-slate-900/20 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-semibold ${estaActivo ? 'text-blue-100' : dia.esMesActual ? 'text-white' : 'text-slate-500'}`}>
                              {dia.dia}
                            </span>
                            {sesionesDia.length > 0 ? (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                                {sesionesDia.length}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 grid gap-1">
                            {sesionesDia.slice(0, 3).map((sesion) => (
                              <div key={sesion.id} className={`rounded-md border px-2 py-1 text-[10px] ${claseSede(sesion.sede)}`}>
                                {sesion.hora} · {sesion.sede}
                              </div>
                            ))}
                            {sesionesDia.length > 3 ? (
                              <div className="text-[10px] text-slate-300">+{sesionesDia.length - 3} más</div>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-sm font-semibold text-white">Gestión de sedes</p>
                  <p className="mt-1 text-xs text-slate-300">Puedes crear y eliminar sedes libremente; no hace falta que estén preestablecidas.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={nuevaSede}
                      onChange={(evento) => {
                        setNuevaSede(evento.target.value)
                        setMensajeSede('')
                      }}
                      placeholder="Nueva sede"
                      className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={anadirSede}
                      className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                    >
                      Añadir sede
                    </button>
                  </div>
                  {mensajeSede ? <p className="mt-2 text-xs text-slate-300">{mensajeSede}</p> : null}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {sedes.map((sede) => (
                      <div key={sede} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                        <span className="text-xs text-slate-100">{sede}</span>
                        <button
                          type="button"
                          onClick={() => eliminarSede(sede)}
                          className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => alternarSeccionCalendario('disponibilidad')}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
                  >
                    Disponibilidad de jugadores
                    <span>{seccionesCalendarioAbiertas.disponibilidad ? '−' : '+'}</span>
                  </button>
                  {seccionesCalendarioAbiertas.disponibilidad ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {jugadores.map((jugador) => {
                        const disponible = jugador.disponibilidadFechas.includes(filtroFecha)
                        return (
                          <button
                            key={jugador.id}
                            type="button"
                            onClick={() => alternarDisponibilidadJugador(jugador.id, filtroFecha)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                              disponible
                                ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
                                : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/30'
                            }`}
                          >
                            {jugador.nombre} · {jugador.equipo}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => alternarSeccionCalendario('match')}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
                  >
                    Match de jugadores (estilo swipe)
                    <span>{seccionesCalendarioAbiertas.match ? '−' : '+'}</span>
                  </button>
                  {seccionesCalendarioAbiertas.match ? (
                    <div className="mt-3">
                      {matchActual ? (
                        <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-4">
                          <p className="text-xs text-fuchsia-100">Compatibles para {filtroFecha}</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {matchActual.jugadorA.nombre} ↔ {matchActual.jugadorB.nombre}
                          </p>
                          <p className="mt-2 text-xs text-slate-200">
                            Categoría: {matchActual.jugadorA.categoria} · Diferencia de edad: {matchActual.diferenciaEdad} año(s)
                          </p>
                          <p className="mt-2 text-xs text-slate-200">
                            Recurso(s) pendiente(s) en común: {matchActual.recursosCompartidos.slice(0, 4).join(' · ')}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-fuchsia-100">
                            Score compatibilidad: {matchActual.puntuacionCompatibilidad}
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="grid gap-1">
                              <label className="text-[10px] text-slate-300">Hora</label>
                              <input
                                type="time"
                                value={formMatch.hora}
                                onChange={(e) => setFormMatch((p) => ({ ...p, hora: e.target.value }))}
                                className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-[10px] text-slate-300">Sede</label>
                              <select
                                value={formMatch.sede}
                                onChange={(e) => setFormMatch((p) => ({ ...p, sede: e.target.value }))}
                                className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none"
                              >
                                {sedes.map((sede) => (
                                  <option key={sede} value={sede}>{sede}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid gap-1">
                              <label className="text-[10px] text-slate-300">Entrenador</label>
                              <select
                                value={formMatch.entrenadorId}
                                onChange={(e) => setFormMatch((p) => ({ ...p, entrenadorId: Number(e.target.value) }))}
                                className="rounded-lg border border-white/15 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none"
                              >
                                <option value={0}>Seleccionar</option>
                                {entrenadores.map((ent) => (
                                  <option key={ent.id} value={ent.id}>{ent.nombre}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={descartarMatchActual}
                              className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-100"
                            >
                              👎 Pasar
                            </button>
                            <button
                              type="button"
                              onClick={usarMatchEnSesion}
                              className="rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100"
                            >
                              ✅ Agendar sesión
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300">
                          No hay parejas compatibles para ese día con disponibilidad, misma categoría, diferencia de edad ≤ 3 y recursos pendientes en común.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => alternarSeccionCalendario('programar')}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
                  >
                    Programar sesión
                    <span>{seccionesCalendarioAbiertas.programar ? '−' : '+'}</span>
                  </button>
                  {seccionesCalendarioAbiertas.programar ? (
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs text-slate-300">Fecha</label>
                        <input
                          type="date"
                          value={formNuevaSesion.fecha}
                          onChange={(evento) => setFormNuevaSesion((previo) => ({ ...previo, fecha: evento.target.value }))}
                          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-slate-300">Hora</label>
                        <input
                          type="time"
                          value={formNuevaSesion.hora}
                          onChange={(evento) => setFormNuevaSesion((previo) => ({ ...previo, hora: evento.target.value }))}
                          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-slate-300">Sede</label>
                        <select
                          value={formNuevaSesion.sede}
                          onChange={(evento) => setFormNuevaSesion((previo) => ({ ...previo, sede: evento.target.value }))}
                          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                        >
                          {sedes.map((sede) => (
                            <option key={sede} value={sede}>
                              {sede}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-slate-300">Entrenador</label>
                        <select
                          value={formNuevaSesion.entrenadorId}
                          onChange={(evento) =>
                            setFormNuevaSesion((previo) => ({ ...previo, entrenadorId: Number(evento.target.value) }))
                          }
                          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value={0}>Seleccionar entrenador</option>
                          {entrenadores.map((entrenador) => (
                            <option key={entrenador.id} value={entrenador.id}>
                              {entrenador.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2 lg:col-span-2">
                        <label className="text-xs text-slate-300">Objetivo de la sesión</label>
                        <input
                          value={formNuevaSesion.objetivo}
                          onChange={(evento) => setFormNuevaSesion((previo) => ({ ...previo, objetivo: evento.target.value }))}
                          placeholder="Ejemplo: C4-C6 + H1-H2 con foco en lectura"
                          className="rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="grid gap-2 lg:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-300">Jugadores asignados</label>
                          <button
                            type="button"
                            onClick={() =>
                              setFormNuevaSesion((previo) => ({
                                ...previo,
                                jugadorIds: jugadoresDisponiblesFecha.map((jugador) => jugador.id),
                              }))
                            }
                            className="rounded-lg border border-blue-300/40 bg-blue-500/15 px-2 py-1 text-[11px] font-semibold text-blue-100"
                          >
                            Cargar disponibles del día
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {jugadores.map((jugador) => {
                            const activo = formNuevaSesion.jugadorIds.includes(jugador.id)
                            const disponible = jugador.disponibilidadFechas.includes(formNuevaSesion.fecha)
                            return (
                              <button
                                key={jugador.id}
                                type="button"
                                onClick={() => alternarJugadorEnSesion(jugador.id)}
                                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                                  activo
                                    ? 'border-blue-400/60 bg-blue-500/15 text-blue-100'
                                    : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-white/30'
                                }`}
                              >
                                {jugador.nombre} · {jugador.equipo}
                                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${disponible ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                                  {disponible ? 'Disponible' : 'No disponible'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={anadirSesionCalendario}
                        disabled={jugadoresNoDisponiblesEnSesion.length > 0}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition lg:col-span-2 ${
                          jugadoresNoDisponiblesEnSesion.length > 0
                            ? 'cursor-not-allowed bg-slate-600/70'
                            : 'bg-blue-500 hover:bg-blue-400'
                        }`}
                      >
                        Guardar sesión
                      </button>

                      {nuevaSesionTieneConflicto ? (
                        <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 lg:col-span-2">
                          Atención: hay posible solape de horario (misma hora y sede o mismo entrenador).
                        </p>
                      ) : null}

                      {jugadoresNoDisponiblesEnSesion.length > 0 ? (
                        <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 lg:col-span-2">
                          No se puede guardar: estos jugadores no están disponibles el día seleccionado ({formNuevaSesion.fecha}):{' '}
                          {jugadoresNoDisponiblesEnSesion.map((jugador) => jugador.nombre).join(', ')}.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => alternarSeccionCalendario('agenda')}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
                  >
                    Agenda por día
                    <span>{seccionesCalendarioAbiertas.agenda ? '−' : '+'}</span>
                  </button>
                  {seccionesCalendarioAbiertas.agenda ? (
                    <div className="mt-3 grid gap-4">
                      <div className="overflow-x-auto">
                        <div className="min-w-[900px] rounded-xl border border-white/10 bg-slate-900/40">
                          <div className="grid" style={{ gridTemplateColumns: `90px repeat(${Math.max(sedes.length, 1)}, minmax(140px, 1fr))` }}>
                            <div className="border-b border-r border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
                              Hora
                            </div>
                            {sedes.map((sede) => (
                              <div key={sede} className="border-b border-r border-white/10 bg-amber-500/20 px-3 py-3 text-center text-sm font-semibold text-slate-100 last:border-r-0">
                                {sede}
                              </div>
                            ))}

                            {horasAgendaDia.map((hora) => (
                              <div key={`fila-${hora}`} className="contents">
                                <div className="border-r border-t border-white/10 bg-white/5 px-3 py-4 text-center text-sm font-semibold text-slate-200">
                                  {hora}
                                </div>
                                {sedes.map((sede) => {
                                  const sesionesCelda = sesionesDelDia.filter((sesion) => sesion.hora === hora && sesion.sede === sede)

                                  return (
                                    <div key={`${hora}-${sede}`} className="min-h-[104px] border-r border-t border-white/10 bg-emerald-500/10 px-2 py-2 last:border-r-0">
                                      {sesionesCelda.length > 0 ? (
                                        <div className="grid gap-2">
                                          {sesionesCelda.map((sesion) => {
                                            const entrenador = entrenadores.find((item) => item.id === sesion.entrenadorId)
                                            const nombresJugadores = sesion.jugadorIds
                                              .map((id) => jugadores.find((jugador) => jugador.id === id)?.nombre)
                                              .filter(Boolean)
                                              .join(' · ')

                                            return (
                                              <div
                                                key={sesion.id}
                                                className={`rounded-lg border px-2 py-2 text-[11px] ${
                                                  idsSesionesConConflicto.has(sesion.id)
                                                    ? 'border-rose-300/40 bg-rose-500/15 text-rose-100'
                                                    : 'border-white/10 bg-slate-950/55 text-slate-100'
                                                }`}
                                              >
                                                <p className="font-semibold">{entrenador?.nombre ?? 'Sin entrenador'}</p>
                                                <p className="mt-1 leading-relaxed text-slate-200">{nombresJugadores || 'Sin jugadores'}</p>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                  <span className="text-[10px] text-slate-300">{sesion.objetivo || 'Sin objetivo'}</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => eliminarSesionCalendario(sesion.id)}
                                                    className="rounded border border-rose-300/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-100"
                                                  >
                                                    ×
                                                  </button>
                                                </div>
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
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                        <p className="text-sm font-semibold text-white">Disponibilidad de entrenadores ({filtroFecha})</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {disponibilidadEntrenadoresDia.map(({ entrenador, sesiones, ocupado }) => (
                            <div key={entrenador.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white">{entrenador.nombre}</p>
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                    ocupado ? 'bg-amber-500/20 text-amber-100' : 'bg-emerald-500/20 text-emerald-100'
                                  }`}
                                >
                                  {ocupado ? 'Ocupado' : 'Libre'}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">{entrenador.especialidad}</p>
                              {sesiones.length > 0 ? (
                                <div className="mt-3 grid gap-1">
                                  {sesiones.map((sesion) => (
                                    <div key={sesion.id} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
                                      {sesion.hora} · {sesion.sede}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-3 text-xs text-slate-300">Sin sesiones asignadas en este día.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => alternarSeccionCalendario('semanal')}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
                  >
                    Vista semanal
                    <span>{seccionesCalendarioAbiertas.semanal ? '−' : '+'}</span>
                  </button>
                  {seccionesCalendarioAbiertas.semanal ? (
                    <div className="mt-3">
                      <p className="mb-3 text-xs text-slate-300">Semana del {diasSemanaActiva[0]?.fechaISO} al {diasSemanaActiva[6]?.fechaISO}</p>
                      <div className="grid gap-3 lg:grid-cols-7">
                        {diasSemanaActiva.map((dia) => {
                          const sesionesDia = sesiones
                            .filter((sesion) => sesion.fecha === dia.fechaISO)
                            .sort((a, b) => a.hora.localeCompare(b.hora))

                          return (
                            <div key={dia.fechaISO} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                              <button
                                type="button"
                                onClick={() => setFiltroFecha(dia.fechaISO)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-left text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                              >
                                {dia.nombre}
                                <span className="ml-1 text-slate-300">{dia.fechaISO.slice(5)}</span>
                              </button>

                              <div className="mt-2 grid gap-2">
                                {sesionesDia.length > 0 ? (
                                  sesionesDia.map((sesion) => {
                                    const entrenador = entrenadores.find((item) => item.id === sesion.entrenadorId)
                                    return (
                                      <div key={sesion.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                                        <p className="text-[11px] font-semibold text-white">{sesion.hora} · {sesion.sede}</p>
                                        <p className="mt-1 text-[11px] text-slate-300">{entrenador?.nombre ?? 'Sin entrenador'}</p>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="text-[11px] text-slate-400">Sin sesiones</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
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
      )}
    </main>
  )
}

export default App
