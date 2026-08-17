/**
 * dsh-usage-dashboard browser half: renders the sidebar dashboard card and
 * the Settings page, polling the host `usageDashboard` Remote service.
 * @module dsh-usage-dashboard/src/client
 */

import React from 'react'
import { REMOTE_DESCRIPTOR } from '../typert.js'

export const inject = ['slots']

const STYLE_ID = 'dsh-usage-dashboard-style'
const cssText = [
  '.udash-card{display:block;box-sizing:border-box;width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
  '.udash-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}',
  '.udash-cell{min-width:0}',
  '.udash-label{font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
  '.udash-value{font-size:13px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary);display:flex;align-items:center}',
  '.udash-strong .udash-value{color:var(--dsw-alias-brand-primary)}',
  '.udash-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;flex:none}',
  '.udash-dot-idle{background:var(--dsw-alias-state-success-primary)}',
  '.udash-dot-busy{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 6px var(--dsw-alias-state-warn-primary);animation:udash-pulse 1.6s ease-in-out infinite}',
  '.udash-dot-none{background:var(--dsw-alias-label-tertiary)}',
  '@keyframes udash-pulse{0%,100%{opacity:1}50%{opacity:.4}}',
  '.udash-settings{display:flex;flex-direction:column;gap:10px;max-width:440px}',
  '.udash-note{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);margin:0}',
  '.udash-field{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}',
  '.udash-field-label{color:var(--dsw-alias-label-primary);flex:1}',
  '.udash-input{width:120px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
  '.udash-price-row{display:flex;flex-wrap:wrap;gap:8px 12px;padding:8px 0;border-top:1px solid var(--dsw-alias-border-l1)}',
  '.udash-price-title{width:100%;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
  '.udash-price-row .udash-field{font-size:12px}',
  '.udash-price-row .udash-input{width:96px}',
  '.udash-actions{display:flex;gap:8px}',
  '.udash-btn{padding:6px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer}',
  '.udash-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}',
  '.udash-msg{font-size:12px;color:var(--dsw-alias-state-success-primary);margin:0}',
].join('\n')

function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
}

/** The mounted `usageDashboard` Remote namespace (set once the mount settles). */
let api = undefined

const fmtTokens = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(Math.round(v))
}
const fmtCost = (v) => {
  const n = Number(v) || 0
  if (n >= 100) return '$' + n.toFixed(0)
  if (n >= 1) return '$' + n.toFixed(2)
  return '$' + n.toFixed(4)
}
const fmtBalance = (b) => {
  if (!b) return '—'
  const sym = b.currency === 'CNY' ? '¥' : b.currency === 'USD' ? '$' : String(b.currency || '') + ' '
  const total = Number(b.total) || 0
  return sym + (total >= 1000
    ? total.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : total.toFixed(2))
}

const cell = (label, value, strong, extra) => React.createElement(
  'div',
  Object.assign({ className: 'udash-cell' + (strong ? ' udash-strong' : '') }, extra || {}),
  React.createElement('div', { className: 'udash-label' }, label),
  React.createElement('div', { className: 'udash-value' }, value),
)

function Dashboard(props) {
  const wide = props && props.wide !== false
  const [snap, setSnap] = React.useState(null)
  const [intervalMs, setIntervalMs] = React.useState(5000)
  React.useEffect(() => {
    let alive = true
    let timerId = undefined
    const refresh = async () => {
      if (api === undefined || !alive) return
      try {
        const v = await api.snapshot()
        if (alive && v) setSnap(v)
      } catch { /* keep the last snapshot */ }
      timerId = window.setTimeout(refresh, Math.max(1000, intervalMs))
    }
    if (api !== undefined) {
      api.configGet()
        .then((v) => { if (alive && v && v.config && Number(v.config.pollIntervalMs) >= 1000) setIntervalMs(Number(v.config.pollIntervalMs)) })
        .catch(() => {})
    }
    void refresh()
    return () => { alive = false; if (timerId !== undefined) window.clearTimeout(timerId) }
  }, [intervalMs])
  if (!wide) return null
  const tokens = snap && snap.tokens ? snap.tokens : null
  const running = snap ? Number(snap.running) || 0 : null
  const dot = running === null ? 'udash-dot-none' : running === 0 ? 'udash-dot-idle' : 'udash-dot-busy'
  const balExtra = snap && snap.balanceError ? { title: '余额获取失败: ' + snap.balanceError } : undefined
  return React.createElement('div', { className: 'udash-card' },
    React.createElement('div', { className: 'udash-grid' },
      cell('余额', fmtBalance(snap ? snap.balance : null), true, balExtra),
      React.createElement('div', { className: 'udash-cell' },
        React.createElement('div', { className: 'udash-label' }, '并行任务'),
        React.createElement('div', { className: 'udash-value' },
          React.createElement('span', { className: 'udash-dot ' + dot }),
          running === null ? '—' : String(running),
        ),
      ),
      cell('今日Tokens', fmtTokens(tokens ? tokens.total : 0)),
      cell('预估费用', fmtCost(snap ? snap.costUsd : 0)),
    ),
  )
}

