import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { emailService } from '@/services/email'
import { z } from 'zod'

const partnershipSchema = z.object({
  companyName: z.string().min(1),
  website: z.string().url(),
  industry: z.string().min(1),
  contactName: z.string().min(1),
  contactRole: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  companySize: z.string().optional(),
  revenueRange: z.string().optional(),
  partnershipTypes: z.array(z.string()).min(1),
  proposal: z.string().min(1).max(1000),
  expectedVolume: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = partnershipSchema.parse(body)

    // Check for recent submissions from same email (rate limiting)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: recentSubmissions } = await supabaseAdmin
      .from('partnership_requests')
      .select('id')
      .eq('contact_email', validatedData.contactEmail)
      .gte('created_at', oneDayAgo.toISOString())

    if (recentSubmissions && recentSubmissions.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a partnership request recently. Please wait 24 hours before submitting again.' },
        { status: 429 }
      )
    }

    // Create partnership request
    const { data: partnership, error } = await supabaseAdmin
      .from('partnership_requests')
      .insert({
        company_name: validatedData.companyName,
        website: validatedData.website,
        industry: validatedData.industry,
        contact_name: validatedData.contactName,
        contact_role: validatedData.contactRole,
        contact_email: validatedData.contactEmail,
        contact_phone: validatedData.contactPhone,
        company_size: validatedData.companySize,
        revenue_range: validatedData.revenueRange,
        partnership_types: validatedData.partnershipTypes,
        proposal: validatedData.proposal,
        expected_volume: validatedData.expectedVolume,
      })
      .select()
      .single()

    if (error) {
      console.error('Partnership creation error:', error)
      return NextResponse.json(
        { error: 'Failed to submit partnership request' },
        { status: 500 }
      )
    }

    // Send auto-reply email
    await emailService.sendPartnershipAutoReply(partnership.id)

    // Log the submission
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'partnership_request_submitted',
        details: { 
          company: validatedData.companyName,
          email: validatedData.contactEmail 
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })

    return NextResponse.json(
      { message: 'Partnership request submitted successfully', id: partnership.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Partnership request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}