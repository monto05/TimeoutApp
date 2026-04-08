import express from 'express'
import path from 'path'
import { existsSync } from 'fs'

const app = express()
const PORT = process.env.PORT || 8080
const distCandidates = [
  path.resolve('./dist'),
  path.resolve('./frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
]
const distPath = distCandidates.find((candidate) => existsSync(candidate)) ?? path.resolve('./dist')

console.log('=== SERVER DEBUG ===')
console.log('cwd:', process.cwd())
console.log('distCandidates:', distCandidates)
console.log('distPath:', distPath)
console.log('==================')

app.use(express.static(distPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`)
})
