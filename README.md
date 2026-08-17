# dsh-usage-dashboard

A small live dashboard for the **DeepSeek Harness web GUI**, docked in the left
sidebar between the session list and Settings:

- **余额** — real-time DeepSeek account balance (via `user/balance`, cached 60 s)
- **并行任务** — count of live agents currently `running` (green dot = 0, amber
  breathing dot = ≥ 1)
- **今日 Tokens** — per-natural-day accumulated model usage (input / output /
  cache read / cache write), counted from every `llm/stream` `usage` chunk
- **预估费用** — estimated cost at configurable per-model prices (USD / 1M tokens)

Data is persisted to `<workspace-root>/.dsh-usage-dashboard.json`, so today's
numbers survive restarts of both the plugin and the harness. A Settings page
(`设置 → 仪表盘`) edits the poll intervals, the balance refresh/timeout, and the
price table, plus a "reset today" action.

## Requirements

- Windows host (the balance probe uses the harness `shell` seam with a
  PowerShell command; the TLS 1.2 line is included for Windows PowerShell 5.1)
- DeepSeek provider with `DEEPSEEK_API_KEY` configured in the DSH credentials
- A sidebar with the **`sidebar.footer.dashboard`** seat. This seat is not yet
  in upstream deepseek-harness; apply `patches/sidebar-dashboard-seat.patch`
  to your deepseek-harness checkout (see below), or the card simply does not
  render (the Settings page still works).

## Install into a DSH profile

```sh
dsh plugin --profile web add github:gongfpp/dsh-usage-dashboard
```

or, from a local checkout:

```sh
dsh plugin --profile web add file:/path/to/dsh-usage-dashboard
```

Then restart the harness (profile bundle changes take effect on restart). The
bundle patch mounts the host half; the `dsh.client` declaration loads the
browser half automatically.

## Build

```sh
pnpm install   # or npm install (devDependency: esbuild)
pnpm build     # → lib/index.js (host) + lib/client.js (browser bundle)
```

## Sidebar seat patch

`patches/sidebar-dashboard-seat.patch` adds the `sidebar.footer.dashboard` slot
to `packages/client/ui-sidebar` (contract, entry, shell, CSS) and rebuilds
`lib/client.js` via the package's `bundle` script. The harness HMR picks the
rebuilt bundle up automatically.

## License

MIT
