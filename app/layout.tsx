import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Monad Fam',
  description: 'Find your fam in the Monad community',
  other: {
    'theme-color': '#0b0b14'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Monad Fam',
    url: 'https://example.com/',
    description: 'Community-driven mutual follows & checks for Monad ecosystem.',
    sameAs: ['https://x.com/mely_nik'],
    inLanguage: 'en'
  }
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
