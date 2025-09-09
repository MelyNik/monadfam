'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  AppState, Row, loadState, saveState, clone,
  startOfMonthUTC, nextMonthStartFrom,
  ratingPercent, ratingColor, resetDemoData, pushEvent
} from '../../lib/state'

const MS30D = 30 * 24 * 60 * 60 * 1000

function fmtLeft(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600).toString().padStart(2,'0')
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2,'0')
  const s = Math.floor(sec % 60).toString().padStart(2,'0')
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}:${m}:${s}`
}

const yourAvatar = 'https://unavatar.io/x/your_handle'
type Tab = 'mutual' | 'await_their' | 'await_ours'

function isVotingDay(ts: number) {
  const dow = new Date(ts).getDay()
  return dow === 2 || dow === 6 // Tue/Sat
}
function canVoteOnRow(r: Row, tab: Tab, now: number) {
  if (tab === 'await_ours') return false
  if ((r.statusMode ?? 'online') !== 'online') return false
  if (!isVotingDay(now)) return false
  if ((r.days ?? 0) < 4) return false
  if (r.myVote) return false
  return true
}
function statusBadge(r: Row) {
  const sm = r.statusMode ?? 'online'
  if (sm === 'online') return { label: 'online', className: 'bg-green-600/25 text-green-300' }
  if (sm === 'short')  return { label: 'шорт',  className: 'bg-red-600/25 text-red-300' }
  return { label: 'лонг', className: 'bg-red-600/25 text-red-300' }
}

export default function ProfilePage(){
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab]     = useState<Tab>('mutual')
  const [q, setQ]         = useState('')
  const [selected, setSelected] = useState<Row | null>(null)

  const qNorm = q.toLowerCase().replace(/^@/, '')
  const match = (r: Row) => {
    const h = (r.handle || '').toLowerCase().replace(/^@/, '')
    const n = (r.name   || '').toLowerCase()
    return h.includes(qNorm) || n.includes(qNorm)
  }

  // «тик» для таймеров и дня
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // служебные таймеры
  useEffect(() => {
    const t = setInterval(() => {
      setState(prev => {
        const ns = clone(prev)
        let changed = false
        const nowTs = Date.now()

        if (ns.status.mode === 'short' && ns.status.shortUntil && nowTs >= ns.status.shortUntil) {
          ns.status.mode = 'online'
          ns.status.shortUntil = undefined
          pushEvent(ns, 'status:short:end', 'Short ended → online')
          changed = true
        }
        const lastMonthStart = ns.status.shortMonthStart ?? startOfMonthUTC(nowTs)
        const nextBoundary   = nextMonthStartFrom(lastMonthStart)
        if (nowTs >= nextBoundary) {
          ns.status.shortLeft = 4
          ns.status.shortMonthStart = nextBoundary
          pushEvent(ns, 'status:short:refill', 'Short attempts refilled (month boundary)')
          changed = true
        }
        if (ns.status.longLeft <= 0 && ns.status.longResetAt && nowTs >= ns.status.longResetAt) {
          ns.status.longLeft = 1
          ns.status.longResetAt = undefined
          pushEvent(ns, 'status:long:refill', 'Long attempt restored after 30 days')
          changed = true
        }
        if (changed) saveState(ns)
        return changed ? ns : prev
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const lists   = state.lists
  const removed = state.removed

  const rows = useMemo(() => {
    const list = tab === 'mutual' ? lists.mutual : tab === 'await_their' ? lists.await_their : lists.await_ours
    return list.filter(match)
  }, [tab, lists, q])

  const counts = { mutual: lists.mutual.length, await_their: lists.await_their.length, await_ours: lists.await_ours.length }
  const write = (ns: AppState) => { saveState(ns); setState(ns) }
  const ask = (msg = 'Confirm your choice?') => window.confirm(msg)

  // ——— действия по вкладкам
  const unfollowFromMutual = (r: Row) => {
    if (!ask()) return
    const ns = clone(state)
    ns.lists.mutual = ns.lists.mutual.filter(x => x.id !== r.id)
    ns.lists.await_ours = [{ ...r, days: r.days ?? 0 }, ...ns.lists.await_ours]
    pushEvent(ns, 'move', `${r.handle}: mutual → await_ours`)
    write(ns)
  }
  const unfollowFromAwaitTheir = (r: Row) => {
    if (!ask()) return
    const ns = clone(state)
    ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    pushEvent(ns, 'remove', `${r.handle}: removed from await_their`)
    write(ns)
  }
  const followFromAwaitOurs = (r: Row) => {
    const ns = clone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    ns.lists.mutual     = [{ ...r, days: r.days ?? 0 }, ...ns.lists.mutual]
    pushEvent(ns, 'move', `${r.handle}: await_ours → mutual`)
    write(ns)
  }
  const declineFromAwaitOurs = (r: Row) => {
    if (!ask()) return
    const ns = clone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    pushEvent(ns, 'remove', `${r.handle}: declined in await_ours`)
    write(ns)
  }
  const softRemove = (from: 'await_their' | 'await_ours', r: Row) => {
    if (!ask()) return
    const ns = clone(state)
    if (from === 'await_their') ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    if (from === 'await_ours')  ns.lists.await_ours  = ns.lists.await_ours .filter(x => x.id !== r.id)
    ns.removed = [{ from, row: r }, ...ns.removed]
    pushEvent(ns, 'soft-remove', `${r.handle}: removed from ${from}`)
    write(ns)
  }
  const restoreRemoved = () => {
    if (!removed.length) return
    const ns = clone(state)
    removed.forEach(({ from, row }) => {
      if (from === 'await_their') ns.lists.await_their = [row, ...ns.lists.await_their]
      if (from === 'await_ours')  ns.lists.await_ours  = [row, ...ns.lists.await_ours]
    })
    ns.removed = []
    pushEvent(ns, 'restore', `Restored ${removed.length} profiles`)
    write(ns)
  }

  // ——— статусы
  const toOnline = () => {
    const ns = clone(state)
    if (ns.status.mode === 'long') {
      ns.status.longActive = false
      ns.status.longResetAt = Date.now() + MS30D
    }
    ns.status.mode = 'online'
    ns.status.shortUntil = undefined
    pushEvent(ns, 'status:set', 'You switched to ONLINE')
    write(ns)
  }
  const activateShort = () => {
    const ns = clone(state)
    if (ns.status.mode === 'long') {
      ns.status.longActive = false
      ns.status.longResetAt = Date.now() + MS30D
    }
    if (ns.status.mode === 'short') return
    if (ns.status.shortLeft <= 0) { alert('No short absences left this month'); return }
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000
    ns.status.mode = 'short'
    ns.status.shortLeft -= 1
    ns.status.shortUntil = Date.now() + TWO_DAYS
    pushEvent(ns, 'status:set', 'You switched to SHORT')
    write(ns)
  }
  const toggleLong = () => {
    const ns = clone(state)
    if (ns.status.mode === 'long') {
      ns.status.mode = 'online'
      ns.status.longActive = false
      ns.status.longResetAt = Date.now() + MS30D
      pushEvent(ns, 'status:set', 'You left LONG → ONLINE')
      write(ns)
      return
    }
    if (ns.status.longLeft <= 0) { alert('No long absence left right now'); return }
    ns.status.mode = 'long'
    ns.status.longActive = true
    ns.status.longUsedAt = Date.now()
    ns.status.longLeft -= 1
    pushEvent(ns, 'status:set', 'You switched to LONG')
    write(ns)
  }

  // ——— голосование
  const vote = (r: Row, dir: 'up' | 'down') => {
    const ns = clone(state)
    const list = tab === 'mutual' ? ns.lists.mutual : ns.lists.await_their
    const idx = list.findIndex(x => x.id === r.id)
    if (idx < 0) return
    const row = { ...list[idx] }
    if (row.myVote) return
    if (!canVoteOnRow(row, tab, now)) return
    if (dir === 'up')   row.votesUp   = (row.votesUp   ?? 0) + 1
    if (dir === 'down') row.votesDown = (row.votesDown ?? 0) + 1
    row.myVote = dir
    list[idx] = row
    pushEvent(ns, 'vote', `${row.handle}: ${dir === 'up' ? 'up' : 'down'}`)
    write(ns)
  }

  const shortCountdown = useMemo(() => {
    if (state.status.mode !== 'short' || !state.status.shortUntil) return ''
    const left = Math.max(0, state.status.shortUntil - now)
    const sec  = Math.floor(left / 1000)
    const h = Math.floor(sec / 3600).toString().padStart(2, '0')
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [state.status.mode, state.status.shortUntil, now])

  const shortRestoreIn = useMemo(() => {
    const base = state.status.shortMonthStart ?? startOfMonthUTC(now)
    const next = nextMonthStartFrom(base)
    return Math.max(0, next - now)
  }, [state.status.shortMonthStart, now])

  const tabBtn = (kind: Tab, label: string, count: number) => {
    const active = tab === kind ? 'bg-white/10' : ''
    return (
      <button onClick={() => setTab(kind)} className={`px-4 py-3 rounded-xl font-medium ${active}`}>
        {label} <span className="text-white/60">({count})</span>
      </button>
    )
  }
  const overdue = (r: Row) => (tab === 'await_their' || tab === 'await_ours') && (r.days ?? 0) >= 4

  // правая большая карточка
  const selectedRow = selected ?? rows[0] ?? null
  const selectedColor = selectedRow ? ratingColor(selectedRow) : '#888'

  const doReset = () => {
    const s = resetDemoData()
    setState(s)
  }

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-8 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <button onClick={doReset} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">Reset demo data</button>
      </div>

      {/* statuses + restore */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15" onClick={toOnline}>Online</button>

        {/* SHORT */}
        <button
          onClick={activateShort}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'short' ? 'bg-green-600/30' : 'bg-white/10'}`}
          title="Short absence: up to 2 days"
        >
          {state.status.mode === 'short'
            ? `Pause · ${shortCountdown}`
            : (state.status.shortLeft > 0
                ? `Short absence · ${state.status.shortLeft} left`
                : `Short absence · restores in ${fmtLeft(shortRestoreIn)}`
              )
          }
        </button>

        {/* LONG */}
        <button
          onClick={toggleLong}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'long' ? 'bg-red-600/30' : 'bg-white/10'}`}
          title="Long absence: one per 30 days after finish"
        >
          {state.status.mode === 'long'
            ? 'Stop'
            : (state.status.longLeft > 0
                ? `Long absence · ${state.status.longLeft} left`
                : `Long absence · restores in ${fmtLeft(Math.max(0, (state.status.longResetAt ?? 0) - now))}`
              )
          }
        </button>

        <div className="grow" />
        <button onClick={restoreRemoved} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">
          Restore removed profiles {state.removed.length ? `(${state.removed.length})` : ''}
        </button>
      </div>

      {/* tabs + search */}
      <div className="card p-2 mb-4">
        <div className="grid md:grid-cols-3 gap-2">
          {tabBtn('mutual', 'Following each other', counts.mutual)}
          {tabBtn('await_their', 'Waiting for their follow-back', counts.await_their)}
          {tabBtn('await_ours', 'Waiting for our follow', counts.await_ours)}
        </div>
        <div className="mt-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by @handle or name" className="input w-full" />
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* LEFT CARD — наш профиль */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner" style={{ borderColor: '#7C5CFF' }}>
            <img src={yourAvatar} alt="you" className="avatar-xl"/>
          </div></div>
          <div className="mt-5 text-center">
            <div className="font-semibold text-lg">Your name</div>
            <div className="text-sm text-white/70">@your_handle</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between"><span>Followers</span><span>0</span></div>
            <div className="flex items-center justify-between"><span>Following</span><span>0</span></div>
          </div>
        </aside>

        {/* CENTER LIST */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {rows.length === 0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map(r => {
              const color = ratingColor(r)
              const pct   = ratingPercent(r)
              const badge = (tab === 'mutual' || tab === 'await_their') ? statusBadge(r) : null
              const can   = canVoteOnRow(r, tab, now)

              const whyDisabled =
                r.myVote ? 'You have already voted for this profile'
                : (tab === 'await_ours' ? 'Voting is not available in this tab'
                : ((r.statusMode ?? 'online') !== 'online' ? 'User is absent (short/long)'
                : (!isVotingDay(now) ? 'Voting is available only on Tuesday and Saturday'
                : ((r.days ?? 0) < 4 ? 'Available after 4 days in lists' : ''))))

              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`relative flex items-center justify-between gap-4 rounded-2xl px-4 py-3 border cursor-pointer
                    ${((tab === 'await_their' || tab === 'await_ours') && (r.days ?? 0) >= 4)
                      ? 'border-red-400/30 bg-red-500/5'
                      : 'border-white/10 bg-white/5'}`}
                >
                  {/* LEFT: avatar + name/handle + badge */}
                  <div className="flex items-center gap-3">
                    <div className="avatar-ring-sm"><div className="avatar-ring-sm-inner" style={{ borderColor: color }}>
                      <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm"/>
                    </div></div>
                    <div className="leading-5">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-white/70 text-sm">{r.handle}</div>
                      {badge && (
                        <div className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MIDDLE: voting buttons + кружок-подсказка */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {(tab !== 'await_ours') && (
                      <>
                        <button
                          disabled={!can}
                          title={can ? 'Vote for (за)' : undefined}
                          onClick={() => vote(r, 'up')}
                          className={`px-3 py-2 rounded-xl text-sm ${can ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-white/10 opacity-60 cursor-not-allowed'}`}
                        >
                          За
                        </button>
                        <button
                          disabled={!can}
                          title={can ? 'Vote against (против)' : undefined}
                          onClick={() => vote(r, 'down')}
                          className={`px-3 py-2 rounded-xl text-sm ${can ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-white/10 opacity-60 cursor-not-allowed'}`}
                        >
                          Против
                        </button>
                        {/* кружок «!» с всплывашкой — показываем, если голосовать нельзя */}
                        {!can && (
                          <div className="relative group inline-block">
                            <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-xs">!</div>
                            <div className="absolute z-20 hidden group-hover:block left-1/2 -translate-x-1/2 mt-2 w-64 text-xs rounded-lg border border-white/10 bg-[rgba(10,10,16,0.96)] p-2 shadow-xl">
                              {whyDisabled || 'Voting is unavailable'}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* RIGHT: rating + actions */}
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <div className="w-28">
                      <div className="w-full h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,#ef4444,#eab308,#22c55e)' }} />
                        <div className="absolute inset-y-0 left-0 bg-black/40" style={{ width: `${Math.max(0, 100 - pct)}%` }} />
                      </div>
                    </div>

                    <a
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
                      href={`https://x.com/${(r.handle || '').replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in X
                    </a>

                    {tab === 'mutual' && (
                      <button onClick={() => unfollowFromMutual(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
                        Unfollow
                      </button>
                    )}
                    {tab === 'await_their' && (
                      <button onClick={() => unfollowFromAwaitTheir(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
                        Unfollow
                      </button>
                    )}
                    {tab === 'await_ours' && (
                      <>
                        <button onClick={() => followFromAwaitOurs(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
                          Follow
                        </button>
                        <button onClick={() => declineFromAwaitOurs(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT CARD — выбранный профиль + лог событий */}
        <aside className="flex-shrink-0 w-[360px] space-y-4">
          <div className="card p-5 flex flex-col items-center">
            {selectedRow ? (
              <>
                <div className="avatar-ring-xl">
                  <div className="avatar-ring-xl-inner" style={{ borderColor: selectedColor }}>
                    <img src={selectedRow.avatarUrl || 'https://unavatar.io/x/twitter'} alt={selectedRow.handle} className="avatar-xl"/>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <div className="font-semibold text-lg">{selectedRow.name}</div>
                  <div className="text-sm text-white/70">{selectedRow.handle}</div>
                </div>
                <div className="mt-6 w-full space-y-3 text-white/80">
                  <div className="flex items-center justify-between"><span>Followers</span><span>0</span></div>
                  <div className="flex items-center justify-between"><span>Following</span><span>0</span></div>
                </div>
              </>
            ) : (
              <div className="text-white/60">Select a profile from the list</div>
            )}
          </div>

          {/* лог событий */}
          <div className="card p-4">
            <div className="font-semibold mb-2">Activity</div>
            <div className="space-y-1 max-h-[300px] overflow-auto pr-1">
              {state.events.length === 0 && <div className="text-white/60 text-sm">No events yet</div>}
              {state.events.slice(0, 20).map((e, i) => (
                <div key={i} className="text-xs text-white/80 flex gap-2">
                  <span className="text-white/50">{new Date(e.ts).toLocaleString()}</span>
                  <span className="text-white/60">·</span>
                  <span>{e.kind}</span>
                  {e.details && <span className="text-white/60">— {e.details}</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
