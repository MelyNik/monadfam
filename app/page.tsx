'use client'
import { useMemo, useState } from 'react'
import { AppState, Row, loadState, saveState, takeNextFromPool, advancePool, clone, peekNextFromPool, ratingPercent } from '../lib/state'

function RatingBar({ value = 100 }: { value?: number }) {
  const pct = `${Math.max(0, Math.min(100, value))}%`
  return <div className="rating-bar" style={{ ['--rating-fill' as any]: pct }} />
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => loadState())
  const write = (ns: AppState) => { saveState(ns); setState(ns) }

  const candidate: Row | null = useMemo(() => {
    if (!state) return null
    return peekNextFromPool(state)
  }, [state])

  const canFollow = !!candidate && (candidate.statusMode ?? 'online') === 'online'

  const onSkip = () => { const ns = clone(state); advancePool(ns); write(ns) }
  const onFollow = () => {
    if (!candidate) return
    const ns = clone(state)
    // добавляем в await_their
    ns.lists.await_their = [candidate, ...ns.lists.await_their]
    advancePool(ns)
    write(ns)
  }

  const rating = candidate ? ratingPercent(candidate) : 100

  return (
    <main className="min-h-screen max-w-[960px] mx-auto px-6 py-8 text-white">
      <div className="card p-8 flex flex-col items-center">
        <div className="avatar-ring-xl" style={{ ['--ring-color' as any]: '#22c55e' }}>
          <div className="avatar-ring-xl-inner">
            <img
              src={candidate?.avatarUrl || 'https://unavatar.io/x/twitter'}
              alt={candidate?.handle || 'candidate'}
              className="avatar-xl"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-2xl font-semibold">{candidate?.name || '—'}</div>
          <div className="text-white/70">@{(candidate?.handle || '').replace(/^@/,'')}</div>
        </div>

        <div className="mt-6 w-full">
          <RatingBar value={rating} />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onSkip} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Skip</button>
          <button disabled={!canFollow} onClick={onFollow} className="px-4 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#9A86FF] disabled:opacity-50">Follow</button>
        </div>
      </div>
    </main>
  )
}
