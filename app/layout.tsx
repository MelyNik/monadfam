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
        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              {/* маленький ромб как значок */}
              <span className="inline-block h-5 w-5 rounded-md bg-gradient-to-br from-violet-400 to-blue-400" />
              <span className="font-medium">Monad</span>
            </Link>

            <Link
              href="/profile"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
            >
              Profile
            </Link>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
