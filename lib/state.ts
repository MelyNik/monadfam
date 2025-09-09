// lib/state.ts
export type StatusMode = 'online' | 'short' | 'long'

export type Row = {
  id: number
  name: string
  handle: string
  avatarUrl?: string
  days: number                    // сколько дней «в системе»
  statusMode?: StatusMode         // статус ЭТОГО профиля
  votesUp?: number
  votesDown?: number
  myVote?: 'up' | 'down'          // наш голос по этому профилю
}

export type Lists = { mutual: Row[]; await_their: Row[]; await_ours: Row[] }
export type Removed = { from: 'await_their' | 'await_ours'; row: Row }[]

export type Status = {
  mode: StatusMode
  shortLeft: number
  shortUntil?: number
  shortMonthStart?: number
  longLeft: number
  longActive?: boolean
  longUsedAt?: number
  longMonthStart?: number
  longResetAt?: number
}

export type EventItem = { ts: number; kind: string; details?: string }

export type AppState = {
  lists: Lists
  removed: Removed
  status: Status
  tutorialDone?: boolean
  homePool: Row[]
  homeIndex: number
  lastDaysAt?: number
  events: EventItem[]            // лог «хлебных крошек»
}

const KEY = 'monadfam:v1'

// безопасный клон
export function clone<T>(v: T): T {
  const sc: any = (globalThis as any).structuredClone
  if (typeof sc === 'function') return sc(v)
  return JSON.parse(JSON.stringify(v))
}

// --- DEMO
const demoUsers: Row[] = [
  { id: 101, name: 'Nik',   handle: '@user1', avatarUrl: 'https://unavatar.io/x/user1', days: 5, statusMode: 'online', votesUp: 12, votesDown: 3 },
  { id: 102, name: 'Lena',  handle: '@user2', avatarUrl: 'https://unavatar.io/x/user2', days: 7, statusMode: 'short',  votesUp: 5,  votesDown: 1 },
  { id: 103, name: 'Alex',  handle: '@user3', avatarUrl: 'https://unavatar.io/x/user3', days: 9, statusMode: 'long',   votesUp: 20, votesDown: 15 },
  { id: 104, name: 'Vlad',  handle: '@user4', avatarUrl: 'https://unavatar.io/x/user4', days: 3, statusMode: 'online', votesUp: 2,  votesDown: 0 },
]
const seedMutual: Row[] = [
  { id: 1, name: 'name', handle: '@alice', days: 6, avatarUrl: 'https://unavatar.io/x/alice', votesUp: 30, votesDown: 4 },
  { id: 2, name: 'name', handle: '@bob',   days: 2, avatarUrl: 'https://unavatar.io/x/bob',   votesUp: 3,  votesDown: 0 },
]
const seedAwaitTheir: Row[] = [
  { id: 3, name: 'name', handle: '@carol', days: 5, avatarUrl: 'https://unavatar.io/x/carol', votesUp: 1, votesDown: 12 },
  { id: 4, name: 'name', handle: '@dave',  days: 1, avatarUrl: 'https://unavatar.io/x/dave',  votesUp: 0, votesDown: 0 },
]
const seedAwaitOurs: Row[] = [
  { id: 5, name: 'name', handle: '@erin',  days: 4, avatarUrl: 'https://unavatar.io/x/erin',  votesUp: 0, votesDown: 0 },
  { id: 6, name: 'name', handle: '@frank', days: 6, avatarUrl: 'https://unavatar.io/x/frank', votesUp: 10, votesDown: 1 },
]

// ===== время (UTC)
export function startOfMonthUTC(ts: number) {
  const d = new Date(ts)
  const y = d.getUTCFullYear(), m = d.getUTCMonth()
  return Date.UTC(y, m, 1, 0, 0, 0, 0)
}
export function isNewCalendarMonth(prev?: number) {
  const nowMonth  = startOfMonthUTC(Date.now())
  const prevMonth = startOfMonthUTC(prev ?? Date.now())
  return nowMonth !== prevMonth
}
export function nextMonthStartFrom(ts: number) {
  const d = new Date(ts)
  const y = d.getUTCFullYear(), m = d.getUTCMonth()
  return Date.UTC(y, m + 1, 1, 0, 0, 0, 0)
}
const MS_DAY = 24 * 60 * 60 * 1000
export function startOfDayUTC(ts: number) {
  const d = new Date(ts)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
}

export function defaultState(): AppState {
  const now = Date.now()
  return {
    lists: { mutual: seedMutual, await_their: seedAwaitTheir, await_ours: seedAwaitOurs },
    removed: [],
    status: {
      mode: 'online',
      shortLeft: 4,
      shortMonthStart: startOfMonthUTC(now),
      longLeft: 1,
      longMonthStart: now,
      longResetAt: undefined,
    },
    tutorialDone: false,
    homePool: demoUsers,
    homeIndex: 0,
    lastDaysAt: startOfDayUTC(now),
    events: [],
  }
}

