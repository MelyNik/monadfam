'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const onProfile = pathname.startsWith('/profile')

  return (
    <header className="w-full">
      <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-2 relative">
        {/* ЛЕВО: Monad (иконка + текст) */}
        <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-[3px] bg-white/80" />
          <span className="text-sm">Monad</span>
        </Link>

        {/* ЦЕНТР: динамическая кнопка */}
        <div className="flex justify-center">
          {onProfile ? (
            <Link href="/" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Monad
            </Link>
          ) : (
            <Link href="/profile" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
