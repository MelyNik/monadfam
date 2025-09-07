'use client'
import { useMemo, useState } from 'react'

type SlideUser = {
  name: string
  handle: string // с @
  avatarUrl?: string | null
}

/**
 * ВРЕМЕННО ДЛЯ ДЕМО:
 * 1) Если есть avatarUrl — используем его.
 * 2) Если есть только @handle — можно взять аватар через unavatar (неофициально).
 *    Для продакшена заменим на данные из X API после логина (users.read).
 */
function getAvatarSrc(u: SlideUser) {
  if (u.avatarUrl) return u.avatarUrl
  const h = u.handle.replace('@', '')
  return `https://unavatar.io/x/${h}` // временно! в проде будет X API
}

export default function Page() {
  // ДЕМО-пользователь карточки (позже подменим данными из бэкенда/X после авторизации)
  const user: SlideUser = useMemo(
    () => ({ name: 'Nik', handle: '@user1' }),
    []
  )

  const [started, setStarted] = useState(false)

  return (
    <div className="min-h-screen w-full text-white">
      {/* Шапка: без разделительной полосы; Profile по центру */}
      <header className="sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2 text-white/80">
            <div className="h-6 w-6 rounded-sm bg-white/10 grid place-items-center">◈</div>
            <span className="font-semibold tracking-wide">Monad</span>
          </div>
          <div className="flex justify-center">
            <a
              href="/profile"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
            >
              Profile
            </a>
          </div>
          <div />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <div className="pt-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">The Monad Fam</h1>
          <p className="mt-2 text-white/70">for those who are looking for a fam</p>
        </div>

        {/* До старта — только большая кнопка Start */}
        {!started && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setStarted(true)}
              className="px-12 py-5 text-lg rounded-2xl shadow-lg"
              style={{ background: 'var(--accent)' }}
            >
              Start
            </button>
          </div>
        )}

        {/* После Start — одна вертикальная «карта»: аватар → имя → логин → рейтинговая полоса */}
        {started && (
          <section className="mt-10 flex flex-col items-center gap-4">
            <article className="card w-full max-w-sm overflow-hidden flex flex-col items-center">
              {/* Аватар из X (круг, без кольца рейтинга) */}
              <div className="w-full flex-1 flex items-center justify-center p-8">
                {/* В продакшене src возьмём из X API (profile_image_url) */}
                <img
                  src={getAvatarSrc(user)}
                  alt={`${user.handle} avatar`}
                  className="h-40 w-40 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Имя и логин — строго по центру, одно под другим */}
              <div className="w-full px-6 pb-4 text-center">
                <div className="text-2xl font-semibold">{user.name}</div>
                <div className="text-sm text-white/70">{user.handle}</div>
              </div>

              {/* Рейтинговая полоса ТОЛЬКО под карточкой */}
              <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
            </article>

            {/* Кнопки ниже карточки */}
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">
                Skip
              </button>
              <button
                className="px-4 py-2 rounded-xl"
                style={{ background: 'var(--accent)' }}
              >
                Follow
              </button>
            </div>
          </section>
        )}

        {/* FAQ + кнопка вызова обучения (как просил — рядом) */}
        <section className="mt-14 mb-24 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Show tutorial
            </button>
          </div>
          <div className="space-y-2">
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">How do I start?</summary>
              <p className="mt-2 text-white/70">
                Sign in with Discord and X (coming next), click Start, then choose people.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">What does “mutual” mean?</summary>
              <p className="mt-2 text-white/70">
                You follow each other. Until then, the profile is marked “awaiting follow-back”.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">How does the rating work?</summary>
              <p className="mt-2 text-white/70">
                Every 4 days you vote: keeps the pact or not. The color bar changes.
              </p>
            </details>
          </div>
        </section>
      </main>
    </div>
  )
}
