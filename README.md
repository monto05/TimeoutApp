# Timeout Coaches

Aplicación separada en `frontend` (React + Vite + TypeScript + Tailwind CSS) y `backend` (Express + MongoDB).

## Requisitos

- Node.js 18+
- npm 9+

## Base de datos (MongoDB)

1. Copia las variables de entorno en `backend`:

```bash
copy backend\.env.example backend\.env
```

2. Configura `MONGODB_URL` y `MONGODB_DB_NAME` en `backend/.env`.

3. Instala dependencias (workspace raíz + frontend + backend):

```bash
npm install
```

## Estructura

- `frontend/`: aplicación React
- `backend/`: API Express, Prisma y utilidades

## Ejecutar en local

Opción rápida (frontend + backend en una sola terminal):

```bash
npm run dev:all
```

1. Arranca la API (terminal 1):

```bash
npm run api:dev
```

2. Arranca el frontend (terminal 2):

```bash
npm run dev
```

La app sincroniza automáticamente su estado con MongoDB por `PUT /api/state` y carga inicial por `GET /api/state`.

## Player Development System

El frontend incluye ahora un módulo adicional de seguimiento del jugador pensado para staff, jugador y familia:

- Objetivos con tracking real por progreso y estado.
- Historial de sesiones y feedback consolidado.
- Evaluaciones periódicas por área.
- Vídeo-feedback con enlace compartido, comentario familiar y corrección técnica.
- Canal simple de comunicación entre familia y responsables.
- Informes automáticos generados desde la propia app con el resumen actual del jugador.

## Build de producción

```bash
npm run build
npm run preview
```

## IA local con Ollama (gratis)

Puedes probar sugerencias de objetivo sin API externa usando Ollama local.

1. Instala Ollama en tu servidor/local: https://ollama.com/download
2. Descarga un modelo (ejemplo recomendado):

```bash
ollama pull llama3.1:8b
```

3. En `backend/.env` configura opcionalmente:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
```

4. Arranca backend y frontend con `npm run dev:all`.
5. En Calendario > Programar sesión usa el botón "Probar IA local (Ollama)".

Endpoint backend usado: `POST /api/ai/sugerir-objetivo-local`.

## Scripts útiles por workspace

- Frontend directo: `npm run dev -w frontend`
- Backend directo: `npm run dev -w backend`
- Frontend + backend: `npm run dev:all`
- Legacy Prisma (si lo usas para otras tablas): `npm run db:migrate -w backend`
