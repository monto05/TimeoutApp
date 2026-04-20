import { bloquesRecurso, gruposRecurso } from '../config/appConfig'
import type {
  Aspecto,
  Entrenador,
  InterfazGestion,
  Jugador,
  PermisoUsuario,
  Recurso,
  Sede,
  SesionCalendario,
} from '../types/app'

export const permisosIniciales: PermisoUsuario[] = [
  { correo: 'direccion@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'staff@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'coordinacion@timeoutworkouts.com', password: 'timeout123' },
  { correo: 'viewer@timeoutworkouts.com', password: 'timeout123' },
]

export const sedesIniciales: Sede[] = ['GreenField', 'Colegio Aleman', 'Tajamar']

export const recursosIniciales: Recurso[] = [
  { id: 1, nombre: 'C1 · 1c1 lateral o frontal', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Atacar desde triple amenaza en estático.' },
  { id: 2, nombre: 'C2 · 1c1 en carrera', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Llegada agresiva desde desventaja o ventaja dinámica.' },
  { id: 3, nombre: 'C3 · Closeouts', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Atacar tras recuperación defensiva en ventaja o equilibrio.' },
  { id: 4, nombre: 'C4 · Bloqueo directo central/lateral', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Aplicar lecturas ante show, flat, under, switch y variantes.' },
  { id: 5, nombre: 'C5 · Situaciones de juego', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Crear contextos con BD (zipper, DHO + BD).' },
  { id: 6, nombre: 'C6 · BI (lectura del defensor)', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Leer defensor por encima, por debajo y en contacto.' },
  { id: 7, nombre: 'C7 · Pick and pop', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Jugar desde recepción abierta con toma de decisión rápida.' },
  { id: 8, nombre: 'C8 · Poste bajo/alto', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Jugar con espalda/cara, pivotes, fintas y contacto real.' },
  { id: 9, nombre: 'C9 · Continuaciones del roll', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'Sellar y decidir entre deep roll o short roll.' },
  { id: 10, nombre: 'C10 · Tiro en situación real', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Mecánica, cognitivo, paradas y punteos en contexto de juego.' },
  { id: 11, nombre: 'D1 · Proximidad defensiva', grupo: 'Dificultades', bloque: 'Táctica', descripcion: 'Defensor bien posicionado y equilibrado: cerca/contacto vs media distancia.' },
  { id: 12, nombre: 'D2 · Espacio limitado', grupo: 'Dificultades', bloque: 'Táctica', descripcion: 'Detectar espacio colapsado o libre para acelerar y atacar.' },
  { id: 13, nombre: 'D3 · Control del ritmo', grupo: 'Dificultades', bloque: 'Técnica', descripcion: 'Acelerar, frenar, pausar y variar tipos de bote con intención.' },
  { id: 14, nombre: 'D4 · Recuperación defensiva', grupo: 'Dificultades', bloque: 'Táctica', descripcion: 'Resolver early cut y late cut con contra-movimientos o finalización rápida.' },
  { id: 15, nombre: 'H1 · Posición inicial del defensor', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Introducir presión, hombro con hombro, desventaja y acciones previas.' },
  { id: 16, nombre: 'H2 · Reglas espacio-temporales', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Delimitar zona de 1c1 e incorporar cuenta atrás.' },
  { id: 17, nombre: 'H3 · Limitaciones defensivas', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Condicionar al defensor (por ejemplo, solo un brazo).' },
  { id: 18, nombre: 'H4 · Condiciones ofensivas', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Obligaciones ofensivas y puntuaciones con acciones encadenadas.' },
  { id: 19, nombre: 'Sesión 0 · Finalizaciones técnicas', grupo: 'Sesión', bloque: 'Técnica', descripcion: 'Evaluar precisión, velocidad y adaptabilidad desde distintos ángulos.' },
  { id: 20, nombre: 'Sesión Timeout · Volumen de tiro', grupo: 'Sesión', bloque: 'Técnica', descripcion: 'Bloque de alto volumen tras activación, gesto técnico y contextualización.' },
  { id: 21, nombre: 'M1 · Manipulación de balón', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Control fino de balón con ambas manos en estático y desplazamiento.' },
  { id: 22, nombre: 'M2 · Correr con el balón', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Bote en carrera con cambios de ritmo y protección.' },
  { id: 23, nombre: 'M3 · Ritmo de bote', grupo: 'Dificultades', bloque: 'Técnica', descripcion: 'Alternar cadencias de bote y pausas para crear ventaja.' },
  { id: 24, nombre: 'M4 · Cambios de altura', grupo: 'Dificultades', bloque: 'Técnica', descripcion: 'Transiciones alto-bajo para proteger y acelerar.' },
  { id: 25, nombre: 'M5 · Parar y arrancar', grupo: 'Dificultades', bloque: 'Táctica', descripcion: 'Frenadas y nuevas aceleraciones con control de equilibrio.' },
  { id: 26, nombre: 'M6 · Movimiento de pies', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Coordinación de apoyos para salida, parada y finalización.' },
  { id: 27, nombre: 'M7 · Engaño de mirada/cintura/hombro', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Uso de fintas corporales para desplazar al defensor.' },
  { id: 28, nombre: 'BASE · Finalizaciones reactivas', grupo: 'Sesión', bloque: 'Técnica', descripcion: '1 paso, mismo pie y mano, mano contraria, batida, spin, reverso, euro-step.' },
  { id: 29, nombre: 'BASE · Contactos y apoyos', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Bump+batida/apoyo/euro-step, sobre agarre+batida, stride stop, floater, swing step.' },
  { id: 30, nombre: 'BASE · Catch (fintas + salidas)', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Side jab, cross, lilliard, spin pivot, catch&go, salidas sin pausa, split catch.' },
  { id: 31, nombre: 'BASE · Tiro reactivo', grupo: 'Dificultades', bloque: 'Técnica', descripcion: 'Hop, 1-2, 1-hop, bote, step in, negativa, side step, recortar.' },
  { id: 32, nombre: 'BASE · Footwork carrera/desequilibrio/frenada', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'In&out, in&out+cross, push cross, drop, BTL/BTB, cross step, under drag, partial stop.' },
  { id: 33, nombre: 'ESCOLTA · Finalizaciones y apoyos laterales', grupo: 'Sesión', bloque: 'Técnica', descripcion: '1 paso, mismo pie y mano, mano contraria, batida, floater, runner, spin, stride stop.' },
  { id: 34, nombre: 'ESCOLTA · Contactos por bote y agarre', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Bump+step, bump+runner, bump+euro, bump+swing, veer finish, body-body.' },
  { id: 35, nombre: 'ESCOLTA · Catch y generar espacio', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Side jab, cross, lilliard, spin pivot, catch&go, split catch, hip rotation+combos.' },
  { id: 36, nombre: 'ESCOLTA · Tiro + footwork', grupo: 'Dificultades', bloque: 'Táctica', descripcion: 'Reactivo (hop, 1-2, step-in, side-step) y gestos de carrera/frenada (push cross, under drag).' },
  { id: 37, nombre: 'ALEROS · Finalizaciones', grupo: 'Sesión', bloque: 'Técnica', descripcion: '1 paso, mismo pie y mano, mano contraria, batida, spin, swing, euro, slow-step.' },
  { id: 38, nombre: 'ALEROS · Contactos y por fondo', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Bump+step/runner/euro/swing, veer finish, body-body, atacar+step-through, spin.' },
  { id: 39, nombre: 'ALEROS · Catch', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Side jab, cross, spin pivot, shimmy, catch&go, catch+push, split catch, estampida.' },
  { id: 40, nombre: 'ALEROS · Tiro reactivo', grupo: 'Dificultades', bloque: 'Técnica', descripcion: 'Hop, 1-2, 1-hop, bote, step-in, negativa, side-step, recortar, salida.' },
  { id: 41, nombre: 'ALEROS · Footwork', grupo: 'Recursos', bloque: 'Táctica', descripcion: 'In&out, push cross, cross jab, wrap, BTL, under drag, inverted drag, speed stop, cross step.' },
  { id: 42, nombre: 'ALEROS · Low post', grupo: 'Sesión', bloque: 'Táctica', descripcion: 'Bote muelle (semi-gancho, floater, reverso), spin, Tim Duncan y Dirk (fondo/centro).' },
  { id: 43, nombre: 'ALA PÍVOT · Finalizaciones', grupo: 'Sesión', bloque: 'Técnica', descripcion: '1 paso, reverso, batida, swing, euro-step, mate.' },
  { id: 44, nombre: 'ALA PÍVOT · Contactos y por fondo', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Bump+step/runner/euro/swing, veer finish, atacar+step through, spin, extensión lado contrario.' },
  { id: 45, nombre: 'ALA PÍVOT · Catch y tiro', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Side jab, cross, spin pivot, shimmy, catch&go, split catch, reactivo hasta 0-1 hop.' },
  { id: 46, nombre: 'ALA PÍVOT · Footwork y low post', grupo: 'Sesión', bloque: 'Táctica', descripcion: 'In&out, push cross, cross jab, wrap, BTL + paquete low post.' },
  { id: 47, nombre: 'PÍVOT · Finalizaciones', grupo: 'Sesión', bloque: 'Técnica', descripcion: '1 paso, floater, batida y juego de pies corto en tráfico.' },
  { id: 48, nombre: 'PÍVOT · Contactos y por fondo', grupo: 'Handicaps', bloque: 'Táctica', descripcion: 'Bump+step/euro, veer finish, atacar fondo y atacar centro con step-through.' },
  { id: 49, nombre: 'PÍVOT · Catch', grupo: 'Recursos', bloque: 'Técnica', descripcion: 'Side jab, cross, shimmy, catch funcional para continuidad interior.' },
  { id: 50, nombre: 'PÍVOT · Low post bote muelle', grupo: 'Sesión', bloque: 'Táctica', descripcion: 'Semi gancho, floater, gancho, reverso, step through y open.' },
  { id: 51, nombre: 'PÍVOT · Low post spin', grupo: 'Sesión', bloque: 'Táctica', descripcion: 'Spin y spin+step through con lectura de ayuda.' },
  { id: 52, nombre: 'PÍVOT · Low post finalizadores (Dirk / Duncan)', grupo: 'Sesión', bloque: 'Táctica', descripcion: 'Dirk: atacar fondo con 1-2 y jab. Duncan: atacar directo, spin, jab+atacar fondo.' },
]

export const jugadoresIniciales: Jugador[] = [
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

export const entrenadoresIniciales: Entrenador[] = [
  { id: 1, nombre: 'Carlos Navarro', fotoUrl: '', especialidad: 'Técnica individual', experiencia: 8, email: 'carlos@timeoutworkouts.com', telefono: '+34 600 111 222' },
  { id: 2, nombre: 'Laura Beltrán', fotoUrl: '', especialidad: 'Táctica y toma de decisiones', experiencia: 6, email: 'laura@timeoutworkouts.com', telefono: '+34 600 333 444' },
  { id: 3, nombre: 'Miguel Torres', fotoUrl: '', especialidad: 'Preparación física específica', experiencia: 10, email: 'miguel@timeoutworkouts.com', telefono: '+34 600 555 666' },
]

export const sesionesIniciales: SesionCalendario[] = []

export const plantillaAspectosPorCategoria: Record<string, Aspecto[]> = {
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

export const categoriasJugador = Object.keys(plantillaAspectosPorCategoria)
export const horasSugeridas = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
export const opcionesInterfazGestion: Array<{ value: InterfazGestion; label: string }> = [
  { value: 'gestion-jugadores', label: 'Jugadores' },
  { value: 'gestion-player-development', label: 'Player Development' },
  { value: 'gestion-conceptos', label: 'Biblioteca de recursos' },
  { value: 'gestion-entrenadores', label: 'Entrenadores' },
  { value: 'gestion-calendario', label: 'Calendario' },
  { value: 'gestion-permisos', label: 'Usuarios' },
]

export const PALETA_SEDE = [
  {
    header: 'bg-emerald-500/35 text-emerald-50',
    cell: 'bg-emerald-500/12',
    coach: 'bg-emerald-500/10',
    chip: 'border-emerald-300/35 bg-emerald-500/20 text-emerald-100',
  },
  {
    header: 'bg-cyan-500/35 text-cyan-50',
    cell: 'bg-cyan-500/12',
    coach: 'bg-cyan-500/10',
    chip: 'border-cyan-300/35 bg-cyan-500/20 text-cyan-100',
  },
  {
    header: 'bg-violet-500/35 text-violet-50',
    cell: 'bg-violet-500/12',
    coach: 'bg-violet-500/10',
    chip: 'border-violet-300/35 bg-violet-500/20 text-violet-100',
  },
  {
    header: 'bg-amber-500/35 text-amber-50',
    cell: 'bg-amber-500/12',
    coach: 'bg-amber-500/10',
    chip: 'border-amber-300/35 bg-amber-500/20 text-amber-100',
  },
  {
    header: 'bg-fuchsia-500/35 text-fuchsia-50',
    cell: 'bg-fuchsia-500/12',
    coach: 'bg-fuchsia-500/10',
    chip: 'border-fuchsia-300/35 bg-fuchsia-500/20 text-fuchsia-100',
  },
] as const

export { bloquesRecurso, gruposRecurso }