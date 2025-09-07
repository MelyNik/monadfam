'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Пишем в консоль реальную ошибку
    console.error('Profile error:', error)
  }, [error])

  return (
    <div className="min-h-screen max-w-[800px] mx-auto px-6 py-12 text-white">
      <h1 className="text-2xl font-bold mb-3">Profile crashed</h1>
      <p className="text-white/70 mb-6">Error: {error?.message || 'Unknown'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"
      >
        Try again
      </button>
    </div>
  )
}
