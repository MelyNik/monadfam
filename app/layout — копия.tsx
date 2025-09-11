import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Monad',
  description: 'The Monad Fam',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
