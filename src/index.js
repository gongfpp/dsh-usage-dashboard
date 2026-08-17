/**
 * dsh-usage-dashboard host half: registers a webServer JSON route at
 * /api/usage-dashboard for the browser card, the llm/stream usage counter,
 * and the parallel-task poll.
 * @module dsh-usage-dashboard
 */

import { UsageDashboardRuntime } from './runtime.js'

export const name = 'dsh-usage-dashboard'
export const inject = ['webServer', 'timer']

export function apply(ctx) {
  console.log('[usage-dashboard] host half mounting')

  const runtime = new UsageDashboardRuntime(ctx)

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: '/api/usage-dashboard',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const action = url.searchParams.get('action') || 'snapshot'
          let body
          if (req.method === 'POST') {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const text = Buffer.concat(chunks).toString('utf8')
            body = text ? JSON.parse(text) : {}
          }
          let result
          switch (action) {
            case 'snapshot':
              result = await runtime.handleSnapshot()
              break
            case 'config-get':
              result = await runtime.handleConfigGet()
              break
            case 'config-set':
              result = await runtime.handleConfigSet(body && body.config)
              break
            case 'reset-today':
              result = await runtime.handleResetToday()
              break
            default:
              result = { ok: false, error: 'unknown action' }
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' })
          res.end(JSON.stringify(result))
        } catch (e) {
          res.writeHead(500, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }))
        }
      },
    })
    return dispose
  }, 'usage-dashboard: api route')

  ctx.on('llm/stream', (options, next) => {
    const stream = next()
    const model = options && typeof options.model === 'string' ? options.model : 'unknown'
    return (async function* () {
      for await (const chunk of stream) {
        if (chunk && chunk.type === 'usage' && chunk.usage) {
          try { runtime.addUsage(model, chunk.usage) } catch { /* never break the model stream */ }
        }
        yield chunk
      }
    })()
  })

  ctx.effect(() => {
    runtime.refreshRunning()
    return ctx.interval(() => runtime.refreshRunning(), 3000)
  }, 'usage-dashboard: running poll')

  ctx.effect(() => () => { runtime.flushSave() }, 'usage-dashboard: save flush')
}
