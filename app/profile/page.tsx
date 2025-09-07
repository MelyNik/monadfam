'use client'
import { useMemo, useState } from 'react'

type Row = {
  id: number
  name: string
  handle: string // с @
  days: number
  score: number
  avatarUrl?: string
}

/* демо-данные (картинки пока через unavatar; позже подставим из X/нашего CDN) */
const seedMutual: Row[] = [
  { id: 1, name: 'name', handle: '@alice', days: 0, score: 92, avatarUrl: 'https://unavatar.io/x/alice' },
  { id: 2, name: 'name', handle: '@bob',   days: 0, score: 88, avatarUrl: 'https://unavatar.io/x/bob' },
]
const seedAwaitTheir: Row[] = [
  { id: 3, name: 'name', handle: '@carol', days: 2, score: 75, avatarUrl: 'https://unavatar.io/x/carol' },
  { id: 4, name: 'name', handle: '@dave',  days: 5, score: 40, avatarUrl: 'https://unavatar.io/x/dave'  },
]
const seedAwaitOurs: Row[] = [
  { id: 5, name: 'name', handle: '@erin',  days: 1, score: 83, avatarUrl: 'https://unavatar.io/x/erin'  },
  { id: 6, name: 'name', handle: '@frank', days: 6, score: 30, avatarUrl: 'https://unavatar.io/x/frank' },
]

const yourAvatar = 'https://unavatar.io/x/your_handle'
const selectedAvatar = 'https://unavatar.io/x/selected_user'

export default function ProfilePage() {
  const [shortLeft] = useState(4)
  const [longLeft] = useState(1)
  const [longCooldownDays] = useState(27)

  const [siteFollowers] = useState(0)
  const [siteFollowing] = useState(0)

  const [mutual, setMutual] = useState<Row[]>(seedMutual)
  const [awaitTheir, setAwaitTheir] = useState<Row[]>(seedAwaitTheir)
  const [awaitOurs, setAwaitOurs] = useState<Row[]>(seedAwaitOurs)

  type Tab = 'mutual' | 'await_their' | 'await_ours'
  const [tab, setTab] = useState<Tab>('mutual')

  const [q, setQ] = useState('')
  const norm = (s: string) => s.toLowerCase().replace(/^@/, '')
  const matches = (r: Row) => norm(r.handle).includes(norm(q)) || norm(r.name).includes(norm(q))

  const counts = { mutual: mutual.length, await_their: awaitTheir.length, await_ours: awaitOurs.length }

  const rows = useMemo(() => {
    const list = tab === 'mutual' ? mutual : tab === 'await_their' ? awaitTheir : awaitOurs
    return list.filter(matches)
  }, [tab, mutual, awaitTheir, awaitOurs, q])

  const unfollowFromMutual = (r: Row) => {
    setMutual(prev => prev.filter(x => x.id !== r.id))
    setAwaitOurs(prev => [{ ...r, days: 0 }, ...prev])
  }
  const declineFromAwaitOurs = (r: Row) => setAwaitOurs(prev => prev.filter(x => x.id !== r.id))
  const unfollowFromAwaitTheir = (r: Row) => setAwaitTheir(prev => prev.filter(x => x.id !== r.id))

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* статусы */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Short absence · {shortLeft > 0 ? `${shortLeft} left` : 'available in 1d'}
        </button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Long absence · {longLeft > 0 ? `${longLeft} left` : `${longCooldownDays}d`}
        </button>
      </div>

      {/* вкладки + поиск */}
      <div className="card p-2 mb-4">
        <div className="grid md:grid-cols-3 gap-2">
          <button onClick={() => setTab('mutual')} className={`px-4 py-3 rounded-xl font-medium ${tab === 'mutual' ? 'bg-white/10' : ''}`}>
            Following each other <span className="text-white/60">({counts.mutual})</span>
          </button>
          <button onClick={() => setTab('await_their')} className={`px-4 py-3 rounded-xl font-medium ${tab === 'await_their' ? 'bg-white/10' : ''}`}>
            Awaiting follow-back <span className="text-white/60">({counts.await_their})</span>
          </button>
          <button onClick={() => setTab('await_ours')} className={`px-4 py-3 rounded-xl font-medium ${tab === 'await_ours' ? 'bg-white/10' : ''}`}>
            Waiting for our follow <span className="text-white/60">({counts.await_ours})</span>
          </button>
        </div>
        <div className="mt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by @handle or name" className="input w-full" />
        </div>
      </div>

      {/* три колонки: большой аватар — список — большой аватар */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT big card */}
        <aside className="card p-5 flex flex-col items-center">
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

        {/* CENTER list — длинные строки, имя/@ по центру */}
        <main className="card p-3">
          <div className="max-h-[60vh] overflow-auto space-y-3 pr-1">
            {rows.length === 0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map((r) => {
              const overdue = r.days >= 4
              return (
                <div
                  key={r.id}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl p-3 ${overdue ? 'bg-red-500/10' : 'bg-white/5'}`}
                >
                  {/* маленький аватар слева с тонким кольцом */}
                  <div className="justify-self-start">
                    <div className="avatar-ring-sm"><div className="avatar-ring-sm-inner">
                      <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm" />
                    </div></div>
                  </div>

                  {/* имя и @логин — СТРОГО по центру строки */}
                  <div className="text-center">
                    <div className="font-semibold leading-5">{r.name}</div>
                    <div className="text-white/70 text-sm">{r.handle}</div>
                  </div>

                  {/* действия справа */}
                  <div className="justify-self-end flex items-center gap-2">
                    <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">Open in X</a>
                    {tab === 'mutual' && (
                      <button onClick={() => unfollowFromMutual(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>
                    )}
                    {tab === 'await_ours' && (
                      <button onClick={() => declineFromAwaitOurs(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Decline</button>
                    )}
                    {tab === 'await_their' && (
                      <button onClick={() => unfollowFromAwaitTheir(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT big card */}
        <aside className="card p-5 flex flex-col items-center">
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
