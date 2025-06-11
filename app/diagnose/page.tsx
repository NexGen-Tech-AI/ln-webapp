'use client'

import { useEffect, useState } from 'react'

export default function DiagnosePage() {
  const [styles, setStyles] = useState({})
  
  useEffect(() => {
    const root = document.documentElement
    const computedStyles = getComputedStyle(root)
    
    setStyles({
      background: computedStyles.getPropertyValue('--background'),
      foreground: computedStyles.getPropertyValue('--foreground'),
      primary: computedStyles.getPropertyValue('--primary'),
      secondary: computedStyles.getPropertyValue('--secondary'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
    })
  }, [])

  return (
    <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '2rem', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>CSS Diagnostics</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>CSS Variables:</h2>
        <pre style={{ backgroundColor: '#333', padding: '1rem', borderRadius: '0.5rem' }}>
          {JSON.stringify(styles, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Test Elements:</h2>
        <div className="bg-background text-foreground p-4 mb-2 border">
          Using Tailwind classes: bg-background text-foreground
        </div>
        <div className="bg-primary text-primary-foreground p-4 mb-2">
          Using primary colors
        </div>
        <div className="gradient-text text-4xl font-bold mb-2">
          Gradient Text Test
        </div>
      </div>
      
      <div>
        <a href="/" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  )
}