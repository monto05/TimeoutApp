import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:27017'
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'timeout_app'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
const AI_MODEL = process.env.AI_MODEL ?? 'gpt-4.1-mini'

const esArrayValido = (valor) => Array.isArray(valor)
const extraerJsonDeTexto = (texto = '') => {
  const limpio = texto.trim()
  if (!limpio) return null

  try {
    return JSON.parse(limpio)
  } catch {
    const inicio = limpio.indexOf('{')
    const fin = limpio.lastIndexOf('}')
    if (inicio === -1 || fin === -1 || fin <= inicio) return null

    try {
      return JSON.parse(limpio.slice(inicio, fin + 1))
    } catch {
      return null
    }
  }
}

const extraerPermisosYSedes = (valor) => {
  if (Array.isArray(valor)) {
    return { permisos: valor, sedes: null }
  }

  if (valor && typeof valor === 'object') {
    const permisos = Array.isArray(valor.items) ? valor.items : []
    const sedes = Array.isArray(valor.sedes) ? valor.sedes : null

    return { permisos, sedes }
  }

  return { permisos: null, sedes: null }
}

const mongoClient = new MongoClient(MONGODB_URL, {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
  socketTimeoutMS: 5000,
})
let mongoConectado = false

const obtenerColeccionSnapshots = async () => {
  if (!mongoConectado) {
    await mongoClient.connect()
    mongoConectado = true
  }

  return mongoClient.db(MONGODB_DB_NAME).collection('app_snapshots')
}

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, service: 'timeout-backend' })
})

