import ultimate from 'ultimate-express'
import { processData, getPayload } from '../shared/payload.js'

const app = ultimate()

app.use(ultimate.json())

app.post('/process', (req, res) => {
  res.json(processData(req.body))
})

app.get('/payload', (req, res) => {
  res.json(getPayload())
})

const PORT = process.env.PORT || 3003
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Ultimate Express server running on port ${PORT}`)
})
