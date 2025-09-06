export default function ProfilePage() {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">Short absence</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">Long absence</button>
      </div>

      <div className="flex gap-4 text-white/80 mb-4">
        <span>Mutual: 0</span>
        <span>Awaiting mutual: 0</span>
        <span>Total: 0</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
          <h2 className="font-semibold mb-3">Mutual</h2>
          <p className="text-white/60">Nothing yet.</p>
        </section>
        <section className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
          <h2 className="font-semibold mb-3">Awaiting mutual</h2>
          <p className="text-white/60">Nothing yet.</p>
        </section>
      </div>
    </div>
  )
}
