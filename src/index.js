/**
 * dsh-usage-dashboard host half: registers the `usageDashboard` Remote
 * service, the typert manifest, the llm/stream usage counter, and the
 * parallel-task poll.
 * @module dsh-usage-dashboard
 */

import { UsageDashboardRuntime } from './runtime.js'
import { TYPERT_MANIFEST } from './typert.js'

export const name = 'dsh-usage-dashboard'
export const inject = ['typert', 'timer']

export function apply(ctx) {
  const runtime = new UsageDashboardRuntime(ctx)

  ctx.effect(() => {
    const dispose = ctx.typert.register(TYPERT_MANIFEST)
    return () => { void dispose() }
  }, 'usage-dashboard: typert manifest')

  // Count every streaming model call's usage in real time without breaking
  // the stream. Covers all sessions, subagents and workflows.
  ctx.on('llm/stream', (options, next) => {
    const stream = next()
    const model = options && typeof options.model === 'string' ? options.model : 'unknown'
    return (async function* () {
      for await (const chunk of stream) {
        if (chunk && chunk.type === 'usage' && chunk.usage) {
          try { runtime.addUsage(model, chunk.usage) } catch { /* counting must never break the model stream */ }
        }
        yield chunk
      }
    })()
  })

  // Parallel-task count: live agents in 'running' status, polled.
  ctx.effect(() => {
    runtime.refreshRunning()
    return ctx.interval(() => runtime.refreshRunning(), 3000)
  }, 'usage-dashboard: running poll')

  // Flush pending state saves on teardown.
  ctx.effect(() => () => { runtime.flushSave() }, 'usage-dashboard: save flush')
}
