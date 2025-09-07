export default function Page() {
  return (
    <div className="min-h-screen w-full text-white">
      <header className="sticky top-0 z-20 backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <div className="h-6 w-6 rounded-sm bg-white/10 grid place-items-center">◈</div>
            <span className="font-semibold tracking-wide">Monad</span>
          </div>
          <a href="/profile" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition">Profile</a>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="pt-10 sm:pt-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">The Monad Fam</h1>
          <p className="mt-2 text-white/70">for those who are looking for a fam</p>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-8 py-3 rounded-2xl" style={{background:'var(--accent)'}}>
            Start
          </button>
        </div>

        <section className="mt-10 grid sm:grid-cols-2 gap-6">
          {[1,2,3,4].map((i) => (
            <article key={i} className="rounded-2xl overflow-hidden" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <div className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="font-semibold">@user{i}</div>
                  <div className="text-sm text-white/60">Monad • X/Twitter</div>
                </div>
                <div className="flex gap-2">
                  <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">Skip</a>
                  <a className="px-3 py-2 rounded-xl text-sm" style={{background:'var(--accent)'}} href="#">Follow</a>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
            </article>
          ))}
        </section>

        <section className="mt-12 mb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Show tutorial</button>
          </div>
          <div className="space-y-2">
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">How do I start?</summary>
              <p className="mt-2 text-white/70">Sign in with Discord and X (we’ll add it next), click Start, then choose people.</p>
            </details>
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">What does “mutual” mean?</summary>
              <p className="mt-2 text-white/70">You follow each other. Until then, the profile is marked “awaiting mutual”.</p>
            </details>
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">How does the rating work?</summary>
              <p className="mt-2 text-white/70">Every 4 days you vote: does a person keep the pact or not. The color bar changes.</p>
            </details>
          </div>
        </section>

        <footer className="py-10 text-center text-white/60">
          Contact: <a className="underline hover:text-white" href="https://x.com/mely_nik">@mely_nik</a>
        </footer>
      </main>
    </div>
  )
}
