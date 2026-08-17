# dsh-usage-dashboard

DeepSeek Harness Web GUI 侧边栏的小型实时仪表盘（会话列表下方、设置上方）：

- **余额** — DeepSeek 账户实时余额（`user/balance`，缓存 60 秒）
- **并行任务** — 当前 `running` 状态的 live agent 数（0 个绿灯，≥1 琥珀色呼吸灯）
- **今日 Tokens** — 按自然日累计的模型用量（输入 / 输出 / 缓存读 / 缓存写），来自每次 `llm/stream` 的 `usage` 块
- **预估费用** — 按可配置单价估算（USD / 1M tokens）

数据持久化到 `<工作区根>/.dsh-usage-dashboard.json`，插件或 DSH 重启都不会清空当日累计。
设置页（`设置 → 仪表盘`）可调轮询/余额刷新/超时间隔与单价表，并提供「重置今日统计」。

## 依赖条件

- Windows 主机（余额探测走 harness 的 `shell` 服务执行 PowerShell；已内置 TLS 1.2 强制行，兼容 Windows PowerShell 5.1）
- DeepSeek 提供商且 DSH 凭据中已配置 `DEEPSEEK_API_KEY`
- 侧边栏存在 **`sidebar.footer.dashboard`** 座。该座尚未进入上游 deepseek-harness：
  对本地 checkout 应用 `patches/sidebar-dashboard-seat.patch`（见下），否则卡片不渲染（设置页仍可用）。

## 安装到 DSH profile

```sh
dsh plugin --profile web add github:gongfpp/dsh-usage-dashboard
```

或本地路径：

```sh
dsh plugin --profile web add file:/path/to/dsh-usage-dashboard
```

然后重启 harness（profile bundle 变更需重启生效）。bundle patch 挂载 host 半，`dsh.client` 声明自动加载浏览器半。

## 构建

```sh
pnpm install   # 或 npm install（devDependency: esbuild）
pnpm build     # → lib/index.js（host）+ lib/client.js（浏览器 bundle）
```

## 侧边栏座补丁

`patches/sidebar-dashboard-seat.patch` 为 `packages/client/ui-sidebar` 增加 `sidebar.footer.dashboard` 座（契约、入口、外壳、CSS），
并用该包的 `bundle` 脚本重建 `lib/client.js`；harness 的 HMR 会自动热更新。

## License

MIT
