import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title:'The Monad Fam', description:'Find your fam in the Monad community' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>)
}
