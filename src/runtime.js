/**
 * Usage Dashboard runtime: per-day token/cost state with durable persistence,
 * the DeepSeek balance probe, the parallel-task count, and the HTTP API
 * surface consumed by the browser card.
 * @module dsh-usage-dashboard/src/runtime
 */

/** Default configuration. Prices are USD per 1M tokens; the cost is an estimate. */
const DEFAULT_CONFIG = {
  pollIntervalMs: 5000,
  balanceRefreshMs: 60000,
  balanceTimeoutMs: 10000,
  prices: {
    'deepseek-chat': { inputMiss: 0.28, inputHit: 0.028, output: 0.42 },
    'deepseek-reasoner': { inputMiss: 0.55, inputHit: 0.14, output: 2.19 },
  },
}

const clampInt = (value, lo, hi, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback
}

const sanitizeConfig = (raw) => {
  const src = raw && typeof raw === 'object' ? raw : {}
  const prices = {}
  const rawPrices = src.prices && typeof src.prices === 'object' ? src.prices : {}
  for (const key of Object.keys(rawPrices)) {
    const p = rawPrices[key]
    if (!p || typeof p !== 'object') continue
    prices[key] = {
      inputMiss: Math.max(0, Number(p.inputMiss) || 0),
      inputHit: Math.max(0, Number(p.inputHit) || 0),
      output: Math.max(0, Number(p.output) || 0),
    }
  }
  for (const key of Object.keys(DEFAULT_CONFIG.prices)) {
    if (!prices[key]) prices[key] = { ...DEFAULT_CONFIG.prices[key] }
  }
  return {
    pollIntervalMs: clampInt(src.pollIntervalMs, 1000, 60000, DEFAULT_CONFIG.pollIntervalMs),
    balanceRefreshMs: clampInt(src.balanceRefreshMs, 5000, 3600000, DEFAULT_CONFIG.balanceRefreshMs),
    balanceTimeoutMs: clampInt(src.balanceTimeoutMs, 3000, 60000, DEFAULT_CONFIG.balanceTimeoutMs),
    prices,
  }
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const emptyDay = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 })

export class UsageDashboardRuntime {
  constructor(ctx) {
    this.ctx = ctx
    this.state = {
      config: sanitizeConfig(DEFAULT_CONFIG),
      day: todayKey(),
      tokens: emptyDay(),
      costUsd: 0,
      history: {},
    }
    this.stateTarget = undefined
    this.statePolicy = undefined
    this.saveHandle = null
    this.balance = null
    this.balanceError = null
    this.balanceAt = 0
    this.balanceBusy = false
    this.running = new Set()
    this.stateReady = this.#loadState()
  }

