import express from 'express'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 8080
const distPath = path.resolve('./dist')

console.log('=== SERVER DEBUG ===')
console.log('distPath:', distPath)
console.log('==================')

app.use(express.static(distPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`)
})
