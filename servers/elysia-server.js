import { Elysia } from 'elysia'
import { processData, getPayload } from '../shared/payload.js'

const app = new Elysia()
  .post('/process', ({ body }) => processData(body))
  .get('/payload', () => getPayload())
  .listen(process.env.PORT || 3002, () => {
    console.log(`Elysia server running on port ${process.env.PORT || 3002}`)
  })