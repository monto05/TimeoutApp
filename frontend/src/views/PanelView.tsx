import { opcionesInterfazGestion } from '../data/appSeeds'
import type { InterfazGestion } from '../types/app'

type Props = {
  correoSesion: string
  onAbrirInterfaz: (interfaz: InterfazGestion) => void
  onCerrarSesion: () => void
}

export function PanelView({ correoSesion, onAbrirInterfaz, onCerrarSesion }: Props) {
  const opciones = [
    { ...opcionesInterfazGestion[0], text: 'Fichas, progreso, planificación individual y seguimiento.' },
    { ...opcionesInterfazGestion[1], text: 'Objetivos, evaluaciones, vídeo-feedback, comunicación con familias e informes automáticos.' },
    { ...opcionesInterfazGestion[2], text: 'Recursos por nivel, posición y biblioteca metodológica.' },
    { ...opcionesInterfazGestion[3], text: 'Equipo técnico, especialidades y datos de contacto.' },
    { ...opcionesInterfazGestion[4], text: 'Disponibilidad, sedes, agenda diaria y vista semanal.' },
    { ...opcionesInterfazGestion[5], text: 'Correos y contraseñas de acceso a la plataforma.' },
  ]

  return (
    <section className="relative mx-auto flex min-h-[85vh] w-full max-w-6xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-14">
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200/90">Panel principal</p>
            <h2 className="mt-1 text-3xl font-bold text-white">¿Qué quieres gestionar hoy?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Selecciona un área para entrar en una vista más limpia y específica.
            </p>
            {correoSesion ? (
              <p className="mt-1 text-xs text-slate-400">Sesión: {correoSesion}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCerrarSesion}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {opciones.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onAbrirInterfaz(item.value)}
              className="group rounded-2xl border border-white/10 bg-slate-900/45 p-6 text-left transition hover:border-blue-300/40 hover:bg-slate-900/70"
            >
              <p className="text-lg font-semibold text-white transition group-hover:text-blue-100">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
              <span className="mt-5 inline-flex rounded-full border border-blue-300/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                Entrar
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