// ---- нормализация/санитизация
function sanitizeRow(x: any): Row {
  const rawStatus = x?.statusMode
  const statusMode: StatusMode | undefined = rawStatus === 'online' || rawStatus === 'short' || rawStatus === 'long' ? rawStatus : undefined
  return {
    id: Number(x?.id ?? Math.floor(Math.random() * 1e9)),
    name: String(x?.name ?? x?.username ?? 'user'),
    handle: String(x?.handle ?? x?.at ?? '@user'),
    avatarUrl: typeof x?.avatarUrl === 'string' ? x.avatarUrl : undefined,
    days: Number.isFinite(x?.days) ? Number(x.days) : 0,
    statusMode,
    votesUp: Number.isFinite(x?.votesUp) ? Number(x.votesUp) : 0,
    votesDown: Number.isFinite(x?.votesDown) ? Number(x.votesDown) : 0,
    myVote: x?.myVote === 'up' || x?.myVote === 'down' ? x.myVote : undefined,
  }
}
function sanitizeLists(x: any): Lists {
  return {
    mutual:       Array.isArray(x?.mutual)       ? x.mutual.map(sanitizeRow)       : [],
    await_their:  Array.isArray(x?.await_their)  ? x.await_their.map(sanitizeRow)  : (Array.isArray(x?.awaitTheir) ? x.awaitTheir.map(sanitizeRow) : []),
    await_ours:   Array.isArray(x?.await_ours)   ? x.await_ours.map(sanitizeRow)   : (Array.isArray(x?.awaitOurs)  ? x.awaitOurs.map(sanitizeRow)  : []),
  }
}
function normalizeStatus(st: Status): Status {
  const ns: Status = { ...st }
  if (isNewCalendarMonth(ns.shortMonthStart)) {
    ns.shortMonthStart = startOfMonthUTC(Date.now())
    ns.shortLeft = 4
  }
  if (ns.mode === 'short' && ns.shortUntil && Date.now() >= ns.shortUntil) {
    ns.mode = 'online'
    ns.shortUntil = undefined
  }
  if (ns.longLeft <= 0 && ns.longResetAt && Date.now() >= ns.longResetAt) {
    ns.longLeft = 1
    ns.longResetAt = undefined
  }
  return ns
}
function bumpDaysIfNeeded(s: AppState): AppState {
  const today = startOfDayUTC(Date.now())
  const last  = s.lastDaysAt ?? today
  const delta = Math.max(0, Math.floor((today - last) / MS_DAY))
  if (delta <= 0) return s
  const inc = (list: Row[]) => list.map(r => ({ ...r, days: (r.days ?? 0) + delta }))
  return {
    ...s,
    lists: { mutual: inc(s.lists.mutual), await_their: inc(s.lists.await_their), await_ours: inc(s.lists.await_ours) },
    lastDaysAt: today,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    let s: AppState = {
      ...defaultState(),
      ...parsed,
      lists: sanitizeLists(parsed?.lists),
      status: normalizeStatus(parsed?.status ?? defaultState().status),
      homePool: Array.isArray(parsed?.homePool) ? parsed.homePool.map(sanitizeRow) : defaultState().homePool,
      lastDaysAt: Number.isFinite(parsed?.lastDaysAt) ? Number(parsed.lastDaysAt) : defaultState().lastDaysAt,
      events: Array.isArray(parsed?.events) ? parsed.events.slice(0, 200) : [],
    }
    s = bumpDaysIfNeeded(s)
    return s
  } catch {
    return defaultState()
  }
}
export function saveState(s: AppState) { localStorage.setItem(KEY, JSON.stringify(s)) }

// reset demo data
export function resetDemoData(): AppState {
  localStorage.removeItem(KEY)
  const s = defaultState()
  saveState(s)
  return s
}

// ——— доступность профиля для показа на главной (онлайн)
function isRowAvailable(r: Row) {
  return (r.statusMode ?? 'online') === 'online'
}

// Home helpers
export function takeNextFromPool(s: AppState): Row | null {
  const allIds = new Set([
    ...s.lists.mutual.map(r => r.id),
    ...s.lists.await_their.map(r => r.id),
    ...s.lists.await_ours.map(r => r.id),
  ])
  for (let i = 0; i < s.homePool.length; i++) {
    const idx = (s.homeIndex + i) % s.homePool.length
    const r = s.homePool[idx]
    if (isRowAvailable(r) && !allIds.has(r.id)) {
      s.homeIndex = idx
      return r
    }
  }
  return null
}
export function advancePool(s: AppState) {
  s.homeIndex = (s.homeIndex + 1) % s.homePool.length
}
export function peekNextFromPool(s: AppState): Row | null {
  const allIds = new Set([
    ...s.lists.mutual.map(r => r.id),
    ...s.lists.await_their.map(r => r.id),
    ...s.lists.await_ours.map(r => r.id),
  ])
  for (let i = 0; i < s.homePool.length; i++) {
    const idx = (s.homeIndex + i) % s.homePool.length
    const r = s.homePool[idx]
    if (isRowAvailable(r) && !allIds.has(r.id)) {
      return r
    }
  }
  return null
}

// ——— рейтинг (байес-сглаженная доля)
const PRIOR_UP = 20
const PRIOR_DN = 5
export function rating01(r: Row): number {
  const up = Math.max(0, r.votesUp ?? 0)
  const dn = Math.max(0, r.votesDown ?? 0)
  return (up + PRIOR_UP) / (up + dn + PRIOR_UP + PRIOR_DN)
}
export function ratingPercent(r: Row): number {
  return Math.round(rating01(r) * 100)
}
export function ratingColor(r: Row): string {
  const hue = Math.round(120 * rating01(r)) // 0..120
  return `hsl(${hue} 70% 50%)`
}

// ——— лог событий
export function pushEvent(s: AppState, kind: string, details?: string) {
  s.events = [{ ts: Date.now(), kind, details }, ...(s.events ?? [])].slice(0, 200)
}
