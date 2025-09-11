'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''
  const isProfile = pathname?.startsWith('/profile')

  return (
    <>
      {/* ЛЕВО */}
      <div className="fixed top-4 left-6 z-50">
        {isHome ? (
          // На главной слева — ПРОСТО надпись + символ (НЕ кнопка)
          <div className="flex items-center gap-2 text-white/85">
            <span aria-hidden className="inline-block w-3 h-3 rounded-sm bg-white/30" />
            <span className="font-semibold">Monad</span>
          </div>
        ) : (
          // На профиле слева — КНОПКА "Monad" (возврат на главную)
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/90"
          >
            Monad
          </Link>
        )}
      </div>

      {/* ЦЕНТР */}
      {!isProfile && isHome && (
        // На главной вверху — одна кнопка "Profile"
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/90"
          >
            Profile
          </Link>
        </div>
      )}
      {/* На странице профиля верхней центральной кнопки НЕТ */}
    </>
  )
}
