import { PALETA_SEDE, permisosIniciales, recursosIniciales } from '../data/appSeeds'
import { PASSWORD_INICIAL } from '../config/appConfig'
import type {
  BloqueRecurso,
  Entrenador,
  GrupoRecurso,
  Jugador,
  NivelRecurso,
  PermisoUsuario,
  PosicionRecurso,
  Recurso,
  Sede,
} from '../types/app'

export const colorPrioridad = (prioridad: 'Alta' | 'Media' | 'Baja') => {
  switch (prioridad) {
    case 'Alta':
      return 'bg-rose-600/80 text-white border-rose-300/40'
    case 'Media':
      return 'bg-amber-500/80 text-slate-900 border-amber-300/40'
    default:
      return 'bg-slate-700/60 text-slate-200 border-white/10'
  }
}

export function normalizarNivelJugador(categoria: string, nivel?: string): NivelRecurso {
  const valor = `${categoria} ${nivel ?? ''}`.toLowerCase()
  if (valor.includes('oro')) return 'Oro'
  if (valor.includes('azul') || valor.includes('raising')) return 'Azul'
  if (valor.includes('plata') || valor.includes('standard')) return 'Plata'
  return 'Bronce'
}

export function normalizarPosicionJugador(posicion: string): PosicionRecurso {
  const valor = posicion.trim().toLowerCase()
  if (valor.includes('base')) return 'Base'
  if (valor.includes('escolta') || valor.includes('silla')) return 'Escolta'
  if (valor.includes('alero')) return 'Alero'
  if (valor.includes('ala') && valor.includes('piv')) return 'Ala Pívot'
  if (valor.includes('pivot') || valor.includes('pívot')) return 'Pívot'
  return 'Base'
}

export function inferirPosicionRecurso(nombre: string): PosicionRecurso {
  const prefijo = nombre.split('·')[0].trim().toUpperCase()
  if (prefijo.startsWith('BASE')) return 'Base'
  if (prefijo.startsWith('ESCOLTA')) return 'Escolta'
  if (prefijo.startsWith('ALERO')) return 'Alero'
  if (prefijo.startsWith('ALA PÍVOT') || prefijo.startsWith('ALA PIVOT')) return 'Ala Pívot'
  if (prefijo.startsWith('PÍVOT') || prefijo.startsWith('PIVOT')) return 'Pívot'
  return 'General'
}

export function inferirNivelRecurso(nombre: string): NivelRecurso {
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

export function normalizarGrupoRecurso(grupo: GrupoRecurso): GrupoRecurso {
  if (grupo === 'Dificultades' || grupo === 'Handicaps' || grupo === 'Sesión') return grupo
  return 'Recursos'
}

export function normalizarBloqueRecurso(bloque: BloqueRecurso): BloqueRecurso {
  if (bloque === 'Técnica') return bloque
  return 'Técnica'
}

export function normalizarRecursos(recursos: Recurso[]): Recurso[] {
  return recursos.map((recurso) => ({
    ...recurso,
    grupo: normalizarGrupoRecurso(recurso.grupo),
    bloque: normalizarBloqueRecurso(recurso.bloque),
    posicion: recurso.posicion ?? inferirPosicionRecurso(recurso.nombre),
    nivel: recurso.nivel ?? inferirNivelRecurso(recurso.nombre),
  }))
}

export function leerStorage<T>(clave: string, valorInicial: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    if (!crudo) return valorInicial
    return JSON.parse(crudo) as T
  } catch {
    return valorInicial
  }
}

export function normalizarCorreo(correo: string) {
  return correo.trim().toLowerCase()
}

export function normalizarJugadores(jugadores: Jugador[]): Jugador[] {
  return jugadores.map((jugador) => ({
    ...jugador,
    fotoUrl: jugador.fotoUrl ?? '',
    disponibilidadFechas: jugador.disponibilidadFechas ?? [],
    nivel: jugador.nivel ?? jugador.categoria ?? 'Skills (Bronce)',
  }))
}

export function normalizarEntrenadores(entrenadores: Entrenador[]): Entrenador[] {
  return entrenadores.map((entrenador) => ({
    ...entrenador,
    fotoUrl: entrenador.fotoUrl ?? '',
  }))
}

export function mezclarRecursosConIniciales(recursosActuales: Recurso[]): Recurso[] {
  const porId = new Map<number, Recurso>()
  normalizarRecursos(recursosIniciales).forEach((recurso) => porId.set(recurso.id, recurso))
  normalizarRecursos(recursosActuales).forEach((recurso) => porId.set(recurso.id, recurso))
  return Array.from(porId.values()).sort((a, b) => a.id - b.id)
}

export function normalizarPermisos(permisos: PermisoUsuario[]): PermisoUsuario[] {
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

export function normalizarSedes(sedes: Sede[]): Sede[] {
  const unicas = new Set(
    sedes
      .map((sede) => String(sede ?? '').trim())
      .filter(Boolean),
  )

  return Array.from(unicas)
}

export function formatearFechaISO(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function desplazarFechaISO(fechaISO: string, dias: number) {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  fecha.setDate(fecha.getDate() + dias)
  return formatearFechaISO(fecha)
}

export function estiloSedePorIndice(indice: number) {
  return PALETA_SEDE[indice % PALETA_SEDE.length]
}

export function obtenerIniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function archivoADataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })
}