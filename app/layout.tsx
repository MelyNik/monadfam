import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Monad',
  description: 'The Monad Fam',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ЛЕВАЯ кнопка "Monad" — оставляем */}
        <header className="fixed top-4 left-6 z-40">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/90"
          >
            Monad
          </Link>
        </header>

        {/* ВАЖНО: центральной кнопки тут больше нет */}
        <main>{children}</main>
      </body>
    </html>
  )
}
