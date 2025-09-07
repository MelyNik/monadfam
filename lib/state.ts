// lib/state.ts
export type Row = {
  id: number
  name: string
  handle: string
  avatarUrl?: string
  days: number
}
export type Lists = { mutual: Row[]; await_their: Row[]; await_ours: Row[] }
export type Removed = { from: 'await_their' | 'await_ours'; row: Row }[]
export type StatusMode = 'online' | 'short' | 'long'
export type Status = {
  mode: StatusMode
  shortLeft: number
  shortUntil?: number
  shortMonthStart?: number
  longLeft: number
  longActive?: boolean
  longUsedAt?: number
  longMonthStart?: number
}
export type AppState = {
  lists: Lists
  removed: Removed
  status: Status
  tutorialDone?: boolean
  homePool: Row[]
  homeIndex: number
}

const KEY = 'monadfam:v1'

// безопасный клон (если structuredClone нет)
export function clone<T>(v: T): T {
  const sc: any = (globalThis as any).structuredClone
  if (typeof sc === 'function') return sc(v)
  return JSON.parse(JSON.stringify(v))
}

// --- DEMO
const demoUsers: Row[] = [
  { id: 101, name: 'Nik',   handle: '@user1', avatarUrl: 'https://unavatar.io/x/user1', days: 0 },
  { id: 102, name: 'Lena',  handle: '@user2', avatarUrl: 'https://unavatar.io/x/user2', days: 0 },
  { id: 103, name: 'Alex',  handle: '@user3', avatarUrl: 'https://unavatar.io/x/user3', days: 0 },
  { id: 104, name: 'Vlad',  handle: '@user4', avatarUrl: 'https://unavatar.io/x/user4', days: 0 },
]
const seedMutual: Row[] = [
  { id: 1, name: 'name', handle: '@alice', days: 0, avatarUrl: 'https://unavatar.io/x/alice' },
  { id: 2, name: 'name', handle: '@bob',   days: 0, avatarUrl: 'https://unavatar.io/x/bob'   },
]
const seedAwaitTheir: Row[] = [
  { id: 3, name: 'name', handle: '@carol', days: 2, avatarUrl: 'https://unavatar.io/x/carol' },
  { id: 4, name: 'name', handle: '@dave',  days: 5, avatarUrl: 'https://unavatar.io/x/dave'  },
]
const seedAwaitOurs: Row[] = [
  { id: 5, name: 'name', handle: '@erin',  days: 1, avatarUrl: 'https://unavatar.io/x/erin'  },
  { id: 6, name: 'name', handle: '@frank', days: 6, avatarUrl: 'https://unavatar.io/x/frank' },
]

export function defaultState(): AppState {
  const now = Date.now()
  return {
    lists: { mutual: seedMutual, await_their: seedAwaitTheir, await_ours: seedAwaitOurs },
    removed: [],
    status: {
      mode: 'online',
      shortLeft: 4,
      shortMonthStart: now,
      longLeft: 1,
      longMonthStart: now,
    },
    tutorialDone: false,
    homePool: demoUsers,
    homeIndex: 0,
  }
}

// ---- нормализация старых данных из localStorage
function sanitizeRow(x: any): Row {
  return {
    id: Number(x?.id ?? Math.floor(Math.random() * 1e9)),
    name: String(x?.name ?? x?.username ?? 'user'),
    handle: String(x?.handle ?? x?.at ?? '@user'),
    avatarUrl: typeof x?.avatarUrl === 'string' ? x.avatarUrl : undefined,
    days: Number(x?.days ?? 0),
  }
}
function sanitizeLists(x: any): Lists {
  return {
    mutual:       Array.isArray(x?.mutual)       ? x.mutual.map(sanitizeRow)       : [],
    await_their:  Array.isArray(x?.await_their)  ? x.await_their.map(sanitizeRow)  : (Array.isArray(x?.awaitTheir) ? x.awaitTheir.map(sanitizeRow) : []),
    await_ours:   Array.isArray(x?.await_ours)   ? x.await_ours.map(sanitizeRow)   : (Array.isArray(x?.awaitOurs)  ? x.awaitOurs.map(sanitizeRow)  : []),
  }
}
function monthPassed(since?: number) {
  if (!since) return true
  const MS30 = 30 * 24 * 60 * 60 * 1000
  return Date.now() - since > MS30
}
function normalizeStatus(st: Status): Status {
  const now = Date.now()
  const ns = { ...st }
  if (monthPassed(ns.shortMonthStart)) { ns.shortMonthStart = now; ns.shortLeft = 4 }
  if (monthPassed(ns.longMonthStart))  { ns.longMonthStart  = now; ns.longLeft  = 1 }
  if (ns.mode === 'short' && ns.shortUntil && Date.now() >= ns.shortUntil) {
    ns.mode = 'online'; ns.shortUntil = undefined
  }
  return ns
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    const s: AppState = {
      ...defaultState(),
      ...parsed,
      lists: sanitizeLists(parsed?.lists),
      status: normalizeStatus(parsed?.status ?? defaultState().status),
    }
    return s
  } catch {
    return defaultState()
  }
}
export function saveState(s: AppState) { localStorage.setItem(KEY, JSON.stringify(s)) }

// Home helpers
export function takeNextFromPool(s: AppState): Row | null {
  const allIds = new Set([
    ...s.lists.mutual.map(r => r.id),
    ...s.lists.await_their.map(r => r.id),
    ...s.lists.await_ours.map(r => r.id),
  ])
  for (let i = 0; i < s.homePool.length; i++) {
    const idx = (s.homeIndex + i) % s.homePool.length
    if (!allIds.has(s.homePool[idx].id)) {
      s.homeIndex = idx
      return s.homePool[idx]
    }
  }
  return null
}
export function advancePool(s: AppState) {
  s.homeIndex = (s.homeIndex + 1) % s.homePool.length
}
