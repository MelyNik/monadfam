'use client'
import { useState } from 'react'
export default function Page(){
  const [started,setStarted]=useState(false)
  return (
    <div className="min-h-screen w-full text-white">
      <header className="sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2 text-white/80">
            <div className="h-6 w-6 rounded-sm bg-white/10 grid place-items-center">◈</div>
            <span className="font-semibold tracking-wide">Monad</span>
          </div>
          <div className="flex justify-center">
            <a href="/profile" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition">Profile</a>
          </div>
          <div />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4">
        <div className="pt-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">The Monad Fam</h1>
          <p className="mt-2 text-white/70">for those who are looking for a fam</p>
        </div>
        {!started && (
          <div className="mt-10 flex justify-center">
            <button onClick={()=>setStarted(true)} className="px-10 py-4 text-lg rounded-2xl shadow-lg" style={{background:'var(--accent)'}}>Start</button>
          </div>
        )}
        {started && (
          <section className="mt-10 flex justify-center">
            <article className="card w-full max-w-2xl overflow-hidden">
              <div className="p-6 flex items-center gap-5">
                <div className="h-24 w-24 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="text-2xl font-semibold">@user1</div>
                  <div className="text-sm text-white/60 mt-1">Monad • X/Twitter</div>
                </div>
                <div className="flex gap-3">
                  <a className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15" href="#">Skip</a>
                  <a className="px-4 py-2 rounded-xl" style={{background:'var(--accent)'}} href="#">Follow</a>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
            </article>
          </section>
        )}
      </main>
    </div>
  )
}
