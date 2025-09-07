'use client'
import { useMemo, useState } from 'react'

type Flag = 'red' | undefined
type Row = {
  id: number
  name: string
  handle: string
  days: number
  score: number
  avatarUrl?: string
  flag?: Flag
}

const seedMutual: Row[] = [
  { id: 1, name: 'name', handle: '@alice', days: 0, score: 92, avatarUrl: 'https://unavatar.io/x/alice' },
  { id: 2, name: 'name', handle: '@bob',   days: 0, score: 88, avatarUrl: 'https://unavatar.io/x/bob'   },
]
const seedAwaitTheir: Row[] = [
  { id: 3, name: 'name', handle: '@carol', days: 2, score: 75, avatarUrl: 'https://unavatar.io/x/carol' },
  { id: 4, name: 'name', handle: '@dave',  days: 5, score: 40, avatarUrl: 'https://unavatar.io/x/dave'  },
]
const seedAwaitOurs: Row[] = [
  { id: 5, name: 'name', handle: '@erin',  days: 1, score: 83, avatarUrl: 'https://unavatar.io/x/erin'  },
  { id: 6, name: 'name', handle: '@frank', days: 6, score: 30, avatarUrl: 'https://unavatar.io/x/frank' },
]

const yourAvatar     = 'https://unavatar.io/x/your_handle'
const selectedAvatar = 'https://unavatar.io/x/selected_user'

type Tab = 'mutual' | 'await_their' | 'await_ours'

export default function ProfilePage() {
  // statuses (счётчики просто для вида)
  const [shortLeft]        = useState(4)
  const [longLeft]         = useState(1)
  const [longCooldownDays] = useState(27)
  const [siteFollowers]    = useState(0)
  const [siteFollowing]    = useState(0)

  // основные списки
  const [mutual,      setMutual]      = useState<Row[]>(seedMutual)
  const [awaitTheir,  setAwaitTheir]  = useState<Row[]>(seedAwaitTheir)
  const [awaitOurs,   setAwaitOurs]   = useState<Row[]>(seedAwaitOurs)

  // мягко удалённые строки (для восстановления)
  const [removed, setRemoved] = useState<Array<{ from: 'await_their' | 'await_ours', row: Row }>>([])

  const [tab, setTab] = useState<Tab>('mutual')

  // поиск
  const [q, setQ] = useState('')
  const norm = (s: string) => s.toLowerCase().replace(/^@/, '')
  const match = (r: Row) => norm(r.handle).includes(norm(q)) || norm(r.name).includes(norm(q))

  const counts = { mutual: mutual.length, await_their: awaitTheir.length, await_ours: awaitOurs.length }

  const rows = useMemo(() => {
    const list = tab === 'mutual' ? mutual : tab === 'await_their' ? awaitTheir : awaitOurs
    return list.filter(match)
  }, [tab, mutual, awaitTheir, awaitOurs, q])

  // --- helpers ---
  const confirm = (msg = 'Confirm your choice?') => window.confirm(msg)

  // Following each other → Unfollow
  const unfollowFromMutual = (r: Row) => {
    if (!confirm()) return
    setMutual(prev => prev.filter(x => x.id !== r.id))
    // у нас: он остаётся на нас → мы видим его в "Waiting for our follow" с красным
    setAwaitOurs(prev => [{ ...r, flag: 'red' }, ...prev])
  }

  // Waiting for their follow-back → Unfollow (просто скрываем у себя)
  const unfollowFromAwaitTheir = (r: Row) => {
    if (!confirm()) return
    setAwaitTheir(prev => prev.filter(x => x.id !== r.id))
  }

  // Waiting for our follow → Follow (становимся взаимными)
  const followFromAwaitOurs = (r: Row) => {
    setAwaitOurs(prev => prev.filter(x => x.id !== r.id))
    setMutual(prev => [{ ...r, flag: undefined, days: 0 }, ...prev])
  }

  // Waiting for our follow → Decline (исчезает у нас)
  const declineFromAwaitOurs = (r: Row) => {
    if (!confirm()) return
    setAwaitOurs(prev => prev.filter(x => x.id !== r.id))
  }

  // крестики: мягкое скрытие из «их фоллоу-бэк» и «нашего фоллоу»
  const softRemove = (from: 'await_their' | 'await_ours', r: Row) => {
    if (!confirm()) return
    if (from === 'await_their') setAwaitTheir(prev => prev.filter(x => x.id !== r.id))
    if (from === 'await_ours')  setAwaitOurs(prev  => prev.filter(x => x.id !== r.id))
    setRemoved(prev => [{ from, row: r }, ...prev])
  }

  const restoreRemoved = () => {
    if (removed.length === 0) return
    // возвращаем в те же вкладки
    removed.forEach(({ from, row }) => {
      if (from === 'await_their') setAwaitTheir(prev => [row, ...prev])
      if (from === 'await_ours')  setAwaitOurs(prev  => [row, ...prev])
    })
    setRemoved([])
  }

  // табы
  const tabBtn = (kind: Tab, label: string, count: number) => {
    const active = tab === kind ? 'bg-white/10' : ''
    return (
      <button onClick={() => setTab(kind)} className={`px-4 py-3 rounded-xl font-medium ${active}`}>
        {label} <span className="text-white/60">({count})</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* statuses + restore */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Short absence · {shortLeft > 0 ? `${shortLeft} left` : 'available in 1d'}
        </button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Long absence · {longLeft > 0 ? `${longLeft} left` : `${longCooldownDays}d`}
        </button>

        <div className="grow" />
        <button
          onClick={restoreRemoved}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"
          title="Return profiles you removed with the small cross"
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by @handle or name"
            className="input w-full"
          />
        </div>
      </div>

      {/* THREE COLUMNS: left fixed, center flexible, right fixed */}
      <div className="flex gap-8 items-start">
        {/* LEFT CARD */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner">
            <img src={yourAvatar} alt="you" className="avatar-xl" />
          </div></div>
          <div className="mt-5 text-center">
            <div className="font-semibold text-lg">Your name</div>
            <div className="text-sm text-white/70">@your_handle</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between"><span>Followers (site)</span><span>{siteFollowers}</span></div>
            <div className="flex items-center justify-between"><span>Following (site)</span><span>{siteFollowing}</span></div>
          </div>
        </aside>

        {/* CENTER LIST */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {rows.length === 0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map((r) => {
              const overdue = r.days >= 4 || r.flag === 'red'
              const softCross = tab === 'await_their' || tab === 'await_ours'
              return (
                <div
                  key={r.id}
                  className={`relative flex items-center justify-between gap-4 rounded-2xl px-4 py-3 border
                    ${overdue ? 'border-red-400/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  {/* LEFT: avatar + name/handle (слева вплотную) */}
                  <div className="flex items-center gap-3">
                    <div className="avatar-ring-sm"><div className="avatar-ring-sm-inner">
                      <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm" />
                    </div></div>
                    <div className="leading-5">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-white/70 text-sm">{r.handle}</div>
                    </div>
                  </div>

                  {/* RIGHT: actions */}
                  <div className="flex items-center gap-2">
                    <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">
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

                  {/* soft delete cross for two tabs */}
                  {softCross && (
                    <button
                      onClick={() => softRemove(tab as 'await_their' | 'await_ours', r)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs"
                      title="Remove from this tab"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT CARD */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner">
            <img src={selectedAvatar} alt="selected" className="avatar-xl" />
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
