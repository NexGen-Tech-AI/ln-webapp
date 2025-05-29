import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/services/email'
import { z } from 'zod'

const pilotApplicationSchema = z.object({
  whyPilot: z.string().min(500),
  biggestChallenge: z.string().min(1),
  hoursPerWeek: z.number().min(0),
  commitFeedback: z.boolean(),
  feedbackExplanation: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterHandle: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = pilotApplicationSchema.parse(body)

    // Check if user already has an application
    const { data: existingApp } = await supabase
      .from('pilot_applications')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingApp) {
      return NextResponse.json(
        { error: 'You have already submitted a pilot application' },
        { status: 400 }
      )
    }

    // Create pilot application
    const { data: application, error: appError } = await supabase
      .from('pilot_applications')
      .insert({
        user_id: user.id,
        why_pilot: validatedData.whyPilot,
        biggest_challenge: validatedData.biggestChallenge,
        hours_per_week: validatedData.hoursPerWeek,
        commit_feedback: validatedData.commitFeedback,
        feedback_explanation: validatedData.feedbackExplanation,
        linkedin_url: validatedData.linkedinUrl,
        twitter_handle: validatedData.twitterHandle,
        website_url: validatedData.websiteUrl,
      })
      .select()
      .single()

    if (appError) {
      console.error('Application creation error:', appError)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    // Send confirmation email
    await emailService.sendPilotApplicationConfirmation(user.id)

    // Log the application
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'pilot_application_submitted',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })

    return NextResponse.json(
      { message: 'Application submitted successfully', application },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Pilot application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}