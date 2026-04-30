import { createServer } from 'http'
import { getPayload, processData } from '../shared/payload.js'

const PORT = process.env.PORT || 3000

const server = createServer((req, res) => {
  const { method, url } = req

  if (method === 'GET' && url === '/payload') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(getPayload())
    return
  }

  if (method === 'POST' && url === '/process') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const result = processData(data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid json' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, () => {
  console.log(`Node http server running on port ${PORT}`)
})
