import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { processData, getPayload } from '../shared/payload.js'

const app = new Koa()
const router = new Router()

router.post('/process', async (ctx) => {
  ctx.body = processData(ctx.request.body)
})

router.get('/payload', (ctx) => {
  ctx.body = getPayload()
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Koa server running on port ${PORT}`)
})
