import { normalizarCorreo } from '../lib/appHelpers'

type Props = {
  correoLogin: string
  setCorreoLogin: (v: string) => void
  passwordLogin: string
  setPasswordLogin: (v: string) => void
  modoAcceso: 'login' | 'registro'
  pasoLogin: 'correo' | 'password'
  setPasoLogin: (v: 'correo' | 'password') => void
  mensajeLogin: string
  setMensajeLogin: (v: string) => void
  correoRegistro: string
  setCorreoRegistro: (v: string) => void
  passwordRegistro: string
  setPasswordRegistro: (v: string) => void
  confirmacionRegistro: string
  setConfirmacionRegistro: (v: string) => void
  mensajeRegistro: string
  setMensajeRegistro: (v: string) => void
  cambiarModoAcceso: (modo: 'login' | 'registro') => void
  iniciarSesion: () => void
  registrarNuevoUsuario: () => void
}

export function LoginView({
  correoLogin,
  setCorreoLogin,
  passwordLogin,
  setPasswordLogin,
  modoAcceso,
  pasoLogin,
  setPasoLogin,
  mensajeLogin,
  setMensajeLogin,
  correoRegistro,
  setCorreoRegistro,
  passwordRegistro,
  setPasswordRegistro,
  confirmacionRegistro,
  setConfirmacionRegistro,
  mensajeRegistro,
  setMensajeRegistro,
  cambiarModoAcceso,
  iniciarSesion,
  registrarNuevoUsuario,
}: Props) {
  return (
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
                  onChange={(e) => {
                    setCorreoLogin(e.target.value)
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
                    onChange={(e) => {
                      setPasswordLogin(e.target.value)
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
                  onChange={(e) => {
                    setCorreoRegistro(e.target.value)
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
                  onChange={(e) => {
                    setPasswordRegistro(e.target.value)
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
                  onChange={(e) => {
                    setConfirmacionRegistro(e.target.value)
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
  )
}
