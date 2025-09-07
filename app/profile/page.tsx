'use client'
import { useMemo, useState } from 'react'

type Row = { id:number; handle:string; days:number; score:number }

const seedMutual: Row[] = [
  {id:1, handle:'@alice', days:0, score:92},
  {id:2, handle:'@bob', days:0, score:88},
]
const seedAwaitTheir: Row[] = [
  {id:3, handle:'@carol', days:2, score:75},
  {id:4, handle:'@dave', days:5, score:40},
]
const seedAwaitOurs: Row[] = [
  {id:5, handle:'@erin', days:1, score:83},
  {id:6, handle:'@frank', days:6, score:30},
]

export default function ProfilePage(){
  const [shortLeft] = useState(4)
  const [longLeft] = useState(1)
  const [longCooldownDays] = useState(27)

  const [siteFollowers] = useState(0)
  const [siteFollowing] = useState(0)

  const [mutual,setMutual] = useState<Row[]>(seedMutual)
  const [awaitTheir,setAwaitTheir] = useState<Row[]>(seedAwaitTheir)
  const [awaitOurs,setAwaitOurs] = useState<Row[]>(seedAwaitOurs)

  type Tab = 'mutual'|'await_their'|'await_ours'
  const [tab,setTab] = useState<Tab>('mutual')

  const [q,setQ] = useState('')
  const norm = (s:string)=>s.toLowerCase().replace(/^@/,'')
  const matches = (h:string)=> norm(h).includes(norm(q))

  const counts = {
    mutual: mutual.length,
    await_their: awaitTheir.length,
    await_ours: awaitOurs.length,
  }

  const rows = useMemo(()=>{
    const list = tab==='mutual'?mutual: tab==='await_their'?awaitTheir:awaitOurs
    return list.filter(r=>matches(r.handle))
  },[tab, mutual, awaitTheir, awaitOurs, q])

  const unfollowFromMutual = (r:Row)=>{
    setMutual(prev=>prev.filter(x=>x.id!==r.id))
    setAwaitOurs(prev=>[{...r, days:0}, ...prev])
  }
  const declineFromAwaitOurs = (r:Row)=>{
    setAwaitOurs(prev=>prev.filter(x=>x.id!==r.id))
  }
  const unfollowFromAwaitTheir = (r:Row)=>{
    setAwaitTheir(prev=>prev.filter(x=>x.id!==r.id))
  }

  const Ring = ({size}:{size:number})=>(
    <div className="ring-grad p-[3px] rounded-full" style={{width:size, height:size}}>
      <div className="w-full h-full rounded-full bg-white/10" />
    </div>
  )

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Short absence · {shortLeft>0?`${shortLeft} left`:'available in 1d'}
        </button>
        <button className="px-4 py-2 rounded-xl bg-white/10">
          Long absence · {longLeft>0?`${longLeft} left`:`${longCooldownDays}d`}
        </button>
      </div>

      <div className="card p-2 mb-3">
        <div className="grid md:grid-cols-3 gap-2">
          <button onClick={()=>setTab('mutual')} className={`px-4 py-3 rounded-xl font-medium ${tab==='mutual'?'bg-white/10':''}`}>
            Following each other <span className="text-white/60">({counts.mutual})</span>
          </button>
          <button onClick={()=>setTab('await_their')} className={`px-4 py-3 rounded-xl font-medium ${tab==='await_their'?'bg-white/10':''}`}>
            Awaiting follow-back <span className="text-white/60">({counts.await_their})</span>
          </button>
          <button onClick={()=>setTab('await_ours')} className={`px-4 py-3 rounded-xl font-medium ${tab==='await_ours'?'bg-white/10':''}`}>
            Waiting for our follow <span className="text-white/60">({counts.await_ours})</span>
          </button>
        </div>
        <div className="mt-3">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by @handle or name" className="input w-full" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <aside className="card p-5 flex flex-col items-center">
          <Ring size={220} />
          <div className="mt-5 w-full text-center">
            <div className="font-semibold">@your_handle</div>
            <div className="text-sm text-[var(--muted)]">Your X profile (preview)</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between">
              <span>Followers (site)</span>
              <span className="flex items-center gap-2">{siteFollowers} <button className="underline">Refresh</button></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Following (site)</span>
              <span className="flex items-center gap-2">{siteFollowing} <button className="underline">Refresh</button></span>
            </div>
          </div>
        </aside>

        <main className="card p-3">
          <div className="max-h-[60vh] overflow-auto space-y-3 pr-1">
            {rows.length===0 && <div className="text-white/60 p-3">Nothing found.</div>}
            {rows.map(r=>{
              const overdue = r.days>=4
              return (
                <div key={r.id} className={`flex items-center justify-between rounded-xl p-3 ${overdue?'bg-red-500/10':'bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="ring-grad p-[2px] rounded-full">
                      <div className="h-10 w-10 rounded-full bg-white/10" />
                    </div>
                    <div className="font-medium">{r.handle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="btn bg-white/10 hover:bg-white/15 text-sm" href="#">Open in X</a>
                    {tab==='mutual' && <button onClick={()=>unfollowFromMutual(r)} className="btn bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>}
                    {tab==='await_ours' && <button onClick={()=>declineFromAwaitOurs(r)} className="btn bg-white/10 hover:bg-white/15 text-sm">Decline</button>}
                    {tab==='await_their' && <button onClick={()=>unfollowFromAwaitTheir(r)} className="btn bg-white/10 hover:bg-white/15 text-sm">Unfollow</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        <aside className="card p-5 flex flex-col items-center">
          <Ring size={220} />
          <div className="mt-5 w-full text-center">
            <div className="font-semibold">@selected_user</div>
            <div className="text-sm text-[var(--muted)]">Selected user (preview)</div>
          </div>
          <div className="mt-6 w-full space-y-3 text-white/80">
            <div className="flex items-center justify-between">
              <span>Followers (site)</span>
              <span className="flex items-center gap-2">0 <button className="underline">Refresh</button></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Following (site)</span>
              <span className="flex items-center gap-2">0 <button className="underline">Refresh</button></span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
