export default function Page() {
  return (
    <div className="min-h-screen w-full text-white">
      <header className="sticky top-0 z-20 backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <div className="h-6 w-6 rounded-sm bg-white/10 grid place-items-center">◈</div>
            <span className="font-semibold tracking-wide">Monad</span>
          </div>
          <a href="/profile" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition">Профиль</a>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="pt-10 sm:pt-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">The Monad Fam</h1>
          <p className="mt-2 text-white/70">для тех кто ищет семью</p>
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
                  <a className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm" href="#">Пропустить</a>
                  <a className="px-3 py-2 rounded-xl text-sm" style={{background:'var(--accent)'}} href="#">Подписаться</a>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
            </article>
          ))}
        </section>

        <section className="mt-12 mb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Показать обучение</button>
          </div>
          <div className="space-y-2">
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">Как начать?</summary>
              <p className="mt-2 text-white/70">Войди через Discord и X (добавим позже), нажми Start и выбирай людей.</p>
            </details>
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">Что значит «взаимная»?</summary>
              <p className="mt-2 text-white/70">Вы подписаны друг на друга. Пока ожидаем — профиль помечен «ожидает взаимной».</p>
            </details>
            <details className="rounded-xl p-4" style={{background:'var(--card)', border:'1px solid var(--border)'}}>
              <summary className="cursor-pointer font-medium">Как работает рейтинг?</summary>
              <p className="mt-2 text-white/70">Раз в 4 дня голосуешь: выполняет человек обязательства или нет. Цвет полосы меняется.</p>
            </details>
          </div>
        </section>

        <footer className="py-10 text-center text-white/60">
          Связь: <a className="underline hover:text-white" href="https://x.com/mely_nik">@mely_nik</a>
        </footer>
      </main>
    </div>
  )
}
