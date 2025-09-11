'use client'
import { useMemo, useState } from 'react'
import { AppState, Row, loadState, saveState, takeNextFromPool, advancePool, clone, peekNextFromPool, ratingPercent, ratingColor } from '../lib/state'

function RatingBar({ value = 100 }: { value?: number }) {
  const pct = `${Math.max(0, Math.min(100, value))}%`
  // на 100% — полностью зелёная, по мере падения краснеет справа
  return <div className="rating-bar" style={{ ['--rating-fill' as any]: pct }} />
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => loadState())
  const write = (ns: AppState) => { saveState(ns); setState(ns) }

  const candidate: Row | null = useMemo(() => peekNextFromPool(state), [state])

  const onSkip = () => { const ns = clone(state); advancePool(ns); write(ns) }
  const onFollow = () => {
    if (!candidate) return
    const ns = clone(state)
    // добавляем в await_their, как было
    ns.lists.await_their = [candidate, ...ns.lists.await_their]
    advancePool(ns)
    write(ns)
  }

  const rating = candidate ? ratingPercent(candidate) : 100

  return (
    <main className="min-h-screen max-w-[960px] mx-auto px-6 py-8 text-white">
      <div className="card p-8 flex flex-col items-center">
        {/* кольцо можно тоже красить от рейтинга, на старте будет зелёным */}
        <div className="avatar-ring-xl" style={{ background: candidate ? ratingColor(candidate) : '#22c55e' }}>
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
          <div className="text-white/70">{candidate?.handle || '—'}</div>
        </div>

        <div className="mt-6 w-full">
          <RatingBar value={rating} />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onSkip} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Skip</button>
          <button onClick={onFollow} className="px-4 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#9A86FF]">Follow</button>
        </div>
      </div>
    </main>
  )
}
