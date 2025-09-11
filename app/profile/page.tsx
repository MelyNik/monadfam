'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  AppState, Row, loadState, saveState, clone,
  startOfMonthUTC, nextMonthStartFrom,
  resetDemoData, pushEvent, ratingColor
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

function isVotingDay(ts: number) { const dow = new Date(ts).getDay(); return dow === 2 || dow === 6 }
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

/* Один и тот же знак «палец», для down — поворот (визуально идентичные) */
const Thumb = (props:any) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M2 10h4v12H2V10zm8 12h6a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4l.8-4.2A2 2 0 0 0 10 5l-4 7v10z"/>
  </svg>
)

export default function ProfilePage(){
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab]     = useState<Tab>('mutual')
  const [q, setQ]         = useState('')
  const [selected, setSelected] = useState<Row | null>(null)

  // обновляем "текущее время" раз в минуту, чтобы в полночь кнопки появились/исчезли
  const [nowTs, setNowTs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  const voteDay = isVotingDay(nowTs)

  const qNorm = q.toLowerCase().replace(/^@/, '')
  const match = (r: Row) => {
    const h = (r.handle || '').toLowerCase().replace(/^@/, '')
    const n = (r.name   || '').toLowerCase()
    return h.includes(qNorm) || n.includes(qNorm)
  }

  // Удаляем центральную верхнюю кнопку "Monad" только на странице профиля
  useEffect(() => {
    const removeCenterMonad = () => {
      const els = Array.from(document.querySelectorAll('a,button')) as HTMLElement[]
      const target = els.find(el => {
        const text = (el.textContent || '').trim().toLowerCase()
        if (text !== 'monad') return false
        const rect = el.getBoundingClientRect()
        const isTop = rect.top < 80
        const centerX = (rect.left + rect.right) / 2
        const isCentered = Math.abs(centerX - window.innerWidth / 2) < 120
        return isTop && isCentered
      })
      if (target) target.remove()
    }
    removeCenterMonad()
    const mo = new MutationObserver(removeCenterMonad)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
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

  const unfollowFromMutual = (r: Row) => { if (!ask()) return; const ns = clone(state)
    ns.lists.mutual = ns.lists.mutual.filter(x => x.id !== r.id)
    ns.lists.await_ours = [{ ...r, days: 0 }, ...ns.lists.await_ours]
    pushEvent(ns, 'move', `${r.handle}: mutual → await_ours`); write(ns)
  }
  const unfollowFromAwaitTheir = (r: Row) => { if (!ask()) return; const ns = clone(state)
    ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    pushEvent(ns, 'remove', `${r.handle}: removed from await_their`); write(ns)
  }
  const followFromAwaitOurs = (r: Row) => { const ns = clone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    ns.lists.mutual     = [{ ...r, days: r.days ?? 0 }, ...ns.lists.mutual]
    pushEvent(ns, 'move', `${r.handle}: await_ours → mutual`); write(ns)
  }
  const declineFromAwaitOurs = (r: Row) => { if (!ask()) return; const ns = clone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    pushEvent(ns, 'remove', `${r.handle}: declined in await_ours`); write(ns)
  }
  const softRemove = (from: 'await_their' | 'await_ours', r: Row) => { if (!ask()) return; const ns = clone(state)
    if (from === 'await_their') ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    if (from === 'await_ours')  ns.lists.await_ours  = ns.lists.await_ours .filter(x => x.id !== r.id)
    ns.removed = [{ from, row: r }, ...ns.removed]; pushEvent(ns, 'soft-remove', `${r.handle}: removed from ${from}`); write(ns)
  }
  const restoreRemoved = () => { if (!removed.length) return; const ns = clone(state)
    removed.forEach(({ from, row }) => { if (from === 'await_their') ns.lists.await_their = [row, ...ns.lists.await_their]
                                         if (from === 'await_ours')  ns.lists.await_ours  = [row, ...ns.lists.await_ours] })
    ns.removed = []; pushEvent(ns, 'restore', `Restored ${removed.length} profiles`); write(ns)
  }

  const toOnline = () => { const ns = clone(state)
    if (ns.status.mode === 'long') { ns.status.longActive = false; ns.status.longResetAt = Date.now() + MS30D }
    ns.status.mode = 'online'; ns.status.shortUntil = undefined
    pushEvent(ns, 'status:set', 'You switched to ONLINE'); write(ns)
  }
  const activateShort = () => { const ns = clone(state)
    if (ns.status.mode === 'long') { ns.status.longActive = false; ns.status.longResetAt = Date.now() + MS30D }
    if (ns.status.mode === 'short') return
    if (ns.status.shortLeft <= 0) { alert('No short absences left this month'); return }
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000
    ns.status.mode = 'short'; ns.status.shortLeft -= 1; ns.status.shortUntil = Date.now() + TWO_DAYS
    pushEvent(ns, 'status:set', 'You switched to SHORT'); write(ns)
  }
  const toggleLong = () => { const ns = clone(state)
    if (ns.status.mode === 'long') {
      ns.status.mode = 'online'; ns.status.longActive = false; ns.status.longResetAt = Date.now() + MS30D
      pushEvent(ns, 'status:set', 'You left LONG → ONLINE'); write(ns); return
    }
    if (ns.status.longLeft <= 0) { alert('No long absence left right now'); return }
    ns.status.mode = 'long'; ns.status.longActive = true; ns.status.longUsedAt = Date.now(); ns.status.longLeft -= 1
    pushEvent(ns, 'status:set', 'You switched to LONG'); write(ns)
  }

  const vote = (r: Row, dir: 'up' | 'down') => {
    const ns = clone(state)
    const list = tab === 'mutual' ? ns.lists.mutual : ns.lists.await_their
    const idx = list.findIndex(x => x.id === r.id); if (idx < 0) return
    const row = { ...list[idx] }; if (row.myVote) return; if (!canVoteOnRow(row, tab, Date.now())) return
    if (dir === 'up')   row.votesUp   = (row.votesUp   ?? 0) + 1
    if (dir === 'down') row.votesDown = (row.votesDown ?? 0) + 1
    row.myVote = dir; list[idx] = row; pushEvent(ns, 'vote', `${row.handle}: ${dir}`); write(ns)
  }

  const shortCountdown = useMemo(() => {
    if (state.status.mode !== 'short' || !state.status.shortUntil) return ''
    const left = Math.max(0, state.status.shortUntil - Date.now())
    const sec  = Math.floor(left / 1000)
    const h = Math.floor(sec / 3600).toString().padStart(2, '0')
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [state.status.mode, state.status.shortUntil])

  const shortRestoreIn = useMemo(() => {
    const base = state.status.shortMonthStart ?? startOfMonthUTC(Date.now())
    const next = nextMonthStartFrom(base)
    return Math.max(0, next - Date.now())
  }, [state.status.shortMonthStart])

  const tabBtn = (kind: Tab, label: string, count: number) => {
    const active = tab === kind ? 'bg-white/10' : ''
    return (
      <button onClick={() => setTab(kind)} className={`px-4 py-3 rounded-xl font-medium ${active}`}>
        {label} <span className="text-white/60">({count})</span>
      </button>
    )
  }

  const selectedRow = selected ?? rows[0] ?? null
  const doReset = () => { const s = resetDemoData(); setState(s) }

  /* ===== счётчики Followers / Following (уникальные) ===== */
  const followersCount = useMemo(() => {
    const ids = new Set<number>()
    lists.mutual.forEach(r => ids.add(r.id))
    lists.await_ours.forEach(r => ids.add(r.id))
    return ids.size
  }, [lists.mutual, lists.await_ours])

  const followingCount = useMemo(() => {
    const ids = new Set<number>()
    lists.mutual.forEach(r => ids.add(r.id))
    lists.await_their.forEach(r => ids.add(r.id))
    return ids.size
  }, [lists.mutual, lists.await_their])

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-8 py-8 text-white">
      <button
        onClick={doReset}
        className="fixed top-5 right-6 z-50 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
      >
        Reset demo data
      </button>

      <h1 className="text-3xl font-bold mb-6 text-center">Profile</h1>

      {/* statuses + restore */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15" onClick={toOnline}>Online</button>

        <button
          onClick={activateShort}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'short' ? 'bg-green-600/30' : 'bg-white/10'}`}
          title="Short absence: up to 2 days"
        >
          {state.status.mode === 'short'
            ? `Pause · ${shortCountdown}`
            : (state.status.shortLeft > 0
                ? `Short absence · ${state.status.shortLeft} left`
                : `Short absence · restores in ${fmtLeft(shortRestoreIn)}`)}
        </button>

        <button
          onClick={toggleLong}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'long' ? 'bg-red-600/30' : 'bg-white/10'}`}
          title="Long absence: one per 30 days after finish"
        >
          {state.status.mode === 'long'
            ? 'Stop'
            : (state.status.longLeft > 0
                ? `Long absence · ${state.status.longLeft} left`
                : `Long absence · restores in ${fmtLeft(Math.max(0, (state.status.longResetAt ?? 0) - Date.now()))}`)}
        </button>

        <div className="grow" />
        <button
          onClick={restoreRemoved}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"
        >
          Restore removed profiles {removed.length ? `(${removed.length})` : ''}
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
        {/* LEFT — наш профиль */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div
            className="relative group avatar-ring-xl"
            style={{ ['--ring-colors' as any]: 'hsl(120 70% 50%)' }}
          >
            <div className="avatar-ring-xl-inner">
              <img src={yourAvatar} alt="you" className="avatar-xl"/>
            </div>
            <button
              onClick={() => alert('Change avatar: TODO')}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/15 opacity-0 group-hover:opacity-100 transition"
            >
              Change avatar
            </button>
          </div>
          <div className="mt-5 text-center">
            <div className="font-semibold text-lg">Your name</div>
            <div className="text-sm text-white/70">@your_handle</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between"><span>Followers</span><span>{followersCount}</span></div>
            <div className="flex items-center justify-between"><span>Following</span><span>{followingCount}</span></div>
          </div>
        </aside>

        {/* CENTER — список и голосование */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {rows.length === 0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map(r => {
              const can   = canVoteOnRow(r, tab, nowTs)
              const b     = statusBadge(r)
              const whyDisabled =
                r.myVote ? 'You have already voted for this profile'
                : (tab === 'await_ours' ? 'Voting is not available in this tab'
                : ((r.statusMode ?? 'online') !== 'online' ? 'User is absent (short/long)'
                : (!isVotingDay(nowTs) ? 'Voting is available only on Tuesday and Saturday'
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
                  {/* LEFT: аватар + статус под аватаром + имя/handle */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="avatar-ring-sm"
                        style={{ ['--ring-colors' as any]: ratingColor(r) }}
                      >
                        <div className="avatar-ring-sm-inner">
                          <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm"/>
                        </div>
                      </div>
                      <div className={`mt-1 text-[10px] px-2 py-0.5 rounded-full ${b.className}`}>{b.label}</div>
                    </div>
                    <div className="leading-5">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-white/70 text-sm">{r.handle}</div>
                    </div>
                  </div>

                  {/* MIDDLE: кнопки голосования — показываем ТОЛЬКО в день голосования */}
                  {voteDay && (
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {/* ЗА */}
                      <button
                        disabled={!can}
                        title={can ? 'Vote for' : undefined}
                        onClick={() => vote(r, 'up')}
                        className={`rounded-full flex items-center justify-center text-white/90
                          bg-[#234C3C] hover:bg-[#2B5C49] ring-1 ring-[#2F6B56]/25
                          ${!can ? 'opacity-60 cursor-not-allowed' : ''}`}
                        style={{ width: 82, height: 34 }}
                      >
                        <Thumb />
                      </button>

                      {/* «!» между кнопками — только если голосование запрещено */}
                      { !can ? (
                        <div className="relative group">
                          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs">!</div>
                          <div className="absolute z-20 hidden group-hover:block left-1/2 -translate-x-1/2 mt-2 w-64 text-xs rounded-lg border border-white/10 bg-[rgba(10,10,16,0.96)] p-2 shadow-xl">
                            {whyDisabled || 'Voting is unavailable'}
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6" />
                      )}

                      {/* ПРОТИВ */}
                      <button
                        disabled={!can}
                        title={can ? 'Vote against' : undefined}
                        onClick={() => vote(r, 'down')}
                        className={`rounded-full flex items-center justify-center text-white/90
                          bg-[#3D2024] hover:bg-[#49262B] ring-1 ring-[#7F2A33]/25
                          ${!can ? 'opacity-60 cursor-not-allowed' : ''}`}
                        style={{ width: 82, height: 34 }}
                      >
                        <Thumb style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </div>
                  )}

                  {/* RIGHT */}
                  {/* RIGHT */}
<div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
  <a
    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
    href={`https://x.com/${(r.handle || '').replace(/^@/, '')}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    Open in X
  </a>

  {tab === 'mutual' && (
    <button
      onClick={() => unfollowFromMutual(r)}
      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
    >
      Unfollow
    </button>
  )}

  {tab === 'await_their' && (
    <>
      <button
        onClick={() => unfollowFromAwaitTheir(r)}
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
      >
        Unfollow
      </button>
      {/* мягкое удаление: переносит запись в state.removed */}
      <button
        onClick={() => softRemove('await_their', r)}
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
      >
        Remove
      </button>
    </>
  )}

  {tab === 'await_ours' && (
    <>
      <button
        onClick={() => followFromAwaitOurs(r)}
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
      >
        Follow
      </button>
      <button
        onClick={() => declineFromAwaitOurs(r)}
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
      >
        Decline
      </button>
      {/* мягкое удаление: переносит запись в state.removed */}
      <button
        onClick={() => softRemove('await_ours', r)}
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
      >
        Remove
      </button>
    </>
  )}
</div>

                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT — выбранный профиль */}
        <aside className="flex-shrink-0 w-[360px] space-y-4">
          <div className="card p-5 flex flex-col items-center">
            {selectedRow ? (
              <>
                <div
                  className="avatar-ring-xl"
                  style={{ ['--ring-colors' as any]: ratingColor(selectedRow) }}
                >
                  <div className="avatar-ring-xl-inner">
                    <img src={selectedRow.avatarUrl || 'https://unavatar.io/x/twitter'} alt={selectedRow.handle} className="avatar-xl"/>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <div className="font-semibold text-lg">{selectedRow.name}</div>
                  <div className="text-sm text-white/70">{selectedRow.handle}</div>
                </div>
                <div className="mt-6 w-full space-y-3 text-white/80">
                  <div className="flex items-center justify-between"><span>Followers</span><span>{followersCount}</span></div>
                  <div className="flex items-center justify-between"><span>Following</span><span>{followingCount}</span></div>
                </div>
              </>
            ) : (
              <div className="text-white/60">Select a profile from the list</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
