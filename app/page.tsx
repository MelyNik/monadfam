'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  AppState, Row, loadState, saveState,
  peekNextFromPool, advancePool, clone, ratingPercent, resetDemoData
} from '../lib/state'

function RatingBar({ value = 50 }: { value?: number }) {
  const pct = `${Math.max(0, Math.min(100, value))}%`
  return <div className="rating-bar" style={{ ['--rating-fill' as any]: pct }} />
}

export default function HomePage() {
  const [state, setState] = useState<AppState | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  // показываем обучение только ОДИН раз (даже если пользователь закрыл не нажимая "Got it")
  useEffect(() => {
    const s = loadState()
    setState(s)
    const shownOnce = localStorage.getItem('tutorialShownOnce') === '1'
    if (!s.tutorialDone && !shownOnce) setShowTutorial(true)
  }, [])

  const candidate: Row | null = useMemo(() => {
    if (!state) return null
    return peekNextFromPool(state)
  }, [state])

  if (!state) return null
  const disabledByStatus = state.status.mode !== 'online'

  const doSkip = () => {
    const s = clone(state)
    advancePool(s)
    saveState(s)
    setState(s)
  }

  const doFollow = () => {
    if (state.status.mode !== 'online') return
    if (!candidate) return
    const s = clone(state)
    s.lists.await_their = [{ ...candidate, days: candidate.days ?? 0 }, ...s.lists.await_their]
    advancePool(s)
    saveState(s)
    setState(s)
  }

  // закрыть обучение (и больше не показывать автоматически)
  const hideTutorialForever = () => {
    const s = clone(state)
    s.tutorialDone = true
    saveState(s)
    setState(s)
    setShowTutorial(false)
    localStorage.setItem('tutorialShownOnce', '1')
  }

  const doReset = () => {
    const s = resetDemoData()
    // новая демо — можно снова показать обучение
    localStorage.removeItem('tutorialShownOnce')
    setState(s)
  }

  const rPct = candidate ? ratingPercent(candidate) : 50

  return (
    <div className="min-h-screen max-w-[1000px] mx-auto px-6 py-8 text-white">
      <button
        onClick={doReset}
        className="fixed top-5 right-6 z-50 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
      >
        Reset demo data
      </button>

      <h1 className="text-5xl font-extrabold text-center mb-2">The Monad Fam</h1>
      <p className="text-center mb-8 text-white/70">for those who are looking for a fam</p>

      <div className="card mx-auto max-w-[520px] px-8 py-8 text-center">
        {candidate ? (
          <>
            <img
              alt={candidate.handle}
              src={candidate.avatarUrl || 'https://unavatar.io/x/twitter'}
              className="mx-auto mb-4 rounded-full w-40 h-40 object-cover border-2 border-white"
            />
            <div className="text-xl font-semibold">{candidate.name}</div>
            <div className="text-white/70 mb-4">{candidate.handle}</div>

            <RatingBar value={rPct} />

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={doSkip} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Skip</button>
              <button
                onClick={doFollow}
                disabled={disabledByStatus}
                className={`px-4 py-2 rounded-xl ${disabledByStatus ? 'bg-white/10 opacity-60 cursor-not-allowed' : 'bg-[#7C5CFF] hover:bg-[#9A86FF]'}`}
              >
                Follow
              </button>
            </div>

            {disabledByStatus && (
              <div className="mt-3 text-sm text-white/60">
                You are not online now. Set status to <b>Online</b> to follow.
              </div>
            )}
          </>
        ) : (
          <div className="py-10 text-white/70">No more profiles in the demo pool.</div>
        )}
      </div>

      {/* FAQ + tutorial */}
      <div className="max-w-[900px] mx-auto mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <button onClick={() => setShowTutorial(true)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">
            Show tutorial
          </button>
        </div>

        <details className="card p-4 mb-2"><summary>How do I start?</summary><div className="mt-2 text-sm text-white/80">Press Follow or Skip. Follow moves a profile to your “Waiting for our follow”.</div></details>
        <details className="card p-4 mb-2"><summary>What does “mutual” mean?</summary><div className="mt-2 text-sm text-white/80">It means you both follow each other.</div></details>
        <details className="card p-4 mb-2"><summary>How does the rating work?</summary><div className="mt-2 text-sm text-white/80">A demo bar showing community rating.</div></details>
      </div>

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[92%] max-w-[520px] rounded-2xl border border-white/10 bg-[rgba(10,10,16,0.96)] p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Quick tutorial</h3>
            <ol className="list-decimal pl-6 space-y-2 text-white/90">
              <li>Press <b>Follow</b> to add a person to “Waiting for our follow”.</li>
              <li>Press <b>Skip</b> to see the next person.</li>
              <li>Open your <b>Profile</b> to manage lists, statuses, and voting.</li>
            </ol>
            <div className="mt-5 flex gap-2 justify-end">
              <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15" onClick={hideTutorialForever}>Close</button>
              <button className="px-3 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#9A86FF]" onClick={hideTutorialForever}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