app.get('/api/health', async (_req, res) => {
  try {
    await (await obtenerColeccionSnapshots()).findOne({ _id: 'default' })
    return res.json({ ok: true, database: 'connected', engine: 'mongodb' })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      database: 'disconnected',
      engine: 'mongodb',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

app.get('/api/state', async (_req, res) => {
  try {
    const snapshots = await obtenerColeccionSnapshots()
    const snapshot = await snapshots.findOne({ _id: 'default' })

    if (!snapshot) {
      return res.json({
        jugadores: null,
        recursos: null,
        entrenadores: null,
        sesiones: null,
        feedbackSesiones: null,
        seguimientosJugadores: null,
        permisos: null,
        sedes: null,
        updatedAt: null,
        versions: {
          jugadores: 0,
          recursos: 0,
          entrenadores: 0,
          sesiones: 0,
          feedbackSesiones: 0,
          seguimientosJugadores: 0,
          permisos: 0,
        },
      })
    }

    const { permisos, sedes } = extraerPermisosYSedes(snapshot.permisos)

    return res.json({
      jugadores: snapshot.jugadores,
      recursos: snapshot.recursos,
      entrenadores: snapshot.entrenadores,
      sesiones: snapshot.sesiones,
      feedbackSesiones: snapshot.feedbackSesiones,
      seguimientosJugadores: snapshot.seguimientosJugadores,
      permisos,
      sedes,
      updatedAt: snapshot.updatedAt,
      versions: {
        jugadores: snapshot.versions?.jugadores ?? 0,
        recursos: snapshot.versions?.recursos ?? 0,
        entrenadores: snapshot.versions?.entrenadores ?? 0,
        sesiones: snapshot.versions?.sesiones ?? 0,
        feedbackSesiones: snapshot.versions?.feedbackSesiones ?? 0,
        seguimientosJugadores: snapshot.versions?.seguimientosJugadores ?? 0,
        permisos: snapshot.versions?.permisos ?? 0,
      },
    })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo leer el estado en base de datos.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

app.put('/api/state', async (req, res) => {
  const { jugadores, recursos, entrenadores, sesiones, feedbackSesiones, seguimientosJugadores, permisos, sedes, versions } = req.body ?? {}

  if (
    !esArrayValido(jugadores) ||
    !esArrayValido(recursos) ||
    !esArrayValido(entrenadores) ||
    !esArrayValido(sesiones) ||
    !esArrayValido(feedbackSesiones) ||
    !esArrayValido(seguimientosJugadores) ||
    !esArrayValido(permisos) ||
    !esArrayValido(sedes)
  ) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const snapshots = await obtenerColeccionSnapshots()
    const snapshot = await snapshots.findOne({ _id: 'default' })
    
    const currentVersions = snapshot?.versions ?? {
      jugadores: 0,
      recursos: 0,
      entrenadores: 0,
      sesiones: 0,
      feedbackSesiones: 0,
      seguimientosJugadores: 0,
      permisos: 0,
    }

    const updatedAt = new Date()
    const newVersions = { ...currentVersions }

    // Merge automático: si las versiones coinciden, incrementar; si no, significa que hubo cambio remoto
    // En este caso, el frontend debería haber obtenido el nuevo estado, así que procedemos
    // Incrementar versiones para colecciones que se están guardando
    newVersions.jugadores++
    newVersions.recursos++
    newVersions.entrenadores++
    newVersions.sesiones++
    newVersions.feedbackSesiones++
    newVersions.seguimientosJugadores++
    newVersions.permisos++

    await snapshots.updateOne(
      { _id: 'default' },
      {
        $set: {
          jugadores,
          recursos,
          entrenadores,
          sesiones,
          feedbackSesiones,
          seguimientosJugadores,
          permisos: {
            items: permisos,
            sedes,
          },
          versions: newVersions,
          updatedAt,
        },
        $setOnInsert: {
          createdAt: updatedAt,
        },
      },
      { upsert: true },
    )

    return res.json({ ok: true, updatedAt, versions: newVersions })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo guardar el estado en base de datos.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

// Endpoint específico para guardar solo sesiones (sin debounce)
app.put('/api/sesiones', async (req, res) => {
  const { sesiones, feedbackSesiones } = req.body ?? {}

  if (!esArrayValido(sesiones) || !esArrayValido(feedbackSesiones)) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const snapshots = await obtenerColeccionSnapshots()
    const snapshot = await snapshots.findOne({ _id: 'default' })
    
    const updatedAt = new Date()
    const newVersions = snapshot?.versions ? { ...snapshot.versions } : {
      jugadores: 0,
      recursos: 0,
      entrenadores: 0,
      sesiones: 0,
      feedbackSesiones: 0,
      seguimientosJugadores: 0,
      permisos: 0,
    }
    
    newVersions.sesiones = (newVersions.sesiones ?? 0) + 1
    newVersions.feedbackSesiones = (newVersions.feedbackSesiones ?? 0) + 1

    await snapshots.updateOne(
      { _id: 'default' },
      {
        $set: {
          sesiones, // Sobrescribir sesiones
          feedbackSesiones, // Sobrescribir feedback
          versions: newVersions,
          updatedAt,
        },
        $setOnInsert: {
          // Inicializar documento si no existe
          jugadores: [],
          recursos: [],
          entrenadores: [],
          sesiones,
          feedbackSesiones,
          seguimientosJugadores: [],
          permisos: { items: [], sedes: [] },
          versions: newVersions,
          createdAt: updatedAt,
          updatedAt,
        },
      },
      { upsert: true },
    )

    return res.json({ ok: true, updatedAt, versions: newVersions })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo guardar sesiones.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

// Endpoint específico para guardar solo jugadores (sin debounce)
app.put('/api/jugadores', async (req, res) => {
  const { jugadores } = req.body ?? {}

  if (!esArrayValido(jugadores)) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const snapshots = await obtenerColeccionSnapshots()
    const snapshot = await snapshots.findOne({ _id: 'default' })
    
    const updatedAt = new Date()
    const newVersions = snapshot?.versions ? { ...snapshot.versions } : {
      jugadores: 0,
      recursos: 0,
      entrenadores: 0,
      sesiones: 0,
      feedbackSesiones: 0,
      seguimientosJugadores: 0,
      permisos: 0,
    }
    
    newVersions.jugadores = (newVersions.jugadores ?? 0) + 1

    await snapshots.updateOne(
      { _id: 'default' },
      {
        $set: {
          jugadores,
          versions: newVersions,
          updatedAt,
        },
        $setOnInsert: {
          // Inicializar documento si no existe
          jugadores,
          recursos: [],
          entrenadores: [],
          sesiones: [],
          feedbackSesiones: [],
          seguimientosJugadores: [],
          permisos: { items: [], sedes: [] },
          versions: newVersions,
          createdAt: updatedAt,
          updatedAt,
        },
      },
      { upsert: true },
    )

    return res.json({ ok: true, updatedAt, versions: newVersions })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo guardar jugadores.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

app.put('/api/admin-data', async (req, res) => {
  const { recursos, entrenadores, permisos, sedes } = req.body ?? {}

  if (!esArrayValido(recursos) || !esArrayValido(entrenadores) || !esArrayValido(permisos) || !esArrayValido(sedes)) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const snapshots = await obtenerColeccionSnapshots()
    const snapshot = await snapshots.findOne({ _id: 'default' })

    const updatedAt = new Date()
    const newVersions = snapshot?.versions ? { ...snapshot.versions } : {
      jugadores: 0,
      recursos: 0,
      entrenadores: 0,
      sesiones: 0,
      feedbackSesiones: 0,
      seguimientosJugadores: 0,
      permisos: 0,
    }

    newVersions.recursos = (newVersions.recursos ?? 0) + 1
    newVersions.entrenadores = (newVersions.entrenadores ?? 0) + 1
    newVersions.permisos = (newVersions.permisos ?? 0) + 1

    await snapshots.updateOne(
      { _id: 'default' },
      {
        $set: {
          recursos,
          entrenadores,
          permisos: {
            items: permisos,
            sedes,
          },
          versions: newVersions,
          updatedAt,
        },
        $setOnInsert: {
          jugadores: [],
          recursos,
          entrenadores,
          sesiones: [],
          feedbackSesiones: [],
          seguimientosJugadores: [],
          permisos: {
            items: permisos,
            sedes,
          },
          versions: newVersions,
          createdAt: updatedAt,
          updatedAt,
        },
      },
      { upsert: true },
    )

    return res.json({ ok: true, updatedAt, versions: newVersions })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo guardar datos de administración.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

app.post('/api/ai/sugerir-objetivo', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY no configurada en backend.' })
  }

  const { fecha, hora, sede, entrenador, jugadores } = req.body ?? {}

  if (!fecha || !hora || !sede || !Array.isArray(jugadores) || jugadores.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para generar la sugerencia IA.' })
  }

  const contexto = {
    fecha,
    hora,
    sede,
    entrenador: entrenador ?? null,
    jugadores,
  }

  const systemPrompt = [
    'Eres un asistente experto en entrenamiento individual de baloncesto para metodologia Timeout Workouts.',
    'Devuelve SIEMPRE un JSON valido con: objetivo, planBreve, tags.',
    'objetivo: una frase corta y accionable para campo objetivo.',
    'planBreve: 2-4 frases maximo con estructura sugerida (activacion, gesto, aplicacion).',
    'tags: entre 2 y 5 etiquetas cortas.',
    'No uses markdown ni texto fuera del JSON.',
  ].join(' ')

  const userPrompt = `Contexto de sesion:\n${JSON.stringify(contexto, null, 2)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)

  try {
    const respuesta = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sugerencia_sesion_timeout',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                objetivo: { type: 'string' },
                planBreve: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 2,
                  maxItems: 5,
                },
              },
              required: ['objetivo', 'planBreve', 'tags'],
            },
          },
        },
      }),
    })

    if (!respuesta.ok) {
      const detalle = await respuesta.text()
      return res.status(502).json({ error: 'Error al consultar IA externa.', detail: detalle.slice(0, 300) })
    }

    const payload = await respuesta.json()
    const contenido = payload?.choices?.[0]?.message?.content
    const parsed = extraerJsonDeTexto(typeof contenido === 'string' ? contenido : '')

    if (!parsed || typeof parsed.objetivo !== 'string') {
      return res.status(502).json({ error: 'La IA no devolvio un formato valido.' })
    }

    const objetivo = parsed.objetivo.trim()
    const planBreve = typeof parsed.planBreve === 'string' ? parsed.planBreve.trim() : ''
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
      : []

    if (!objetivo) {
      return res.status(502).json({ error: 'La IA no devolvio objetivo util.' })
    }

    return res.json({ objetivo, planBreve, tags })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo generar sugerencia IA.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  } finally {
    clearTimeout(timeout)
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Timeout escuchando en http://0.0.0.0:${PORT}`)
})

process.on('SIGINT', async () => {
  if (mongoConectado) {
    await mongoClient.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (mongoConectado) {
    await mongoClient.close()
  }
  process.exit(0)
})
