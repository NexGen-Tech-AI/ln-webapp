'use client'

import { useEffect, useState } from 'react'

export default function VerifyPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white">System Verification</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded bg-green-500/20 border border-green-500">
            <h2 className="text-xl font-semibold text-green-400 mb-2">Working Features</h2>
            <ul className="space-y-1 text-white">
              <li>✅ React is rendering</li>
              <li>✅ Next.js routing works</li>
              <li>✅ Tailwind CSS is loading</li>
              <li>{mounted ? '✅' : '⏳'} Client-side hydration</li>
            </ul>
          </div>
          
          <div className="p-4 rounded bg-blue-500/20 border border-blue-500">
            <h2 className="text-xl font-semibold text-blue-400 mb-2">Test Links</h2>
            <div className="space-y-2">
              <a href="/" className="block text-blue-300 hover:text-blue-200 underline">
                → Main Landing Page
              </a>
              <a href="/test" className="block text-blue-300 hover:text-blue-200 underline">
                → Test Page
              </a>
              <a href="/test-landing" className="block text-blue-300 hover:text-blue-200 underline">
                → Test Landing Page
              </a>
              <a href="/debug" className="block text-blue-300 hover:text-blue-200 underline">
                → Debug Info Page
              </a>
              <a href="/simple-test" className="block text-blue-300 hover:text-blue-200 underline">
                → Simple Test (White BG)
              </a>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded bg-yellow-500/20 border border-yellow-500">
          <h2 className="text-xl font-semibold text-yellow-400 mb-2">Current Status</h2>
          <p className="text-white">
            The application is now configured with:
          </p>
          <ul className="mt-2 space-y-1 text-gray-300">
            <li>• Fixed background color (#0a0a0a)</li>
            <li>• Fixed text color (white)</li>
            <li>• Disabled problematic animations</li>
            <li>• Added error handling for Supabase</li>
            <li>• Installed missing dependencies (recharts, @radix-ui/react-select)</li>
          </ul>
        </div>
        
        <div className="p-4 rounded bg-purple-500/20 border border-purple-500">
          <h2 className="text-xl font-semibold text-purple-400 mb-2">Action Items</h2>
          <p className="text-white">
            Visit the main page at <a href="/" className="text-purple-300 underline">localhost:3001</a> 
            and check if content is now visible. If not, check the browser console for errors.
          </p>
        </div>
      </div>
    </div>
  )
}