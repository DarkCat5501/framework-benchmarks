import Fastify from 'fastify'
import { getPayload, processData } from '../shared/payload.js'

const app = Fastify({ logger: false })

app.get('/payload', async (request, reply) => {
  return getPayload()
})

app.post('/process', async (request, reply) => {
  return processData(request.body)
})

const PORT = process.env.PORT || 3000
app.listen({ port: PORT, host: '0.0.0.0' }, () => {
  console.log(`Fastify server running on port ${PORT}`)
})