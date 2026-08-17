/**
 * Typert Remote descriptors for the `usageDashboard` service: the host
 * manifest (registered via `ctx.typert.register`) and the client contribution
 * (mounted via `ctx.remote.$mount`). `src-json` codecs keep the wire boundary
 * lossless JSON without generated schemas.
 * @module dsh-usage-dashboard/src/typert
 */

export const INVOCATIONS = [
  {
    id: 'dsh-usage-dashboard#usageDashboard/snapshot',
    service: 'usageDashboard',
    namespace: 'usageDashboard',
    method: 'snapshot',
    invocation: { kind: 'direct' },
    parameters: [],
    result: { mode: 'src-json' },
  },
  {
    id: 'dsh-usage-dashboard#usageDashboard/configGet',
    service: 'usageDashboard',
    namespace: 'usageDashboard',
    method: 'configGet',
    invocation: { kind: 'direct' },
    parameters: [],
    result: { mode: 'src-json' },
  },
  {
    id: 'dsh-usage-dashboard#usageDashboard/configSet',
    service: 'usageDashboard',
    namespace: 'usageDashboard',
    method: 'configSet',
    invocation: { kind: 'direct' },
    parameters: [
      { name: 'config', wire: 'config', source: 'json', codec: { mode: 'src-json' } },
    ],
    result: { mode: 'src-json' },
  },
  {
    id: 'dsh-usage-dashboard#usageDashboard/resetToday',
    service: 'usageDashboard',
    namespace: 'usageDashboard',
    method: 'resetToday',
    invocation: { kind: 'direct' },
    parameters: [],
    result: { mode: 'src-json' },
  },
]

/** Host-side typert registration: reflection model + Remote invocations. */
export const TYPERT_MANIFEST = {
  package: 'dsh-usage-dashboard',
  face: 'host',
  schemas: [],
  model: {
    services: [
      {
        key: 'usageDashboard',
        exportName: 'UsageDashboardRuntime',
        description: 'Sidebar dashboard data: account balance, parallel tasks, per-day tokens and estimated cost.',
        tags: [],
        members: [
          { kind: 'method', name: 'snapshot', signature: 'snapshot(): Promise<object>' },
          { kind: 'method', name: 'configGet', signature: 'configGet(): Promise<object>' },
          { kind: 'method', name: 'configSet', signature: 'configSet(config: object): Promise<object>' },
          { kind: 'method', name: 'resetToday', signature: 'resetToday(): Promise<object>' },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: INVOCATIONS,
}

/** Client-side Remote contribution: the same descriptors on the consumer face. */
export const REMOTE_DESCRIPTOR = { package: 'dsh-usage-dashboard', descriptors: INVOCATIONS }