function SettingsPage() {
  const [cfg, setCfg] = React.useState(null)
  const [msg, setMsg] = React.useState('')
  React.useEffect(() => {
    let alive = true
    if (api !== undefined) {
      api.configGet()
        .then((v) => { if (alive && v && v.config) setCfg(v.config) })
        .catch(() => {})
    }
    return () => { alive = false }
  }, [])
  const setNum = (key, value) => setCfg((c) => {
    const n = Number(value)
    return c ? { ...c, [key]: Number.isFinite(n) ? n : c[key] } : c
  })
  const setPrice = (model, field, value) => setCfg((c) => {
    if (!c) return c
    const n = Number(value)
    const p = { ...((c.prices && c.prices[model]) || { inputMiss: 0, inputHit: 0, output: 0 }) }
    p[field] = Number.isFinite(n) ? n : p[field]
    return { ...c, prices: { ...(c.prices || {}), [model]: p } }
  })
  const save = () => {
    setMsg('')
    if (api === undefined) return
    api.configSet({ config: cfg })
      .then((v) => { setMsg(v && v.ok ? '已保存 ✓' : '保存失败') })
      .catch(() => { setMsg('保存失败') })
  }
  const resetToday = () => {
    setMsg('')
    if (api === undefined) return
    api.resetToday()
      .then((v) => { setMsg(v && v.ok ? '今日统计已重置 ✓' : '重置失败') })
      .catch(() => { setMsg('重置失败') })
  }
  if (!cfg) return React.createElement('p', { className: 'udash-note' }, '加载中…')
  const field = (label, value, onChange, step) => React.createElement('label', { className: 'udash-field' },
    React.createElement('span', { className: 'udash-field-label' }, label),
    React.createElement('input', {
      className: 'udash-input', type: 'number', step: step || 'any', value: String(value),
      onChange: (e) => onChange(e.target.value),
    }),
  )
  const priceRow = (model) => {
    const p = (cfg.prices && cfg.prices[model]) || { inputMiss: 0, inputHit: 0, output: 0 }
    return React.createElement('div', { className: 'udash-price-row' },
      React.createElement('div', { className: 'udash-price-title' }, model),
      field('输入(未命中) $/M', p.inputMiss, (v) => setPrice(model, 'inputMiss', v), '0.001'),
      field('输入(缓存命中) $/M', p.inputHit, (v) => setPrice(model, 'inputHit', v), '0.001'),
      field('输出 $/M', p.output, (v) => setPrice(model, 'output', v), '0.001'),
    )
  }
  return React.createElement('div', { className: 'udash-settings' },
    React.createElement('p', { className: 'udash-note' }, '今日 Token/费用按自然日累计并持久化（重启不清空）；费用为按以下单价的估算值（USD/1M tokens）。'),
    field('轮询间隔 (ms)', cfg.pollIntervalMs, (v) => setNum('pollIntervalMs', v), '1000'),
    field('余额刷新间隔 (ms)', cfg.balanceRefreshMs, (v) => setNum('balanceRefreshMs', v), '1000'),
    field('余额请求超时 (ms)', cfg.balanceTimeoutMs, (v) => setNum('balanceTimeoutMs', v), '1000'),
    priceRow('deepseek-chat'),
    priceRow('deepseek-reasoner'),
    React.createElement('div', { className: 'udash-actions' },
      React.createElement('button', { className: 'udash-btn udash-btn-primary', type: 'button', onClick: save }, '保存'),
      React.createElement('button', { className: 'udash-btn', type: 'button', onClick: resetToday }, '重置今日统计'),
    ),
    msg ? React.createElement('p', { className: 'udash-msg' }, msg) : null,
  )
}

export function apply(ctx) {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  adoptStyles()

  // Mount the Remote namespace; the components read `api` once it is set.
  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(REMOTE_DESCRIPTOR)
    api = ctx.reflect.get('remote.usageDashboard')
    return dispose
  }, 'usage-dashboard: remote mount')

  slots.inject('sidebar.footer.dashboard', () => slots.register(
    { name: 'sidebar.footer.dashboard', id: 'usage-dashboard', order: 0 },
    (props) => React.createElement(Dashboard, props),
  ))
  slots.inject('settings.section', () => slots.register(
    { name: 'settings.section', id: 'usage-dashboard', order: 90, label: '仪表盘' },
    (props) => React.createElement(SettingsPage, props),
  ))
}
