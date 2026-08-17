// src/runtime.js
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
var DEFAULT_CONFIG = {
  pollIntervalMs: 5e3,
  balanceRefreshMs: 6e4,
  balanceTimeoutMs: 1e4,
  prices: {
    "deepseek-chat": { inputMiss: 0.28, inputHit: 0.028, output: 0.42 },
    "deepseek-reasoner": { inputMiss: 0.55, inputHit: 0.14, output: 2.19 }
  }
};
var clampInt = (value, lo, hi, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};
var sanitizeConfig = (raw) => {
  const src = raw && typeof raw === "object" ? raw : {};
  const prices = {};
  const rawPrices = src.prices && typeof src.prices === "object" ? src.prices : {};
  for (const key of Object.keys(rawPrices)) {
    const p = rawPrices[key];
    if (!p || typeof p !== "object") continue;
    prices[key] = {
      inputMiss: Math.max(0, Number(p.inputMiss) || 0),
      inputHit: Math.max(0, Number(p.inputHit) || 0),
      output: Math.max(0, Number(p.output) || 0)
    };
  }
  for (const key of Object.keys(DEFAULT_CONFIG.prices)) {
    if (!prices[key]) prices[key] = { ...DEFAULT_CONFIG.prices[key] };
  }
  return {
    pollIntervalMs: clampInt(src.pollIntervalMs, 1e3, 6e4, DEFAULT_CONFIG.pollIntervalMs),
    balanceRefreshMs: clampInt(src.balanceRefreshMs, 5e3, 36e5, DEFAULT_CONFIG.balanceRefreshMs),
    balanceTimeoutMs: clampInt(src.balanceTimeoutMs, 3e3, 6e4, DEFAULT_CONFIG.balanceTimeoutMs),
    prices
  };
};
var todayKey = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
var emptyDay = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 });
var UsageDashboardRuntime = class extends TypertRemoteService {
  constructor(ctx) {
    super(ctx, "usageDashboard");
    this.ctx = ctx;
    this.state = {
      config: sanitizeConfig(DEFAULT_CONFIG),
      day: todayKey(),
      tokens: emptyDay(),
      costUsd: 0,
      history: {}
    };
    this.stateTarget = void 0;
    this.statePolicy = void 0;
    this.saveHandle = null;
    this.balance = null;
    this.balanceError = null;
    this.balanceAt = 0;
    this.balanceBusy = false;
    this.running = /* @__PURE__ */ new Set();
    this.stateReady = this.#loadState();
  }
  async #loadState() {
    const fs = this.ctx.get("fs");
    const sp = this.ctx.get("sandboxPolicy");
    if (fs === void 0 || sp === void 0) return;
    try {
      this.statePolicy = sp.resolve({ mode: "workspace-write" });
    } catch {
      try {
        this.statePolicy = sp.resolve();
      } catch {
        this.statePolicy = void 0;
      }
    }
    try {
      this.stateTarget = await fs.resolve(sp.workspaceRoot + "/.dsh-usage-dashboard.json");
    } catch {
      this.stateTarget = void 0;
    }
    if (this.stateTarget === void 0) return;
    try {
      const text = await fs.readText(this.stateTarget);
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        this.state.config = sanitizeConfig(parsed.config);
        const loadedDay = typeof parsed.day === "string" ? parsed.day : todayKey();
        const hist = parsed.history && typeof parsed.history === "object" ? parsed.history : {};
        if (loadedDay === todayKey()) {
          this.state.day = loadedDay;
          this.state.tokens = Object.assign(emptyDay(), parsed.tokens || {});
          this.state.costUsd = Number(parsed.costUsd) || 0;
          this.state.history = hist;
        } else {
          hist[loadedDay] = { tokens: Object.assign(emptyDay(), parsed.tokens || {}), costUsd: Number(parsed.costUsd) || 0 };
          const keys = Object.keys(hist);
          while (keys.length > 60) delete hist[keys.shift()];
          this.state.day = todayKey();
          this.state.tokens = emptyDay();
          this.state.costUsd = 0;
          this.state.history = hist;
        }
        console.log(`[usage-dashboard] state loaded for day ${this.state.day}`);
      }
    } catch {
      console.log("[usage-dashboard] no prior state, starting fresh");
    }
  }
  async #saveState() {
    if (this.stateTarget === void 0) return;
    const fs = this.ctx.get("fs");
    if (fs === void 0) return;
    try {
      await fs.writeText(this.stateTarget, JSON.stringify(this.state, null, 2), void 0, void 0, this.statePolicy);
    } catch {
      console.log("[usage-dashboard] state save failed");
    }
  }
  #scheduleSave() {
    if (this.saveHandle !== null) return;
    this.saveHandle = this.ctx.timeout(() => {
      this.saveHandle = null;
      void this.#saveState();
    }, 3e3);
  }
  /** Flush any pending save (called on plugin teardown). */
  flushSave() {
    if (this.saveHandle !== null) {
      this.saveHandle();
      this.saveHandle = null;
    }
    void this.#saveState();
  }
  #rotateDay() {
    const k = todayKey();
    if (k === this.state.day) return;
    if (this.state.tokens.total > 0 || this.state.costUsd > 0) {
      this.state.history[this.state.day] = { tokens: { ...this.state.tokens }, costUsd: this.state.costUsd };
      const keys = Object.keys(this.state.history);
      while (keys.length > 60) delete this.state.history[keys.shift()];
    }
    this.state.day = k;
    this.state.tokens = emptyDay();
    this.state.costUsd = 0;
    this.#scheduleSave();
  }
  /** Called from the llm/stream listener for every `usage` chunk. */
  addUsage(model, usage) {
    this.#rotateDay();
    const input = Number(usage.inputTokens) || 0;
    const output = Number(usage.outputTokens) || 0;
    const cacheRead = Number(usage.cacheReadTokens) || 0;
    const cacheWrite = Number(usage.cacheWriteTokens) || 0;
    const t = this.state.tokens;
    t.input += input;
    t.output += output;
    t.cacheRead += cacheRead;
    t.cacheWrite += cacheWrite;
    t.total += input + output + cacheRead + cacheWrite;
    const p = this.state.config.prices[String(model)] || this.state.config.prices["deepseek-chat"];
    this.state.costUsd += (input + cacheWrite) / 1e6 * p.inputMiss + cacheRead / 1e6 * p.inputHit + output / 1e6 * p.output;
    this.#scheduleSave();
  }
  /** Recompute the running-agent set from the live registry. */
  refreshRunning() {
    const agents = this.ctx.get("agents");
    if (agents === void 0) return;
    let list;
    try {
      list = agents.list();
    } catch {
      return;
    }
    const next = /* @__PURE__ */ new Set();
    for (const agent of list) {
      if (agent && agent.status === "running" && agent.id !== void 0) next.add(String(agent.id));
    }
    for (const id of Array.from(this.running)) if (!next.has(id)) this.running.delete(id);
    for (const id of next) this.running.add(id);
  }
  async #refreshBalance() {
    const credentials = this.ctx.get("credentials");
    const shell = this.ctx.get("shell");
    const sp = this.ctx.get("sandboxPolicy");
    if (credentials === void 0) {
      this.balanceError = "credentials \u670D\u52A1\u4E0D\u53EF\u7528";
      return;
    }
    if (shell === void 0) {
      this.balanceError = "shell \u670D\u52A1\u4E0D\u53EF\u7528";
      return;
    }
    let key;
    try {
      const resolved = await credentials.resolve("DEEPSEEK_API_KEY");
      key = resolved ? resolved.value : void 0;
    } catch {
      key = void 0;
    }
    if (!key) {
      this.balanceError = "DEEPSEEK_API_KEY \u672A\u914D\u7F6E";
      return;
    }
    const timeout = Math.max(3e3, this.state.config.balanceTimeoutMs || 1e4);
    const cmd = [
      "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12",
      '$h = @{ Authorization = "Bearer $env:DASH_KEY" }',
      "try {",
      '  $r = Invoke-RestMethod -Uri "https://api.deepseek.com/user/balance" -Method Get -Headers $h -TimeoutSec $env:DASH_TIMEOUT',
      "  if ($r.balance_infos -and $r.balance_infos.Count -gt 0) {",
      "    [pscustomobject]@{ ok = $true; total = $r.balance_infos[0].total_balance; currency = $r.balance_infos[0].currency; available = $r.is_available } | ConvertTo-Json -Compress",
      "  } else {",
      '    [pscustomobject]@{ ok = $false; error = "no balance_infos" } | ConvertTo-Json -Compress',
      "  }",
      "} catch {",
      "  [pscustomobject]@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress",
      "}"
    ].join("\n");
    try {
      let policy;
      try {
        policy = sp ? sp.resolve({ mode: "workspace-write" }) : void 0;
      } catch {
        policy = void 0;
      }
      const spec = shell.resolve({
        command: cmd,
        env: { DASH_KEY: key, DASH_TIMEOUT: String(timeout) },
        timeoutMs: timeout + 5e3,
        stdoutMaxBytes: 4096,
        ...policy ? { sandboxPolicy: policy } : {}
      });
      const result = await shell.run(spec);
      const text = result && result.stdout && typeof result.stdout.text === "string" ? result.stdout.text.trim() : "";
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && parsed.ok === true) {
        this.balance = {
          total: Number(parsed.total) || 0,
          currency: String(parsed.currency || "CNY"),
          available: parsed.available !== false
        };
        this.balanceError = null;
        this.balanceAt = Date.now();
      } else {
        this.balanceError = parsed && parsed.error ? String(parsed.error) : "\u4F59\u989D\u54CD\u5E94\u65E0\u6548";
      }
    } catch (e) {
      this.balanceError = String(e && e.message ? e.message : e);
    }
  }
  // ---- Remote RPC surface (dispatched by the typert gateway) ----
  async snapshot() {
    await this.stateReady;
    this.#rotateDay();
    this.refreshRunning();
    const now = Date.now();
    if (now - this.balanceAt > this.state.config.balanceRefreshMs && !this.balanceBusy) {
      this.balanceBusy = true;
      void this.#refreshBalance().finally(() => {
        this.balanceBusy = false;
      });
    }
    return {
      ok: true,
      balance: this.balance,
      balanceError: this.balanceError,
      running: this.running.size,
      day: this.state.day,
      tokens: { ...this.state.tokens },
      costUsd: Math.round(this.state.costUsd * 1e6) / 1e6,
      updatedAt: now
    };
  }
  async configGet() {
    await this.stateReady;
    return { ok: true, config: JSON.parse(JSON.stringify(this.state.config)) };
  }
  async configSet(config) {
    await this.stateReady;
    this.state.config = sanitizeConfig(config);
    await this.#saveState();
    return { ok: true, config: JSON.parse(JSON.stringify(this.state.config)) };
  }
  async resetToday() {
    await this.stateReady;
    this.state.tokens = emptyDay();
    this.state.costUsd = 0;
    await this.#saveState();
    return { ok: true };
  }
};

