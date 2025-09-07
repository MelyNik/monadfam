'use client'
import { useMemo, useState } from 'react'

type Row = { id:number; name:string; handle:string; days:number; score:number; avatarUrl?:string }

const seedMutual: Row[] = [
  { id:1, name:'name', handle:'@alice', days:0, score:92, avatarUrl:'https://unavatar.io/x/alice' },
  { id:2, name:'name', handle:'@bob',   days:0, score:88, avatarUrl:'https://unavatar.io/x/bob' },
]
const seedAwaitTheir: Row[] = [
  { id:3, name:'name', handle:'@carol', days:2, score:75, avatarUrl:'https://unavatar.io/x/carol' },
  { id:4, name:'name', handle:'@dave',  days:5, score:40, avatarUrl:'https://unavatar.io/x/dave'  },
]
const seedAwaitOurs: Row[] = [
  { id:5, name:'name', handle:'@erin',  days:1, score:83, avatarUrl:'https://unavatar.io/x/erin'  },
  { id:6, name:'name', handle:'@frank', days:6, score:30, avatarUrl:'https://unavatar.io/x/frank' },
]

const yourAvatar='https://unavatar.io/x/your_handle'
const selectedAvatar='https://unavatar.io/x/selected_user'

export default function ProfilePage(){
  const [shortLeft]=useState(4)
  const [longLeft]=useState(1)
  const [longCooldownDays]=useState(27)
  const [siteFollowers]=useState(0)
  const [siteFollowing]=useState(0)

  const [mutual,setMutual]=useState<Row[]>(seedMutual)
  const [awaitTheir,setAwaitTheir]=useState<Row[]>(seedAwaitTheir)
  const [awaitOurs,setAwaitOurs]=useState<Row[]>(seedAwaitOurs)

  type Tab='mutual'|'await_their'|'await_ours'
  const [tab,setTab]=useState<Tab>('mutual')

  const [q,setQ]=useState('')
  const norm=(s:string)=>s.toLowerCase().replace(/^@/,'')
  const matches=(r:Row)=> norm(r.handle).includes(norm(q)) || norm(r.name).includes(norm(q))

  const counts={mutual:mutual.length, await_their:awaitTheir.length, await_ours:awaitOurs.length}

  const rows=useMemo(()=>{
    const list = tab==='mutual'?mutual: tab==='await_their'?awaitTheir:awaitOurs
    return list.filter(matches)
  },[tab,mutual,awaitTheir,awaitOurs,q])

  const unfollowFromMutual=(r:Row)=>{ setMutual(p=>p.filter(x=>x.id!==r.id)); setAwaitOurs(p=>[{...r,days:0},...p]) }
  const declineFromAwaitOurs=(r:Row)=> setAwaitOurs(p=>p.filter(x=>x.id!==r.id))
  const unfollowFromAwaitTheir=(r:Row)=> setAwaitTheir(p=>p.filter(x=>x.id!==r.id))

  const tabBtn = (kind:Tab, label:string, count:number) => {
    const active = tab===kind ? 'bg-white/10' : ''
    return (
      <button onClick={()=>setTab(kind)} className={`px-4 py-3 rounded-xl font-medium ${active}`}>
        {label} <span className="text-white/60">({count})</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* statuses */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Short absence · {shortLeft>0?`${shortLeft} left`:'available in 1d'}
        </button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Long absence · {longLeft>0?`${longLeft} left`:`${longCooldownDays}d`}
        </button>
      </div>

      {/* tabs + search */}
      <div className="card p-2 mb-4">
        <div className="grid md:grid-cols-3 gap-2">
          {tabBtn('mutual','Following each other',counts.mutual)}
          {tabBtn('await_their','Awaiting follow-back',counts.await_their)}
          {tabBtn('await_ours','Waiting for our follow',counts.await_ours)}
        </div>
        <div className="mt-3">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by @handle or name" className="input w-full"/>
        </div>
      </div>

      {/* LAYOUT: flex with fixed side columns (340px) and wide center */}
      <div className="flex gap-8 items-start">
        {/* LEFT FIXED CARD */}
        <aside className="card p-5 flex-shrink-0 w-[360px] flex flex-col items-center">
          <div className="avatar-ring-xl"><div className="avatar-ring-xl-inner">
            <img src={yourAvatar} alt="you" className="avatar-xl"/>
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

        {/* CENTER — flexible, long rows */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {rows.length===0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map(r=>{
              const overdue = r.days>=4
              return (
                <div key={r.id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl px-4 py-3 border ${overdue?'border-red-400/30 bg-red-500/10':'border-white/10 bg-white/5'}`}>
                  {/* avatar */}
                  <div className="justify-self-start">
                    <div className="avatar-ring-sm"><div className="avatar-ring-sm-inner">
                      <img src={r.avatarUrl || 'https://unavatar.io/x/twitter'} alt={r.handle} className="avatar-sm"/>
                    </div></div>
                  </div>
                  {/* centered name/handle */}
                  <div className="text-center">
                    <div className="font-semibold leading-5">{r.name}</div>
                    <div className="text-white/70 text-sm">{r.handle}</div>
                  </div>
                  {/* actions */}
                  <div className="justify-self-end flex items-center gap-2">
                    <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">Open in X</a>
                    {tab==='mutual' && <button onClick={()=>unfollowFromMutual(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>}
                    {tab==='await_ours' && <button onClick={()=>declineFromAwaitOurs(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Decline</button>}
                    {tab==='await_their' && <button onClick={()=>unfollowFromAwaitTheir(r)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* RIGHT FIXED CARD */}
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
