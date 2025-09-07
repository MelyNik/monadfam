'use client'
import { useEffect, useMemo, useState } from 'react'
import { AppState, Row, loadState, saveState, takeNextFromPool, advancePool } from '../lib/state'

function RatingBar() {
  return (
    <div className="h-2 rounded-full"
      style={{ background: 'linear-gradient(90deg,#22c55e,#eab308,#ef4444)' }} />
  )
}

export default function HomePage() {
  const [state, setState] = useState<AppState | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  // load from localStorage
  useEffect(() => {
    const s = loadState()
    setState(s)
    if (!s.tutorialDone) setShowTutorial(true)
  }, [])

  const candidate: Row | null = useMemo(() => {
    if (!state) return null
    const s = structuredClone(state)
    return takeNextFromPool(s)
  }, [state])

  if (!state) return null

  const disabledByStatus = state.status.mode !== 'online'

  const doSkip = () => {
    const s = structuredClone(state)
    advancePool(s)
    saveState(s)
    setState(s)
  }

  const doFollow = () => {
    if (!candidate) return
    const s = structuredClone(state)
    // отправляем в «Waiting for our follow»
    s.lists.await_ours = [{ ...candidate, days: 0 }, ...s.lists.await_ours]
    advancePool(s)
    saveState(s)
    setState(s)
  }

  const markTutorialDone = () => {
    const s = structuredClone(state)
    s.tutorialDone = true
    saveState(s)
    setState(s)
    setShowTutorial(false)
  }

  return (
    <div className="min-h-screen max-w-[1000px] mx-auto px-6 py-8 text-white">
      <h1 className="text-5xl font-extrabold text-center mb-2">The Monad Fam</h1>
      <p className="text-center mb-8 text-white/70">for those who are looking for a fam</p>

      {/* карточка по центру */}
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
            <RatingBar />

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={doSkip} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">
                Skip
              </button>
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
        <details className="card p-4 mb-2"><summary>How does the rating work?</summary><div className="mt-2 text-sm text-white/80">Later we’ll add community voting. For now it’s a demo bar.</div></details>
      </div>

      {/* Tutorial overlay */}
      {showTutorial && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="w-[92%] max-w-[520px] rounded-2xl border border-white/10 bg-[rgba(10,10,16,0.96)] p-6 shadow-2xl">
      <h3 className="text-2xl font-bold mb-2">Quick tutorial</h3>
      <ol className="list-decimal pl-6 space-y-2 text-white/90">
        <li>Press <b>Follow</b> to add a person to “Waiting for our follow”.</li>
        <li>Press <b>Skip</b> to see the next person.</li>
        <li>Open your <b>Profile</b> to manage lists and statuses.</li>
      </ol>
      <div className="mt-5 flex gap-2 justify-end">
        <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15" onClick={() => setShowTutorial(false)}>Close</button>
        <button className="px-3 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#9A86FF]" onClick={markTutorialDone}>Got it</button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
