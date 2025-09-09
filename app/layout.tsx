import './globals.css'
import type { Metadata } from 'next'
import Header from './_components/Header'

export const metadata: Metadata = {
  title: 'The Monad Fam',
  description: 'Community helper for finding mutuals in Monad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0B12] text-white">
        <Header />
        {children}
      </body>
    </html>
  )
}
