import { NextResponse } from 'next/server'

export async function GET() {
  // Test user data
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    profession: 'Software Developer',
    company: 'Test Company',
    interests: ['💰 financial planning & wealth building', '💼 career development & networking'],
    tierPreference: 'pro'
  }

  try {
    // Make internal API call to signup
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/signup-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.error || 'Signup failed',
        details: data,
        testUser: { ...testUser, password: '[REDACTED]' }
      }, { status: response.status })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test signup successful!',
      data,
      testUser: { ...testUser, password: '[REDACTED]' }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      testUser: { ...testUser, password: '[REDACTED]' }
    }, { status: 500 })
  }
}