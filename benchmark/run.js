import { spawn, exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import autocannon from 'autocannon'
import http from 'http'
import { getPayload, getPayloadSizes, processData } from '../shared/payload.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SERVERS = {
  hyperin: { port: 3000, script: join(__dirname, '..', 'servers', 'hyperin-server.js'), runtime: 'node' },
  koa: { port: 3001, script: join(__dirname, '..', 'servers', 'koa-server.js'), runtime: 'node' },
  elysia: { port: 3002, script: join(__dirname, '..', 'servers', 'elysia-server.js'), runtime: 'bun' },
  ultimate: { port: 3003, script: join(__dirname, '..', 'servers', 'ultimate-server.js'), runtime: 'node' }
}

const config = { duration: 10, connections: 100, pipelining: 1 }

let serverChild = null

function startServer(type) {
  return new Promise((resolve, reject) => {
    const server = SERVERS[type]
    serverChild = spawn(server.runtime, [server.script], {
      env: { ...process.env, PORT: server.port },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    let ready = false
    serverChild.stdout.on('data', (data) => {
      if (data.toString().includes('running on port') && !ready) {
        ready = true
        setTimeout(() => resolve(serverChild), 500)
      }
    })
    serverChild.stderr.on('data', d => console.error(`[${type}] ${d}`))
    setTimeout(() => { if (!ready) reject(new Error('timeout')) }, 10000)
  })
}

function stopServer() {
  if (serverChild) { serverChild.kill('SIGTERM'); serverChild = null }
}

function getServerStats(pid) {
  return new Promise((resolve) => {
    exec(`ps -p ${pid} -o %cpu,%mem --no-headers`, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve(null)
        return
      }
      const [cpu, mem] = stdout.trim().split(/\s+/)
      resolve({ cpu: parseFloat(cpu) || 0, mem: parseFloat(mem) || 0 })
    })
  })
}

function request(port, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port, path, method, headers: { 'Content-Type': 'application/json' } }
    const req = http.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function sampleServerStats(pid, duration) {
  const samples = []
  const interval = 500
  const iterations = Math.floor((duration * 1000) / interval)
  
  for (let i = 0; i < iterations; i++) {
    const stats = await getServerStats(pid)
    if (stats) samples.push(stats)
    await new Promise(r => setTimeout(r, interval))
  }
  
  const cpuAvg = samples.length > 0 ? samples.reduce((a, s) => a + s.cpu, 0) / samples.length : 0
  const memAvg = samples.length > 0 ? samples.reduce((a, s) => a + s.mem, 0) / samples.length : 0
  
  return { cpu: Math.round(cpuAvg * 100) / 100, mem: Math.round(memAvg * 100) / 100 }
}

async function runBenchmark(type, payloadSize) {
  const port = SERVERS[type].port
  const payload = getPayload(payloadSize)
  const payloadBytes = Buffer.byteLength(payload, 'utf8')
  
  console.log(`\n=== ${type.toUpperCase()} [${payloadSize}] ===`)
  await startServer(type)
  console.log(`Payload: ${payloadBytes} bytes`)
  console.log('Load test...')
  
  const pid = serverChild.pid
  const [autocannonResult, serverStats] = await Promise.all([
    autocannon({
      url: `http://localhost:${port}/process`,
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      ...config
    }),
    sampleServerStats(pid, config.duration)
  ])
  
  const result = autocannonResult
  stopServer()
  
  const processed = processData(JSON.parse(payload))
  const outputBytes = Buffer.byteLength(JSON.stringify(processed), 'utf8')
  
  return {
    framework: type,
    payloadSize: payloadBytes,
    outputSize: outputBytes,
    reqPerSec: Math.round(result.requests.average),
    latencyP50: Math.round(result.latency.p50),
    latencyP99: Math.round(result.latency.p99),
    memory: { rss: serverStats.mem },
    cpuLoad: serverStats.cpu,
    errors: result.errors
  }
}

async function main() {
  const args = process.argv.slice(2)
  const target = args[0]
  const sizes = ['small', 'medium', 'large', 'x-large']
  
  console.log('='.repeat(60))
  console.log('BENCHMARK: Hyperin vs Koa vs Elysia vs Ultimate - Multiple Payload Sizes')
  console.log('='.repeat(60))
  
  const results = {}
  
  for (const size of sizes) {
    results[size] = {}
    
    for (const framework of ['hyperin', 'koa', 'elysia', 'ultimate']) {
      if (target && target !== framework) continue
      
      console.log(`\n--- ${framework.toUpperCase()} - ${size} ---`)
      const stats = await runBenchmark(framework, size)
      results[size][framework] = stats
      
      console.log(`  Req/sec: ${stats.reqPerSec}`)
      console.log(`  P50: ${stats.latencyP50}ms | P99: ${stats.latencyP99}ms`)
      console.log(`  CPU: ${stats.cpuLoad}% | MEM: ${stats.memory.rss}%`)
      console.log(`  Output: ${stats.outputSize} bytes`)
      
      if (Object.keys(results[size]).length < 2) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  
  console.log('\n| Payload Size | Framework | Req/sec | P50   | P99  | CPU    | MEM    |')
  console.log('|--------------|-----------|---------|-------|------|--------|--------|')
  
  for (const size of sizes) {
    for (const fw of ['hyperin', 'koa', 'elysia', 'ultimate']) {
      if (results[size][fw]) {
        const r = results[size][fw]
        console.log(`| ${size.padStart(12)} | ${fw.padStart(9)} | ${r.reqPerSec.toString().padStart(7)} | ${r.latencyP50.toString().padStart(5)} | ${r.latencyP99.toString().padStart(4)} | ${r.cpuLoad.toString().padStart(6)}% | ${r.memory.rss.toString().padStart(6)}% |`)
      }
    }
  }
  
  console.log('\n| Payload Sizes:')
  const sizesInfo = getPayloadSizes()
  for (const [k, v] of Object.entries(sizesInfo)) {
    console.log(`|   ${k}: ${v} bytes`)
  }
  
  process.exit(0)
}

main().catch(err => { console.error(err); stopServer(); process.exit(1) })