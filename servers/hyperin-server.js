import hyperin from 'hyperin'
import { compress, json } from 'hyperin/middleware'
import { processData, getPayload } from '../shared/payload.js'
import os from 'os'

const app = hyperin()

app.use(json())
app.use(compress())

app.post('/process', ({ request }) => {
  return processData(request.body)
})

app.get('/payload', () => {
  return getPayload()
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Hyperin server running on port ${PORT}`)
})
