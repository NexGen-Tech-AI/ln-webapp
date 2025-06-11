'use client'

export default function TestLandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Landing Page</h1>
      <p className="text-gray-300 mb-8">This is a minimal landing page to test if the app is working.</p>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Section 1</h2>
          <p>If you can see this, the basic React rendering is working.</p>
        </div>
        
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Section 2</h2>
          <p>The issue might be with specific components in the main landing page.</p>
        </div>
      </div>
    </div>
  )
}