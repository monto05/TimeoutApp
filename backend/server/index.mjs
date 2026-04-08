import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EN_PRODUCCION = process.env.NODE_ENV === 'production'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:27017'
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'timeout_app'

const esArrayValido = (valor) => Array.isArray(valor)
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
        permisos: null,
        sedes: null,
        updatedAt: null,
      })
    }

    const { permisos, sedes } = extraerPermisosYSedes(snapshot.permisos)

    return res.json({
      jugadores: snapshot.jugadores,
      recursos: snapshot.recursos,
      entrenadores: snapshot.entrenadores,
      sesiones: snapshot.sesiones,
      permisos,
      sedes,
      updatedAt: snapshot.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo leer el estado en base de datos.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

app.put('/api/state', async (req, res) => {
  const { jugadores, recursos, entrenadores, sesiones, permisos, sedes } = req.body ?? {}

  if (
    !esArrayValido(jugadores) ||
    !esArrayValido(recursos) ||
    !esArrayValido(entrenadores) ||
    !esArrayValido(sesiones) ||
    !esArrayValido(permisos) ||
    !esArrayValido(sedes)
  ) {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  try {
    const snapshots = await obtenerColeccionSnapshots()
    const updatedAt = new Date()

    await snapshots.updateOne(
      { _id: 'default' },
      {
        $set: {
          jugadores,
          recursos,
          entrenadores,
          sesiones,
          permisos: {
            items: permisos,
            sedes,
          },
          updatedAt,
        },
        $setOnInsert: {
          createdAt: updatedAt,
        },
      },
      { upsert: true },
    )

    return res.json({ ok: true, updatedAt })
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo guardar el estado en base de datos.',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
})

// Servir el frontend compilado en producción (debe ir DESPUÉS de las rutas /api)
if (EN_PRODUCCION) {
  const distPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`API Timeout escuchando en http://localhost:${PORT}`)
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
