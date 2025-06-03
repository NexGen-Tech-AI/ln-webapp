import { NextRequest, NextResponse } from 'next/server'
import { updateEmailTemplate, welcomeEmailTemplate } from '@/services/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, data } = body

    let html = ''
    
    switch (template) {
      case 'welcome':
        html = welcomeEmailTemplate(
          data.name || 'Friend',
          data.verificationUrl || 'https://lifenav.ai/verify?token=example'
        )
        break
        
      case 'update':
        html = updateEmailTemplate(
          data.title || 'Update Title',
          data.content || 'Your update content goes here...',
          data.ctaText,
          data.ctaUrl,
          data.type || 'announcement'
        )
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid template type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}