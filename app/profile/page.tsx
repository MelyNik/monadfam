'use client'
import { useEffect, useMemo, useState } from 'react'
import { AppState, Row, loadState, saveState } from '../../lib/state'

const yourAvatar     = 'https://unavatar.io/x/your_handle'
const selectedAvatar = 'https://unavatar.io/x/selected_user'

type Tab = 'mutual' | 'await_their' | 'await_ours'

export default function ProfilePage(){
  const [state, setState] = useState<AppState | null>(null)
  const [tab, setTab]     = useState<Tab>('mutual')
  const [q, setQ]         = useState('')

  // tick для обратного таймера short
  useEffect(() => {
    const s = loadState()
    setState(s)
    const t = setInterval(() => {
      setState(prev => {
        if (!prev) return prev
        const ns = structuredClone(prev)
        // авто-возврат из short, если истёк
        if (ns.status.mode === 'short' && ns.status.shortUntil && Date.now() >= ns.status.shortUntil) {
          ns.status.mode = 'online'
          ns.status.shortUntil = undefined
          saveState(ns)
        }
        return ns
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  if (!state) return null

  // поиск
  const norm  = (s: string) => s.toLowerCase().replace(/^@/, '')
  const match = (r: Row)    => norm(r.handle).includes(norm(q)) || norm(r.name).includes(norm(q))

  const lists   = state.lists
  const removed = state.removed

  const rows = useMemo(() => {
    const list = tab === 'mutual' ? lists.mutual : tab === 'await_their' ? lists.await_their : lists.await_ours
    return list.filter(match)
  }, [tab, lists, q])

  const counts = { mutual: lists.mutual.length, await_their: lists.await_their.length, await_ours: lists.await_ours.length }

  // ===== действия со списками (все пишем в localStorage) =====
  const write = (ns: AppState) => { saveState(ns); setState(ns) }

  const unfollowFromMutual = (r: Row) => {
    if (!confirm()) return
    const ns = structuredClone(state)
    ns.lists.mutual = ns.lists.mutual.filter(x => x.id !== r.id)
    // по твоему правилу — просто переносим к «Waiting for our follow», days=0
    ns.lists.await_ours = [{ ...r, days: 0 }, ...ns.lists.await_ours]
    write(ns)
  }

  const unfollowFromAwaitTheir = (r: Row) => {
    if (!confirm()) return
    const ns = structuredClone(state)
    ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    write(ns)
  }

  const followFromAwaitOurs = (r: Row) => {
    const ns = structuredClone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    ns.lists.mutual     = [{ ...r, days: 0 }, ...ns.lists.mutual]
    write(ns)
  }

  const declineFromAwaitOurs = (r: Row) => {
    if (!confirm()) return
    const ns = structuredClone(state)
    ns.lists.await_ours = ns.lists.await_ours.filter(x => x.id !== r.id)
    write(ns)
  }

  // мягкое удаление крестиком
  const softRemove = (from: 'await_their' | 'await_ours', r: Row) => {
    if (!confirm()) return
    const ns = structuredClone(state)
    if (from === 'await_their') ns.lists.await_their = ns.lists.await_their.filter(x => x.id !== r.id)
    if (from === 'await_ours')  ns.lists.await_ours  = ns.lists.await_ours .filter(x => x.id !== r.id)
    ns.removed = [{ from, row: r }, ...ns.removed]
    write(ns)
  }

  const restoreRemoved = () => {
    if (!removed.length) return
    const ns = structuredClone(state)
    removed.forEach(({ from, row }) => {
      if (from === 'await_their') ns.lists.await_their = [row, ...ns.lists.await_their]
      if (from === 'await_ours')  ns.lists.await_ours  = [row, ...ns.lists.await_ours]
    })
    ns.removed = []
    write(ns)
  }

  // ===== статусы =====
  const toOnline = () => {
    const ns = structuredClone(state)
    ns.status.mode = 'online'
    ns.status.shortUntil = undefined
    ns.status.longActive = false
    write(ns)
  }

  // Short: включаем на 2 дня (MVP), счётчик / месяц, таймер и зелёный фон
  const activateShort = () => {
    const ns = structuredClone(state)
    if (ns.status.mode === 'short') return // уже включен
    if (ns.status.shortLeft <= 0) { alert('No short absences left this month'); return }
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000
    ns.status.mode = 'short'
    ns.status.shortLeft -= 1
    ns.status.shortUntil = Date.now() + TWO_DAYS
    write(ns)
  }

  // Long: тумблер с красным фоном; 1 раз в месяц
  const toggleLong = () => {
    const ns = structuredClone(state)
    if (ns.status.mode === 'long') {
      // Stop
      ns.status.mode = 'online'
      ns.status.longActive = false
      write(ns)
      return
    }
    if (ns.status.longLeft <= 0) { alert('No long absence left this month'); return }
    ns.status.mode = 'long'
    ns.status.longLeft -= 1
    ns.status.longActive = true
    ns.status.longUsedAt = Date.now()
    write(ns)
  }

  // формат обратного таймера
  const shortCountdown = useMemo(() => {
    if (state.status.mode !== 'short' || !state.status.shortUntil) return ''
    const left = Math.max(0, state.status.shortUntil - Date.now())
    const sec  = Math.floor(left / 1000)
    const h = Math.floor(sec / 3600).toString().padStart(2, '0')
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [state])

  const tabBtn = (kind: Tab, label: string, count: number) => {
    const active = tab === kind ? 'bg-white/10' : ''
    return (
      <button onClick={() => setTab(kind)} className={`px-4 py-3 rounded-xl font-medium ${active}`}>
        {label} <span className="text-white/60">({count})</span>
      </button>
    )
  }

  const overdue = (r: Row) =>
    (tab === 'await_their' || tab === 'await_ours') && r.days >= 4

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* statuses + restore */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          className="px-4 py-2 rounded-xl bg-white/15"
          onClick={toOnline}
        >
          Online
        </button>

        <button
          onClick={activateShort}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'short' ? 'bg-green-600/30' : 'bg-white/10'} `}
          title="Short absence: up to 2 days"
        >
          {state.status.mode === 'short'
            ? `Pause · ${shortCountdown}`
            : `Short absence · ${state.status.shortLeft} left`}
        </button>

        <button
          onClick={toggleLong}
          className={`px-4 py-2 rounded-xl ${state.status.mode === 'long' ? 'bg-red-600/30' : 'bg-white/10'} `}
          title="Long absence: one per month"
        >
          {state.status.mode === 'long' ? 'Stop' : `Long absence · ${state.status.longLeft} left`}
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
        {/* LEFT CARD */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner">
            <img src={yourAvatar} alt="you" className="avatar-xl"/>
          </div></div>
          <div className="mt-5 text-center">
            <div className="font-semibold text-lg">Your name</div>
            <div className="text-sm text-white/70">@your_handle</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between"><span>Followers (site)</span><span>0</span></div>
            <div className="flex items-center justify-between"><span>Following (site)</span><span>0</span></div>
          </div>
        </aside>

        {/* CENTER LIST */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {rows.length === 0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map(r => {
              const softCross = tab === 'await_their' || tab === 'await_ours'
              return (
                <div key={r.id}
                  className={`relative flex items-center justify-between gap-4 rounded-2xl px-4 py-3 border
                    ${overdue(r) ? 'border-red-400/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
                  {/* LEFT: avatar + name/handle */}
                  <div className="flex items-center gap-3">
                    <div className="avatar-ring-sm"><div className="avatar-ring-sm-inner">
                      <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm"/>
                    </div></div>
                    <div className="leading-5">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-white/70 text-sm">{r.handle}</div>
                    </div>
                  </div>

                  {/* RIGHT: actions */}
                  <div className="flex items-center gap-2">
                    <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">Open in X</a>

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

                  {/* soft delete cross */}
                  {softCross && (
                    <button
                      onClick={() => softRemove(tab as 'await_their' | 'await_ours', r)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs"
                      title="Remove from this tab"
                    >×</button>
                  )}
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT CARD */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner">
            <img src={selectedAvatar} alt="selected" className="avatar-xl"/>
          </div></div>
          <div className="mt-5 text-center">
            <div className="font-semibold text-lg">Selected_user name</div>
            <div className="text-sm text-white/70">@selected_user</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between"><span>Followers (site)</span><span>0</span></div>
            <div className="flex items-center justify-between"><span>Following (site)</span><span>0</span></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