  async #loadState() {
    const fs = this.ctx.get('fs')
    const sp = this.ctx.get('sandboxPolicy')
    if (fs === undefined || sp === undefined) return
    try {
      this.statePolicy = sp.resolve({ mode: 'workspace-write' })
    } catch {
      try { this.statePolicy = sp.resolve() } catch { this.statePolicy = undefined }
    }
    try {
      this.stateTarget = await fs.resolve(sp.workspaceRoot + '/.dsh-usage-dashboard.json')
    } catch {
      this.stateTarget = undefined
    }
    if (this.stateTarget === undefined) return
    try {
      const text = await fs.readText(this.stateTarget)
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') {
        this.state.config = sanitizeConfig(parsed.config)
        const loadedDay = typeof parsed.day === 'string' ? parsed.day : todayKey()
        const hist = parsed.history && typeof parsed.history === 'object' ? parsed.history : {}
        if (loadedDay === todayKey()) {
          this.state.day = loadedDay
          this.state.tokens = Object.assign(emptyDay(), parsed.tokens || {})
          this.state.costUsd = Number(parsed.costUsd) || 0
          this.state.history = hist
        } else {
          hist[loadedDay] = { tokens: Object.assign(emptyDay(), parsed.tokens || {}), costUsd: Number(parsed.costUsd) || 0 }
          const keys = Object.keys(hist)
          while (keys.length > 60) delete hist[keys.shift()]
          this.state.day = todayKey()
          this.state.tokens = emptyDay()
          this.state.costUsd = 0
          this.state.history = hist
        }
        console.log(`[usage-dashboard] state loaded for day ${this.state.day}`)
      }
    } catch {
      console.log('[usage-dashboard] no prior state, starting fresh')
    }
  }

  async #saveState() {
    if (this.stateTarget === undefined) return
    const fs = this.ctx.get('fs')
    if (fs === undefined) return
    try {
      await fs.writeText(this.stateTarget, JSON.stringify(this.state, null, 2), undefined, undefined, this.statePolicy)
    } catch {
      console.log('[usage-dashboard] state save failed')
    }
  }

  #scheduleSave() {
    if (this.saveHandle !== null) return
    this.saveHandle = this.ctx.timeout(() => {
      this.saveHandle = null
      void this.#saveState()
    }, 3000)
  }

  flushSave() {
    if (this.saveHandle !== null) {
      this.saveHandle()
      this.saveHandle = null
    }
    void this.#saveState()
  }

  #rotateDay() {
    const k = todayKey()
    if (k === this.state.day) return
    if (this.state.tokens.total > 0 || this.state.costUsd > 0) {
      this.state.history[this.state.day] = { tokens: { ...this.state.tokens }, costUsd: this.state.costUsd }
      const keys = Object.keys(this.state.history)
      while (keys.length > 60) delete this.state.history[keys.shift()]
    }
    this.state.day = k
    this.state.tokens = emptyDay()
    this.state.costUsd = 0
    this.#scheduleSave()
  }

  addUsage(model, usage) {
    this.#rotateDay()
    const input = Number(usage.inputTokens) || 0
    const output = Number(usage.outputTokens) || 0
    const cacheRead = Number(usage.cacheReadTokens) || 0
    const cacheWrite = Number(usage.cacheWriteTokens) || 0
    const t = this.state.tokens
    t.input += input
    t.output += output
    t.cacheRead += cacheRead
    t.cacheWrite += cacheWrite
    t.total += input + output + cacheRead + cacheWrite
    const p = this.state.config.prices[String(model)] || this.state.config.prices['deepseek-chat']
    this.state.costUsd += (input + cacheWrite) / 1e6 * p.inputMiss + cacheRead / 1e6 * p.inputHit + output / 1e6 * p.output
    this.#scheduleSave()
  }

  refreshRunning() {
    const agents = this.ctx.get('agents')
    if (agents === undefined) return
    let list
    try { list = agents.list() } catch { return }
    const next = new Set()
    for (const agent of list) {
      if (agent && agent.status === 'running' && agent.id !== undefined) next.add(String(agent.id))
    }
    for (const id of Array.from(this.running)) if (!next.has(id)) this.running.delete(id)
    for (const id of next) this.running.add(id)
  }

  async #refreshBalance() {
    const credentials = this.ctx.get('credentials')
    const shell = this.ctx.get('shell')
    const sp = this.ctx.get('sandboxPolicy')
    if (credentials === undefined) { this.balanceError = 'credentials 服务不可用'; return }
    if (shell === undefined) { this.balanceError = 'shell 服务不可用'; return }
    let key
    try {
      const resolved = await credentials.resolve('DEEPSEEK_API_KEY')
      key = resolved ? resolved.value : undefined
    } catch {
      key = undefined
    }
    if (!key) { this.balanceError = 'DEEPSEEK_API_KEY 未配置'; return }
    const timeout = Math.max(3000, this.state.config.balanceTimeoutMs || 10000)
    const cmd = [
      '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
      '$h = @{ Authorization = "Bearer $env:DASH_KEY" }',
      'try {',
      '  $r = Invoke-RestMethod -Uri "https://api.deepseek.com/user/balance" -Method Get -Headers $h -TimeoutSec $env:DASH_TIMEOUT',
      '  if ($r.balance_infos -and $r.balance_infos.Count -gt 0) {',
      '    [pscustomobject]@{ ok = $true; total = $r.balance_infos[0].total_balance; currency = $r.balance_infos[0].currency; available = $r.is_available } | ConvertTo-Json -Compress',
      '  } else {',
      '    [pscustomobject]@{ ok = $false; error = "no balance_infos" } | ConvertTo-Json -Compress',
      '  }',
      '} catch {',
      '  [pscustomobject]@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress',
      '}',
    ].join('\n')
    try {
      let policy
      try { policy = sp ? sp.resolve({ mode: 'workspace-write' }) : undefined } catch { policy = undefined }
      const spec = shell.resolve({
        command: cmd,
        env: { DASH_KEY: key, DASH_TIMEOUT: String(timeout) },
        timeoutMs: timeout + 5000,
        stdoutMaxBytes: 4096,
        ...(policy ? { sandboxPolicy: policy } : {}),
      })
      const result = await shell.run(spec)
      const text = result && result.stdout && typeof result.stdout.text === 'string' ? result.stdout.text.trim() : ''
      const parsed = text ? JSON.parse(text) : null
      if (parsed && parsed.ok === true) {
        this.balance = {
          total: Number(parsed.total) || 0,
          currency: String(parsed.currency || 'CNY'),
          available: parsed.available !== false,
        }
        this.balanceError = null
        this.balanceAt = Date.now()
      } else {
        this.balanceError = parsed && parsed.error ? String(parsed.error) : '余额响应无效'
      }
    } catch (e) {
      this.balanceError = String(e && e.message ? e.message : e)
    }
  }

  async handleSnapshot() {
    await this.stateReady
    this.#rotateDay()
    this.refreshRunning()
    const now = Date.now()
    if (now - this.balanceAt > this.state.config.balanceRefreshMs && !this.balanceBusy) {
      this.balanceBusy = true
      void this.#refreshBalance().finally(() => { this.balanceBusy = false })
    }
    return {
      ok: true,
      balance: this.balance,
      balanceError: this.balanceError,
      running: this.running.size,
      day: this.state.day,
      tokens: { ...this.state.tokens },
      costUsd: Math.round(this.state.costUsd * 1e6) / 1e6,
      updatedAt: now,
    }
  }

  async handleConfigGet() {
    await this.stateReady
    return { ok: true, config: JSON.parse(JSON.stringify(this.state.config)) }
  }

  async handleConfigSet(config) {
    await this.stateReady
    this.state.config = sanitizeConfig(config)
    await this.#saveState()
    return { ok: true, config: JSON.parse(JSON.stringify(this.state.config)) }
  }

  async handleResetToday() {
    await this.stateReady
    this.state.tokens = emptyDay()
    this.state.costUsd = 0
    await this.#saveState()
    return { ok: true }
  }
}
