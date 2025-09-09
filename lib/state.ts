// lib/state.ts
export type StatusMode = 'online' | 'short' | 'long'

export type Row = {
  id: number
  name: string
  handle: string
  avatarUrl?: string
  days: number
  // статус конкретного пользователя (для фильтрации на главной)
  statusMode?: StatusMode // online | short | long
}

export type Lists = { mutual: Row[]; await_their: Row[]; await_ours: Row[] }
export type Removed = { from: 'await_their' | 'await_ours'; row: Row }[]

export type Status = {
  mode: StatusMode
  // Short: попытки восстанавливаются в ПЕРВЫЙ день нового календарного месяца
  shortLeft: number
  shortUntil?: number
  shortMonthStart?: number

  // Long: попытка восстанавливается через 30 дней ПОСЛЕ выхода из long
  longLeft: number
  longActive?: boolean
  longUsedAt?: number
  longMonthStart?: number
  longResetAt?: number
}

export type AppState = {
  lists: Lists
  removed: Removed
  status: Status
  tutorialDone?: boolean
  homePool: Row[]
  homeIndex: number
}

// ⚠️ Если хотите «чистый старт», можно временно поднять версию ключа:
// const KEY = 'monadfam:v2'
const KEY = 'monadfam:v1'

// безопасный клон
export function clone<T>(v: T): T {
  const sc: any = (globalThis as any).structuredClone
  if (typeof sc === 'function') return sc(v)
  return JSON.parse(JSON.stringify(v))
}

// --- DEMO (добавили статусы на нескольких пользователях)
const demoUsers: Row[] = [
  { id: 101, name: 'Nik',   handle: '@user1', avatarUrl: 'https://unavatar.io/x/user1', days: 0, statusMode: 'online' },
  { id: 102, name: 'Lena',  handle: '@user2', avatarUrl: 'https://unavatar.io/x/user2', days: 0, statusMode: 'short' }, // не появится
  { id: 103, name: 'Alex',  handle: '@user3', avatarUrl: 'https://unavatar.io/x/user3', days: 0, statusMode: 'long'  }, // не появится
  { id: 104, name: 'Vlad',  handle: '@user4', avatarUrl: 'https://unavatar.io/x/user4', days: 0, statusMode: 'online' },
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

// ===== helpers для календарного месяца (UTC)
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
  }
}

// ---- нормализация старых данных из localStorage
function sanitizeRow(x: any): Row {
  const rawStatus = x?.statusMode
  const statusMode: StatusMode | undefined =
    rawStatus === 'online' || rawStatus === 'short' || rawStatus === 'long' ? rawStatus : undefined

  return {
    id: Number(x?.id ?? Math.floor(Math.random() * 1e9)),
    name: String(x?.name ?? x?.username ?? 'user'),
    handle: String(x?.handle ?? x?.at ?? '@user'),
    avatarUrl: typeof x?.avatarUrl === 'string' ? x.avatarUrl : undefined,
    days: Number(x?.days ?? 0),
    statusMode,
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

  // SHORT: первый день нового календарного месяца → вернуть 4 попытки
  if (isNewCalendarMonth(ns.shortMonthStart)) {
    ns.shortMonthStart = startOfMonthUTC(Date.now())
    ns.shortLeft = 4
  }
  // истёк активный short → выйти в online
  if (ns.mode === 'short' && ns.shortUntil && Date.now() >= ns.shortUntil) {
    ns.mode = 'online'
    ns.shortUntil = undefined
  }

  // LONG: если попыток нет и пришло время ресета → вернуть 1 попытку
  if (ns.longLeft <= 0 && ns.longResetAt && Date.now() >= ns.longResetAt) {
    ns.longLeft = 1
    ns.longResetAt = undefined
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
      // если в старых данных нет статусов у homePool — дефолт «online»
      homePool: Array.isArray(parsed?.homePool) ? parsed.homePool.map(sanitizeRow) : defaultState().homePool,
    }
    return s
  } catch {
    return defaultState()
  }
}
export function saveState(s: AppState) { localStorage.setItem(KEY, JSON.stringify(s)) }

// ——— Общая проверка доступности пользователя для «голосования»
function isRowAvailable(r: Row) {
  return (r.statusMode ?? 'online') === 'online'
}

// Home helpers (мутирующая версия — для «принять решение и перейти к следующему»)
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

// «Подсмотреть» кандидата БЕЗ мутаций индекса (для рендера)
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
