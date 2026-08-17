window.__ModuleLoader__.load({ id: 'dsh-usage-dashboard', factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);

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
var REMOTE_DESCRIPTOR = { package: "dsh-usage-dashboard", descriptors: INVOCATIONS };

// src/client/index.js
var inject = ["slots"];
var STYLE_ID = "dsh-usage-dashboard-style";
var cssText = [
  ".udash-card{display:block;box-sizing:border-box;width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}",
  ".udash-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}",
  ".udash-cell{min-width:0}",
  ".udash-label{font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);white-space:nowrap}",
  ".udash-value{font-size:13px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary);display:flex;align-items:center}",
  ".udash-strong .udash-value{color:var(--dsw-alias-brand-primary)}",
  ".udash-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;flex:none}",
  ".udash-dot-idle{background:var(--dsw-alias-state-success-primary)}",
  ".udash-dot-busy{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 6px var(--dsw-alias-state-warn-primary);animation:udash-pulse 1.6s ease-in-out infinite}",
  ".udash-dot-none{background:var(--dsw-alias-label-tertiary)}",
  "@keyframes udash-pulse{0%,100%{opacity:1}50%{opacity:.4}}",
  ".udash-settings{display:flex;flex-direction:column;gap:10px;max-width:440px}",
  ".udash-note{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);margin:0}",
  ".udash-field{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}",
  ".udash-field-label{color:var(--dsw-alias-label-primary);flex:1}",
  ".udash-input{width:120px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}",
  ".udash-price-row{display:flex;flex-wrap:wrap;gap:8px 12px;padding:8px 0;border-top:1px solid var(--dsw-alias-border-l1)}",
  ".udash-price-title{width:100%;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}",
  ".udash-price-row .udash-field{font-size:12px}",
  ".udash-price-row .udash-input{width:96px}",
  ".udash-actions{display:flex;gap:8px}",
  ".udash-btn{padding:6px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer}",
  ".udash-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}",
  ".udash-msg{font-size:12px;color:var(--dsw-alias-state-success-primary);margin:0}"
].join("\n");
function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}
var api = void 0;
var fmtTokens = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(Math.round(v));
};
var fmtCost = (v) => {
  const n = Number(v) || 0;
  if (n >= 100) return "$" + n.toFixed(0);
  if (n >= 1) return "$" + n.toFixed(2);
  return "$" + n.toFixed(4);
};
var fmtBalance = (b) => {
  if (!b) return "\u2014";
  const sym = b.currency === "CNY" ? "\xA5" : b.currency === "USD" ? "$" : String(b.currency || "") + " ";
  const total = Number(b.total) || 0;
  return sym + (total >= 1e3 ? total.toLocaleString("en-US", { maximumFractionDigits: 2 }) : total.toFixed(2));
};
var cell = (label, value, strong, extra) => import_react.default.createElement(
  "div",
  Object.assign({ className: "udash-cell" + (strong ? " udash-strong" : "") }, extra || {}),
  import_react.default.createElement("div", { className: "udash-label" }, label),
  import_react.default.createElement("div", { className: "udash-value" }, value)
);
function Dashboard(props) {
  const wide = props && props.wide !== false;
  const [snap, setSnap] = import_react.default.useState(null);
  const [intervalMs, setIntervalMs] = import_react.default.useState(5e3);
  import_react.default.useEffect(() => {
    let alive = true;
    let timerId = void 0;
    const refresh = async () => {
      if (api === void 0 || !alive) return;
      try {
        const v = await api.snapshot();
        if (alive && v) setSnap(v);
      } catch {
      }
      timerId = window.setTimeout(refresh, Math.max(1e3, intervalMs));
    };
    if (api !== void 0) {
      api.configGet().then((v) => {
        if (alive && v && v.config && Number(v.config.pollIntervalMs) >= 1e3) setIntervalMs(Number(v.config.pollIntervalMs));
      }).catch(() => {
      });
    }
    void refresh();
    return () => {
      alive = false;
      if (timerId !== void 0) window.clearTimeout(timerId);
    };
  }, [intervalMs]);
  if (!wide) return null;
  const tokens = snap && snap.tokens ? snap.tokens : null;
  const running = snap ? Number(snap.running) || 0 : null;
  const dot = running === null ? "udash-dot-none" : running === 0 ? "udash-dot-idle" : "udash-dot-busy";
  const balExtra = snap && snap.balanceError ? { title: "\u4F59\u989D\u83B7\u53D6\u5931\u8D25: " + snap.balanceError } : void 0;
  return import_react.default.createElement(
    "div",
    { className: "udash-card" },
    import_react.default.createElement(
      "div",
      { className: "udash-grid" },
      cell("\u4F59\u989D", fmtBalance(snap ? snap.balance : null), true, balExtra),
      import_react.default.createElement(
        "div",
        { className: "udash-cell" },
        import_react.default.createElement("div", { className: "udash-label" }, "\u5E76\u884C\u4EFB\u52A1"),
        import_react.default.createElement(
          "div",
          { className: "udash-value" },
          import_react.default.createElement("span", { className: "udash-dot " + dot }),
          running === null ? "\u2014" : String(running)
        )
      ),
      cell("\u4ECA\u65E5Tokens", fmtTokens(tokens ? tokens.total : 0)),
      cell("\u9884\u4F30\u8D39\u7528", fmtCost(snap ? snap.costUsd : 0))
    )
  );
}
function SettingsPage() {
  const [cfg, setCfg] = import_react.default.useState(null);
  const [msg, setMsg] = import_react.default.useState("");
  import_react.default.useEffect(() => {
    let alive = true;
    if (api !== void 0) {
      api.configGet().then((v) => {
        if (alive && v && v.config) setCfg(v.config);
      }).catch(() => {
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  const setNum = (key, value) => setCfg((c) => {
    const n = Number(value);
    return c ? { ...c, [key]: Number.isFinite(n) ? n : c[key] } : c;
  });
  const setPrice = (model, field2, value) => setCfg((c) => {
    if (!c) return c;
    const n = Number(value);
    const p = { ...c.prices && c.prices[model] || { inputMiss: 0, inputHit: 0, output: 0 } };
    p[field2] = Number.isFinite(n) ? n : p[field2];
    return { ...c, prices: { ...c.prices || {}, [model]: p } };
  });
  const save = () => {
    setMsg("");
    if (api === void 0) return;
    api.configSet({ config: cfg }).then((v) => {
      setMsg(v && v.ok ? "\u5DF2\u4FDD\u5B58 \u2713" : "\u4FDD\u5B58\u5931\u8D25");
    }).catch(() => {
      setMsg("\u4FDD\u5B58\u5931\u8D25");
    });
  };
  const resetToday = () => {
    setMsg("");
    if (api === void 0) return;
    api.resetToday().then((v) => {
      setMsg(v && v.ok ? "\u4ECA\u65E5\u7EDF\u8BA1\u5DF2\u91CD\u7F6E \u2713" : "\u91CD\u7F6E\u5931\u8D25");
    }).catch(() => {
      setMsg("\u91CD\u7F6E\u5931\u8D25");
    });
  };
  if (!cfg) return import_react.default.createElement("p", { className: "udash-note" }, "\u52A0\u8F7D\u4E2D\u2026");
  const field = (label, value, onChange, step) => import_react.default.createElement(
    "label",
    { className: "udash-field" },
    import_react.default.createElement("span", { className: "udash-field-label" }, label),
    import_react.default.createElement("input", {
      className: "udash-input",
      type: "number",
      step: step || "any",
      value: String(value),
      onChange: (e) => onChange(e.target.value)
    })
  );
  const priceRow = (model) => {
    const p = cfg.prices && cfg.prices[model] || { inputMiss: 0, inputHit: 0, output: 0 };
    return import_react.default.createElement(
      "div",
      { className: "udash-price-row" },
      import_react.default.createElement("div", { className: "udash-price-title" }, model),
      field("\u8F93\u5165(\u672A\u547D\u4E2D) $/M", p.inputMiss, (v) => setPrice(model, "inputMiss", v), "0.001"),
      field("\u8F93\u5165(\u7F13\u5B58\u547D\u4E2D) $/M", p.inputHit, (v) => setPrice(model, "inputHit", v), "0.001"),
      field("\u8F93\u51FA $/M", p.output, (v) => setPrice(model, "output", v), "0.001")
    );
  };
  return import_react.default.createElement(
    "div",
    { className: "udash-settings" },
    import_react.default.createElement("p", { className: "udash-note" }, "\u4ECA\u65E5 Token/\u8D39\u7528\u6309\u81EA\u7136\u65E5\u7D2F\u8BA1\u5E76\u6301\u4E45\u5316\uFF08\u91CD\u542F\u4E0D\u6E05\u7A7A\uFF09\uFF1B\u8D39\u7528\u4E3A\u6309\u4EE5\u4E0B\u5355\u4EF7\u7684\u4F30\u7B97\u503C\uFF08USD/1M tokens\uFF09\u3002"),
    field("\u8F6E\u8BE2\u95F4\u9694 (ms)", cfg.pollIntervalMs, (v) => setNum("pollIntervalMs", v), "1000"),
    field("\u4F59\u989D\u5237\u65B0\u95F4\u9694 (ms)", cfg.balanceRefreshMs, (v) => setNum("balanceRefreshMs", v), "1000"),
    field("\u4F59\u989D\u8BF7\u6C42\u8D85\u65F6 (ms)", cfg.balanceTimeoutMs, (v) => setNum("balanceTimeoutMs", v), "1000"),
    priceRow("deepseek-chat"),
    priceRow("deepseek-reasoner"),
    import_react.default.createElement(
      "div",
      { className: "udash-actions" },
      import_react.default.createElement("button", { className: "udash-btn udash-btn-primary", type: "button", onClick: save }, "\u4FDD\u5B58"),
      import_react.default.createElement("button", { className: "udash-btn", type: "button", onClick: resetToday }, "\u91CD\u7F6E\u4ECA\u65E5\u7EDF\u8BA1")
    ),
    msg ? import_react.default.createElement("p", { className: "udash-msg" }, msg) : null
  );
}
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  adoptStyles();
  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(REMOTE_DESCRIPTOR);
    api = ctx.reflect.get("remote.usageDashboard");
    return dispose;
  }, "usage-dashboard: remote mount");
  slots.inject("sidebar.footer.dashboard", () => slots.register(
    { name: "sidebar.footer.dashboard", id: "usage-dashboard", order: 0 },
    (props) => import_react.default.createElement(Dashboard, props)
  ));
  slots.inject("settings.section", () => slots.register(
    { name: "settings.section", id: "usage-dashboard", order: 90, label: "\u4EEA\u8868\u76D8" },
    (props) => import_react.default.createElement(SettingsPage, props)
  ));
}

  return module.exports;
} })
