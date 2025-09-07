import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'The Monad Fam',
  description: 'Community helper for finding mutuals in Monad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0B12] text-white">
        {/* HEADER: Monad слева, Profile по центру */}
        <header className="w-full">
          <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-2 relative">
            {/* ЛЕВО: Monad (иконка + текст) */}
            <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-[3px] bg-white/80" />
              <span className="text-sm">Monad</span>
            </Link>

            {/* ЦЕНТР: Profile */}
            <div className="flex justify-center">
              <Link
                href="/profile"
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
              >
                Profile
              </Link>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
