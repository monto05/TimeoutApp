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
const distPath =
  distCandidates.find((candidate) => existsSync(path.join(candidate, 'index.html'))) ?? path.resolve('./frontend/dist')
const indexPath = path.join(distPath, 'index.html')

console.log('=== SERVER DEBUG ===')
console.log('cwd:', process.cwd())
console.log('distCandidates:', distCandidates)
console.log('distPath:', distPath)
console.log('indexPath:', indexPath)
console.log('indexExists:', existsSync(indexPath))
console.log('==================')

app.use(express.static(distPath))

app.get('*', (_req, res) => {
  res.sendFile(indexPath)
})

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`)
})
