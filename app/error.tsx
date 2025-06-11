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
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
        <p className="text-gray-300 mb-4">Error: {error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}