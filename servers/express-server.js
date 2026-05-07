import express from 'express'
import { processData, getPayload } from '../shared/payload.js'
// import { setTimeout } from "node:timers/promises"

const app = express()

app.use(express.json())

app.post('/process', async (req, res) => {
  res.json(processData(req.body))
})

app.get('/payload', (req, res) => {
  res.json(getPayload())
})

const PORT = process.env.PORT || 3003

const server = app.listen(PORT,"0.0.0.0", () => {
  console.log(`Ultimate Express server running on port ${PORT}`)
})

const tgz = new EventTarget();

const sk_list = new Set();
server.on("connection", (socket) => {
  sk_list.add(socket);

  socket.on("close", () => {
    sk_list.delete(socket);
    if(sk_list.size == 0) {
      tgz.dispatchEvent(new CustomEvent("connections:closed"))
    }
  })
})

tgz.addEventListener("connections:closed", () => {
  console.log("Uui, to livre pai!")
})

process.on("SIGINT", async () => {
  server.close();
  
  console.log("Ain papi! fechei")
  process.exit(1);
})

process.on("SIGABRT", async () => {
  server.closeAllConnections();
  server.close();
  process.exit(1)
})
