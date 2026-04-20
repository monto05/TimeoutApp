import { useMemo, useState } from 'react'
import { normalizarCorreo } from '../../lib/appHelpers'
import type { Entrenador, PermisoUsuario, Recurso, Sede } from '../../types/app'

type Params = {
  permisos: PermisoUsuario[]
  setPermisos: React.Dispatch<React.SetStateAction<PermisoUsuario[]>>
  recursos: Recurso[]
  entrenadores: Entrenador[]
  sedes: Sede[]
  guardarAdministracionInmediatamente: (
    recursos: Recurso[],
    entrenadores: Entrenador[],
    permisos: PermisoUsuario[],
    sedes: Sede[],
  ) => Promise<void>
  onLoginSuccess: () => void
}

export function useAuth({
  permisos,
  setPermisos,
  recursos,
  entrenadores,
  sedes,
  guardarAdministracionInmediatamente,
  onLoginSuccess,
}: Params) {
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

  const permisosPorCorreo = useMemo(
    () => new Map(permisos.map((p) => [normalizarCorreo(p.correo), p])),
    [permisos],
  )

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
    setMensajeLogin('')
    setPasoLogin('correo')
    setPasswordLogin('')
    onLoginSuccess()
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

    const nuevosPermisos = [...permisos, { correo, password }]
    setPermisos(nuevosPermisos)
    void guardarAdministracionInmediatamente(recursos, entrenadores, nuevosPermisos, sedes)
    setMensajeRegistro('Usuario creado. Ya puedes iniciar sesión con ese correo.')
    setCorreoLogin(correo)
    setPasoLogin('password')
    setModoAcceso('login')
    setPasswordRegistro('')
    setConfirmacionRegistro('')
  }

  const resetearSesion = () => {
    setCorreoSesion('')
    setModoAcceso('login')
    setPasoLogin('correo')
    setPasswordLogin('')
    setMensajeLogin('')
    setMensajeRegistro('')
  }

  return {
    correoSesion,
    correoLogin, setCorreoLogin,
    passwordLogin, setPasswordLogin,
    modoAcceso,
    pasoLogin, setPasoLogin,
    mensajeLogin, setMensajeLogin,
    correoRegistro, setCorreoRegistro,
    passwordRegistro, setPasswordRegistro,
    confirmacionRegistro, setConfirmacionRegistro,
    mensajeRegistro, setMensajeRegistro,
    permisosPorCorreo,
    cambiarModoAcceso,
    iniciarSesion,
    registrarNuevoUsuario,
    resetearSesion,
  }
}