// src/typert.js
var INVOCATIONS = [
  {
    id: "dsh-usage-dashboard#usageDashboard/snapshot",
    service: "usageDashboard",
    namespace: "usageDashboard",
    method: "snapshot",
    invocation: { kind: "direct" },
    parameters: [],
    result: { mode: "src-json" }
  },
  {
    id: "dsh-usage-dashboard#usageDashboard/configGet",
    service: "usageDashboard",
    namespace: "usageDashboard",
    method: "configGet",
    invocation: { kind: "direct" },
    parameters: [],
    result: { mode: "src-json" }
  },
  {
    id: "dsh-usage-dashboard#usageDashboard/configSet",
    service: "usageDashboard",
    namespace: "usageDashboard",
    method: "configSet",
    invocation: { kind: "direct" },
    parameters: [
      { name: "config", wire: "config", source: "json", codec: { mode: "src-json" } }
    ],
    result: { mode: "src-json" }
  },
  {
    id: "dsh-usage-dashboard#usageDashboard/resetToday",
    service: "usageDashboard",
    namespace: "usageDashboard",
    method: "resetToday",
    invocation: { kind: "direct" },
    parameters: [],
    result: { mode: "src-json" }
  }
];
var TYPERT_MANIFEST = {
  package: "dsh-usage-dashboard",
  face: "host",
  schemas: [],
  model: {
    services: [
      {
        key: "usageDashboard",
        exportName: "UsageDashboardRuntime",
        description: "Sidebar dashboard data: account balance, parallel tasks, per-day tokens and estimated cost.",
        tags: [],
        members: [
          { kind: "method", name: "snapshot", signature: "snapshot(): Promise<object>" },
          { kind: "method", name: "configGet", signature: "configGet(): Promise<object>" },
          { kind: "method", name: "configSet", signature: "configSet(config: object): Promise<object>" },
          { kind: "method", name: "resetToday", signature: "resetToday(): Promise<object>" }
        ],
        types: []
      }
    ],
    events: [],
    objects: []
  },
  invocations: INVOCATIONS
};

// src/index.js
var name = "dsh-usage-dashboard";
var inject = ["typert", "timer"];
function apply(ctx) {
  const runtime = new UsageDashboardRuntime(ctx);
  ctx.effect(() => {
    const dispose = ctx.typert.register(TYPERT_MANIFEST);
    return () => {
      void dispose();
    };
  }, "usage-dashboard: typert manifest");
  ctx.on("llm/stream", (options, next) => {
    const stream = next();
    const model = options && typeof options.model === "string" ? options.model : "unknown";
    return (async function* () {
      for await (const chunk of stream) {
        if (chunk && chunk.type === "usage" && chunk.usage) {
          try {
            runtime.addUsage(model, chunk.usage);
          } catch {
          }
        }
        yield chunk;
      }
    })();
  });
  ctx.effect(() => {
    runtime.refreshRunning();
    return ctx.interval(() => runtime.refreshRunning(), 3e3);
  }, "usage-dashboard: running poll");
  ctx.effect(() => () => {
    runtime.flushSave();
  }, "usage-dashboard: save flush");
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
