import hyperin from 'hyperin'
import { compress, json } from 'hyperin/middleware'
import { processData, getPayload } from '../shared/payload.js'

const app = hyperin()

app.use(json({ limit: "1mb" }))
// app.use(compress())

app.post('/process', ({ request }) => {
  return processData(request.body)
})

app.get('/payload', () => {
  return getPayload()
})

const PORT = process.env.PORT || 3000

const server = Bun.serve({
  fetch: app.fetch,
  port: PORT 
})

console.log(`running on port ${server.port}`);
