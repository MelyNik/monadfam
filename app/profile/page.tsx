export default function ProfilePage() {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Профиль</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-white/15">Online</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">Краткое отсутствие</button>
        <button className="px-4 py-2 rounded-xl bg-white/10">Долгое отсутствие</button>
      </div>

      <div className="flex gap-4 text-white/80 mb-4">
        <span>Взаимные: 0</span>
        <span>Ожидают взаимки: 0</span>
        <span>Всего: 0</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
          <h2 className="font-semibold mb-3">Взаимные</h2>
          <p className="text-white/60">Пока пусто.</p>
        </section>
        <section className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
          <h2 className="font-semibold mb-3">Ожидают взаимки</h2>
          <p className="text-white/60">Пока пусто.</p>
        </section>
      </div>
    </div>
  )
}
